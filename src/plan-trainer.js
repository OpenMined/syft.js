import EventObserver from './events';
import Logger from './logger';
import { PlanInputSpec, PlanOutputSpec } from './types/plan';
import SyftModel from './syft-model';
import { base64Encode, base64Decode } from './utils/base64';

import * as tf from '@tensorflow/tfjs-core';
import { DataLoader } from './data';

/**
 * Class that contains training loop logic.
 *
 * @property {SyftModel} originalModel - Original model.
 * @property {SyftModel} currentModel - Trained model.
 * @property {number} epoch - Current epoch.
 * @property {number} batchIdx - Current batch.
 * @property {boolean} stopped - Is the training currently stopped.
 */
export class PlanTrainer {
  static EVENT_TRAINING_START = 'start';
  static EVENT_TRAINING_END = 'end';
  static EVENT_TRAINING_STOP = 'stop';
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
   * @param {DataLoader|tf.Tensor} parameters.data - DataLoader or plain tensor containing training data.
   * @param {tf.Tensor} [parameters.target] - Training labels (optional if `data` is DataLoader).
   * @param {number} parameters.epochs - Number of epochs.
   * @param {number} [parameters.batchSize] - Batch size. Optional if `data` is DataLoader.
   * @param {number} [parameters.stepsPerEpoch] - Optional max number of steps in epoch.
   * @param {Object} [parameters.clientConfig] - Optional dictionary of additional client configuration parameters.
   * @param {Object} [parameters.checkpoint] - Checkpoint.
   * @param {Object} [parameters.events] - Optional dictionary of events.
   * @param {Function} [parameters.events.start] - Training start event handler.
   * @param {Function} [parameters.events.end] - Training end event handler.
   * @param {Function} [parameters.events.stop] - Training stop event handler.
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
    checkpoint = null,
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
    this.batchSize = data instanceof DataLoader ? data.batchSize : batchSize;
    this.stepsPerEpoch = stepsPerEpoch;
    this.clientConfig = clientConfig;
    this.events = events;

    this.logger = new Logger();
    this.observer = new EventObserver();

    // State
    this.currentModel = null;
    this.epoch = 0;
    this.batchIdx = 0;
    this.stopped = false;

    // Register event handlers.
    if (events && typeof events === 'object') {
      for (let eventName of Object.keys(events)) {
        this.on(eventName, events[eventName]);
      }
    }

    if (checkpoint) {
      this.applyCheckpoint(checkpoint);
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
      PlanTrainer.EVENT_TRAINING_STOP,
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
   * @fires PlanTrainer#stop
   * @fires PlanTrainer#epochStart
   * @fires PlanTrainer#epochEnd
   * @fires PlanTrainer#batchStart
   * @fires PlanTrainer#batchEnd
   */
  async start(resume = false) {
    let startEpoch = 0;
    let startBatch = 0;
    let startModel = this.originalModel;

    if (this.stopped && resume) {
      this.stopped = false;
      startEpoch = this.epoch;
      startBatch = this.batchIdx;
      startModel = this.currentModel;
    }

    // Copy model params to preserve original.
    let modelParams = startModel.params.map((p) => p.clone());

    /**
     * `start` event.
     * Triggered on training start.
     * @event PlanTrainer#start
     * @type {Object}
     */
    this.observer.broadcast(PlanTrainer.EVENT_TRAINING_START, {});

    // Main training loop.
    for (let epoch = startEpoch; epoch < this.epochs; epoch++) {
      this.epoch = epoch;
      this.batchIdx = startBatch;
      // Reset start batch after it is used
      startBatch = 0;

      /**
       * `epochStart` event.
       * Triggered before epoch start.
       * @event PlanTrainer#epochStart
       * @type {Object}
       * @property {number} epoch - Current epoch.
       */
      this.observer.broadcast(PlanTrainer.EVENT_EPOCH_START, { epoch });
      if (this._isStopped()) {
        return;
      }

      let batch;
      while ((batch = this._nextBatch()) !== undefined) {
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
          batch: this.batchIdx,
        });
        if (this._isStopped()) {
          return;
        }

        // Prepare data for Plan arguments
        let argData = {};
        argData[PlanInputSpec.TYPE_BATCH_SIZE] = this.batchSize;
        argData[PlanInputSpec.TYPE_MODEL_PARAM] = modelParams;
        argData[PlanInputSpec.TYPE_CLIENT_CONFIG_PARAM] = this.clientConfig;
        if (this.data instanceof DataLoader) {
          argData[PlanInputSpec.TYPE_DATA] = batch;
        } else {
          argData[PlanInputSpec.TYPE_DATA] = batch[0];
          argData[PlanInputSpec.TYPE_TARGET] = batch[1];
        }

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
        const status = { epoch, batch: this.batchIdx };
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
        batch.map((item) => item.dispose());

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
          this.batchIdx >= this.stepsPerEpoch
        ) {
          break;
        }

        this.batchIdx++;
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

  /**
   * @private
   */
  _isStopped() {
    // Stop training
    if (this.stopped) {
      /**
       * `stop` event.
       * Triggered when training was stopped.
       * @event PlanTrainer#stop
       * @property {Object}
       */
      this.observer.broadcast(PlanTrainer.EVENT_TRAINING_STOP, {});
      return true;
    }
    return false;
  }

  /**
   * Returns the next batch of data from DataLoader or tensor.
   * @return {tf.Tensor[]|undefined}
   * @private
   */
  _nextBatch() {
    if (this.data instanceof DataLoader) {
      if (!this.dataIterator) {
        this.dataIterator = this.data[Symbol.iterator]();
      }

      // Stop if current batch is larger than data length
      if (this.batchIdx >= this.data.length) {
        return undefined;
      }

      return this.dataIterator.next().value;
    } else {
      // Number of batches in data
      const numBatches = Math.floor(this.data.shape[0] / this.batchSize);
      // Stop if current batch is larger than data length
      if (this.batchIdx >= numBatches) {
        return undefined;
      }

      // Slice a batch.
      const dataBatch = tf.slice(
        this.data,
        this.batchIdx * this.batchSize,
        this.batchSize
      );
      const targetBatch = tf.slice(
        this.target,
        this.batchIdx * this.batchSize,
        this.batchSize
      );
      return [dataBatch, targetBatch];
    }
  }

  /**
   * Stops training loop and returns training checkpoint.
   *
   * @returns {Promise<PlanTrainerCheckpoint>}
   */
  stop() {
    return new Promise((resolve) => {
      this.observer.subscribe(
        PlanTrainer.EVENT_TRAINING_STOP,
        () => {
          resolve(this.createCheckpoint());
        },
        1
      );
      this.stopped = true;
    });
  }

  /**
   * Resume stopped training process.
   */
  async resume() {
    if (this.stopped) {
      await this.start(true);
    }
  }

  /**
   * Creates checkpoint using current training state.
   *
   * @return {PlanTrainerCheckpoint}
   */
  createCheckpoint() {
    return new PlanTrainerCheckpoint({
      epochs: this.epochs,
      stepsPerEpoch: this.stepsPerEpoch,
      batchSize: this.batchSize,
      clientConfig: this.clientConfig,
      originalModel: this.originalModel,
      epoch: this.epoch,
      batch: this.batchIdx,
      currentModel: this.currentModel,
    });
  }

  /**
   * Restores `PlanTrainer` state from checkpoint.
   *
   * @param {PlanTrainerCheckpoint} checkpoint
   */
  applyCheckpoint(checkpoint) {
    // Set values from checkpoint
    this.epochs = checkpoint.epochs;
    this.epoch = checkpoint.epoch;
    this.stepsPerEpoch = checkpoint.stepsPerEpoch;
    this.batchIdx = checkpoint.batch;
    this.batchSize = checkpoint.batchSize;
    this.currentModel = checkpoint.currentModel;
    this.clientConfig = checkpoint.clientConfig;

    // Mark training as stopped
    this.stopped = true;
  }
}

/**
 * Object that stores `PlanTrainer` state, to resume training from it.
 *
 * @param {Object} parameters - Dictionary of parameters
 * @param {number} parameters.epochs - Total number of epochs
 * @param {number} [parameters.stepsPerEpoch] - Max steps per epoch
 * @param {number} parameters.batchSize - Batch size
 * @param {Object} parameters.clientConfig - Client config
 * @param {number} parameters.epoch - Current epoch
 * @param {number} parameters.batch - Current batch number
 * @param {SyftModel} parameters.currentModel - Current state of the Model
 */
export class PlanTrainerCheckpoint {
  constructor({
    epochs,
    stepsPerEpoch,
    batchSize,
    clientConfig,
    epoch,
    batch,
    currentModel,
  }) {
    this.epochs = epochs;
    this.stepsPerEpoch = stepsPerEpoch;
    this.batchSize = batchSize;
    this.clientConfig = clientConfig;
    this.epoch = epoch;
    this.batch = batch;
    this.currentModel = currentModel;
  }

  /**
   * Returns `PlanTrainerCheckpoint` serialized to plain Object.
   *
   * @return {Promise<Object>}
   */
  async toJSON() {
    return {
      epochs: this.epochs,
      stepsPerEpoch: this.stepsPerEpoch,
      batchSize: this.batchSize,
      clientConfig: this.clientConfig || {},
      epoch: this.epoch,
      batch: this.batch,
      currentModelBase64: base64Encode(await this.currentModel.toProtobuf()),
    };
  }

  /**
   * Creates `PlanTrainerCheckpoint` from object.
   *
   * @param {Syft} worker - Syft Worker
   * @param {Object} obj - Object containing checkpoint data
   * @return {PlanTrainerCheckpoint}
   */
  static fromJSON(worker, obj) {
    const currentModel = new SyftModel({
      worker,
      serializedModelParameters: base64Decode(obj.currentModelBase64),
    });
    return new PlanTrainerCheckpoint({
      ...obj,
      currentModel,
    });
  }
}
