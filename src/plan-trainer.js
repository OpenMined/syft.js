import EventObserver from './events';
import Logger from './logger';
import * as tf from '@tensorflow/tfjs-core';
import { PlanInputSpec, PlanOutputSpec } from './types/plan';
import SyftModel from './syft-model';

/**
 * Class that contains training loop logic.
 *
 * @property {SyftModel} originalModel - Original model.
 * @property {SyftModel} currentModel - Trained model.
 * @property {number} epoch - Current epoch.
 * @property {number} batchIdx - Current batch.
 */
export class PlanTrainer {
  static EVENT_TRAINING_START = 'start';
  static EVENT_TRAINING_END = 'end';
  static EVENT_EPOCH_START = 'epochStart';
  static EVENT_EPOCH_END = 'epochEnd';
  static EVENT_BATCH_START = 'batchStart';
  static EVENT_BATCH_END = 'batchEnd';

  /**
   * @hideconstructor
   * @param {Object} parameters - Dictionary of training parameters.
   * @param {Syft} parameters.worker - Syft Worker.
   * @param {Plan} parameters.plan - Training Plan to execute.
   * @param {[PlanInputSpec]} parameters.inputs - Plan input specification.
   * @param {[PlanOutputSpec]} parameters.outputs - Plan output specification.
   * @param {SyftModel} parameters.model - Model to train.
   * @param {tf.Tensor} parameters.data - Training data.
   * @param {tf.Tensor} parameters.target - Training labels.
   * @param {number} parameters.epochs - Number of epochs.
   * @param {number} parameters.batchSize - Batch size.
   * @param {number} [parameters.stepsPerEpoch] - Optional max number of steps in epoch.
   * @param {Object} [parameters.clientConfig] - Optional dictionary of additional client configuration parameters.
   * @param {Object} [parameters.events] - Optional dictionary of events.
   * @param {Function} [parameters.events.start] - Training start event handler.
   * @param {Function} [parameters.events.end] - Training end event handler.
   * @param {Function} [parameters.events.epochStart] - Training epoch start event handler.
   * @param {Function} [parameters.events.epochEnd] - Training epoch end event handler.
   * @param {Function} [parameters.events.batchStart] - Training batch start event handler.
   * @param {Function} [parameters.events.batchEnd] - Training batch end event handler.
   */
  constructor({
    worker,
    plan,
    inputs,
    outputs,
    model,
    data,
    target,
    epochs,
    batchSize,
    stepsPerEpoch = null,
    clientConfig = {},
    events = {},
  }) {
    this.worker = worker;

    this.plan = plan;
    this.planInputs = inputs;
    this.planOutputs = outputs;

    this.originalModel = model;

    this.data = data;
    this.target = target;

    this.epochs = epochs || 1;
    this.batchSize = batchSize;
    this.stepsPerEpoch = stepsPerEpoch;
    this.clientConfig = clientConfig;
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
   *
   * @fires PlanTrainer#start
   * @fires PlanTrainer#end
   * @fires PlanTrainer#epochStart
   * @fires PlanTrainer#epochEnd
   * @fires PlanTrainer#batchStart
   * @fires PlanTrainer#batchEnd
   */
  async start() {
    // Number of batches in data
    const numBatches = Math.floor(this.data.shape[0] / this.batchSize);

    // Copy model params to preserve original.
    let modelParams = this.originalModel.params.map((p) => p.clone());

    /**
     * `start` event.
     * Triggered on training start.
     * @event PlanTrainer#start
     * @type {Object}
     */
    this.observer.broadcast(PlanTrainer.EVENT_TRAINING_START, {});

    // Main training loop.
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      this.epoch = epoch;
      this.batchIdx = 0;

      /**
       * `epochStart` event.
       * Triggered before epoch start.
       * @event PlanTrainer#epochStart
       * @type {Object}
       * @property {number} epoch - Current epoch.
       */
      this.observer.broadcast(PlanTrainer.EVENT_EPOCH_START, { epoch });

      for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
        this.batchIdx = batchIdx;

        /**
         * `batchStart` event.
         * Triggered before batch start.
         * @event PlanTrainer#batchStart
         * @type {Object}
         * @property {number} epoch - Current epoch.
         * @property {number} batch - Current batch.
         */
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
        argData[PlanInputSpec.TYPE_CLIENT_CONFIG_PARAM] = this.clientConfig;

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

        /**
         * `batchEnd` event.
         * Triggered after batch end.
         * @event PlanTrainer#batchEnd
         * @type {Object}
         * @property {number} epoch - Current epoch.
         * @property {number} batch - Current batch.
         * @property {number} [loss] - Batch loss.
         * @property {Object} [metrics] - Dictionary containing metrics (if any defined in the `outputs`).
         */
        this.observer.broadcast(PlanTrainer.EVENT_BATCH_END, status);

        // Process other browser events.
        await tf.nextFrame();

        // Limits number of steps per epoch
        if (
          typeof this.stepsPerEpoch === 'number' &&
          batchIdx >= this.stepsPerEpoch
        )
          break;
      }

      /**
       * `epochEnd` event.
       * Triggered after epoch end.
       * @event PlanTrainer#epochEnd
       * @property {number} epoch - Current epoch.
       */
      this.observer.broadcast(PlanTrainer.EVENT_EPOCH_END, { epoch });
    }

    /**
     * `end` event.
     * Triggered after training end.
     * @event PlanTrainer#end
     */
    this.observer.broadcast(PlanTrainer.EVENT_TRAINING_END, {});
  }
}
