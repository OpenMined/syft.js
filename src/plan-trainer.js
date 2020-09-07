import EventObserver from './events';
import Logger from './logger';
import * as tf from '@tensorflow/tfjs-core';
import { PlanInputSpec, PlanOutputSpec } from './types/plan';
import SyftModel from './syft-model';

/**
 * Class that contains training loop logic.
 *
 * @param plan {Syft} - Syft Worker
 * @param plan {Plan} - Training Plan to execute
 * @param planInputs {[PlanInputSpec]} - Plan input specification
 * @param planOutputs {[PlanOutputSpec]} - Plan output specification
 * @param model {SyftModel} - Model to train
 * @param data {tf.Tensor} - Training data
 * @param target {tf.Tensor} - Training labels
 * @param epochs {number} - Number of epochs
 * @param batchSize {number} - Batch size
 * @param stepsPerEpoch {number} - Optional max number of steps in epoch
 * @param events {Object} - Dictionary of events
 */
export class PlanTrainer {
  static EVENT_TRAINING_START = 'start';
  static EVENT_TRAINING_END = 'end';
  static EVENT_EPOCH_START = 'epochStart';
  static EVENT_EPOCH_END = 'epochEnd';
  static EVENT_BATCH_START = 'batchStart';
  static EVENT_BATCH_END = 'batchEnd';

  constructor({
    worker,
    plan,
    planInputs,
    planOutputs,
    model,
    data,
    target,
    epochs,
    batchSize,
    stepsPerEpoch,
    events,
  }) {
    this.worker = worker;

    this.plan = plan;
    this.planInputs = planInputs;
    this.planOutputs = planOutputs;

    this.originalModel = model;

    this.data = data;
    this.target = target;

    this.epochs = epochs || 1;
    this.batchSize = batchSize;
    this.stepsPerEpoch = stepsPerEpoch;
    this.events = events;

    this.logger = new Logger();
    this.observer = new EventObserver();

    // State
    this.currentModel = null;
    this.epoch = null;
    this.batchIdx = null;

    // Register event handlers.
    if (events && typeof events === 'object') {
      for (let eventName of Object.keys(events)) {
        this.on(eventName, events[eventName]);
      }
    }
  }

  /**
   * Registers an event listener to the PlanTrainer's event observer.
   *
   * Available events: `start`, `end`, `epochStart`, `epochEnd`, `batchStart`, `batchEnd`.
   *
   * @param {string} event - Event name.
   * @param {Function} handler - Event listener.
   */
  on(event, handler) {
    let events = [
      PlanTrainer.EVENT_TRAINING_START,
      PlanTrainer.EVENT_TRAINING_END,
      PlanTrainer.EVENT_EPOCH_START,
      PlanTrainer.EVENT_EPOCH_END,
      PlanTrainer.EVENT_BATCH_START,
      PlanTrainer.EVENT_BATCH_END,
    ];
    if (events.includes(event)) {
      this.observer.subscribe(event, handler.bind(this));
    }
  }

  /**
   * Starts the training loop.
   */
  async start() {
    // Number of batches in data
    const numBatches = Math.floor(this.data.shape[0] / this.batchSize);

    // Copy model params to preserve original.
    let modelParams = this.originalModel.params.map((p) => p.clone());

    this.observer.broadcast(PlanTrainer.EVENT_TRAINING_START, {});

    // Main training loop.
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      this.epoch = epoch;
      this.observer.broadcast(PlanTrainer.EVENT_EPOCH_START, { epoch });

      for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
        this.observer.broadcast(PlanTrainer.EVENT_BATCH_START, {
          epoch,
          batch: batchIdx,
        });

        // Slice a batch.
        // TODO: replace with Dataloader
        const dataBatch = tf.slice(
          this.data,
          batchIdx * this.batchSize,
          this.batchSize
        );
        const targetBatch = tf.slice(
          this.target,
          batchIdx * this.batchSize,
          this.batchSize
        );

        // Prepare data for Plan arguments
        let argData = {};
        argData[PlanInputSpec.TYPE_BATCH_SIZE] = this.batchSize;
        argData[PlanInputSpec.TYPE_DATA] = dataBatch;
        argData[PlanInputSpec.TYPE_TARGET] = targetBatch;
        argData[PlanInputSpec.TYPE_MODEL_PARAM] = modelParams;

        // Execute the Plan
        const planArgs = PlanInputSpec.resolve(this.planInputs, argData);
        const planRawOutput = await this.plan.execute(this.worker, ...planArgs);
        const output = PlanOutputSpec.resolve(this.planOutputs, planRawOutput);

        // Set updated model params for the next run.
        if (
          Object.hasOwnProperty.call(output, PlanOutputSpec.TYPE_MODEL_PARAM)
        ) {
          const updatedModelParams = output[PlanOutputSpec.TYPE_MODEL_PARAM];
          for (let i = 0; i < updatedModelParams.length; i++) {
            modelParams[i].dispose();
            modelParams[i] = updatedModelParams[i];
          }
        }

        // Update current model.
        this.currentModel = new SyftModel({
          worker: this.worker,
          modelParameters: modelParams,
        });

        // Populate loss/metrics into status.
        const status = { epoch, batch: batchIdx };
        if (Object.hasOwnProperty.call(output, PlanOutputSpec.TYPE_LOSS)) {
          status['loss'] = await output[PlanOutputSpec.TYPE_LOSS].array();
        }
        if (Object.hasOwnProperty.call(output, PlanOutputSpec.TYPE_METRIC)) {
          status['metrics'] = {};
          for (let metric of Object.keys(output[PlanOutputSpec.TYPE_METRIC])) {
            status['metrics'][metric] = await output[
              PlanOutputSpec.TYPE_METRIC
            ][metric].array();
          }
        }

        // Free mem.
        dataBatch.dispose();
        targetBatch.dispose();

        this.observer.broadcast(PlanTrainer.EVENT_BATCH_END, status);

        await tf.nextFrame();

        // Limits number of steps per epoch
        if (
          typeof this.stepsPerEpoch === 'number' &&
          batchIdx >= this.stepsPerEpoch
        )
          break;
      }

      this.observer.broadcast(PlanTrainer.EVENT_EPOCH_END, { epoch });
    }

    this.observer.broadcast(PlanTrainer.EVENT_TRAINING_END, {});
  }
}
