import EventObserver from './events';
import { protobuf, unserialize } from './protobuf';
import { base64Encode } from './utils/base64';
import { CYCLE_STATUS_ACCEPTED, CYCLE_STATUS_REJECTED } from './_constants';
import { GridUnknownCycleStatusError, PlanLoadFailedError } from './_errors';
import SyftModel from './syft-model';
import Logger from './logger';
import { PlanTrainer } from './plan-trainer';

/**
 * Job represents a single training cycle done by the client.
 *
 * @property {Object.<string, Plan>} plans - Plans dictionary.
 * @property {Object.<string, Protocol>} protocols - [not implemented] Protocols dictionary.
 * @property {SyftModel} model - Model.
 */
export default class Job {
  /**
   * @hideconstructor
   * @param {object} options
   * @param {Syft} options.worker - Instance of Syft client.
   * @param {string} options.modelName - Model name.
   * @param {string} options.modelVersion - Model version.
   * @param {string} options.authToken - Authentication token for the model.
   * @param {GridAPIClient} options.gridClient - Instance of GridAPIClient.
   */
  constructor({ worker, modelName, modelVersion, authToken, gridClient }) {
    this.worker = worker;
    this.modelName = modelName;
    this.modelVersion = modelVersion;
    this.authToken = authToken;
    this.grid = gridClient;
    this.logger = new Logger();
    this.observer = new EventObserver();

    // Parameters to be loaded from PyGrid
    this.worker_id = null;
    this.requires_speed_test = false;
    this.model = null;
    this.plans = {};
    this.protocols = {};
    // Parameter for hosting request_key
    this.cycleParams = {};
    this.clientConfig = {};
  }

  /**
   * Registers an event listener to the Job's event observer.
   *
   * Available events: `accepted`, `rejected`, `error`.
   *
   * @param {string} event - Event name.
   * @param {Function} handler - Event listener.
   */
  on(event, handler) {
    if (['accepted', 'rejected', 'error'].includes(event)) {
      this.observer.subscribe(event, handler.bind(this));
    }
  }

  /**
   * Initializes the Job with provided training cycle params and
   * downloads the model, plans, and protocols from PyGrid.
   *
   * @private
   * @param {Object} cycleParams
   * @returns {Promise<void>}
   */
  async initCycle(cycleParams) {
    this.logger.log(
      `Cycle initialization with params: ${JSON.stringify(cycleParams)}`
    );
    this.cycleParams = cycleParams;
    this.clientConfig = cycleParams.client_config;

    // Load model
    const modelData = await this.grid.getModel(
      this.worker_id,
      cycleParams.request_key,
      cycleParams.model_id
    );
    this.model = new SyftModel({
      worker: this.worker,
      serializedModelParameters: modelData,
    });

    // Load all plans
    for (let planName of Object.keys(cycleParams.plans)) {
      const planId = cycleParams.plans[planName];
      const planBinary = await this.grid.getPlan(
        this.worker_id,
        cycleParams.request_key,
        planId
      );
      try {
        this.plans[planName] = unserialize(
          this.worker,
          planBinary,
          protobuf.syft_proto.execution.v1.Plan
        );
      } catch (e) {
        throw new PlanLoadFailedError(planName, e.message);
      }
    }

    // Load all protocols
    for (let protocolName of Object.keys(cycleParams.protocols)) {
      const protocolId = cycleParams.protocols[protocolName];
      const protocolBinary = await this.grid.getProtocol(
        this.worker_id,
        cycleParams.request_key,
        protocolId
      );
      this.protocols[protocolName] = unserialize(
        this.worker,
        protocolBinary,
        protobuf.syft_proto.execution.v1.Protocol
      );
    }
  }

  /**
   * Starts the Job by executing following actions:
   *  * Authenticates for given FL model.
   *  * Meters connection speed to PyGrid (if requested by PyGrid).
   *  * Registers into training cycle on PyGrid.
   *  * Retrieves cycle and client parameters.
   *  * Downloads the model, plans, protocols from PyGrid.
   *  * Fires `accepted` event on success.
   *
   * @fires Job#accepted
   * @fires Job#rejected
   * @fires Job#error
   * @returns {Promise<void>}
   */
  async start() {
    let cycleParams;

    try {
      // Authenticate
      const authResponse = await this.grid.authenticate(
        this.modelName,
        this.modelVersion,
        this.authToken
      );
      this.worker_id = authResponse.worker_id;
      // True if PyGrid requested to meter the speed
      this.requires_speed_test = authResponse.requires_speed_test || false;

      let [ping, download, upload] = [0, 0, 0];
      // Test connection speed if required
      if (this.requires_speed_test) {
        ({ ping, download, upload } = await this.grid.getConnectionSpeed(
          this.worker_id
        ));
      }

      // Client request to join an active federated learning cycle on PyGrid
      cycleParams = await this.grid.requestCycle(
        this.worker_id,
        this.modelName,
        this.modelVersion,
        ping,
        download,
        upload
      );

      // If the client's job request is accepted, load the model, plans, protocols, etc.
      if (cycleParams.status === CYCLE_STATUS_ACCEPTED) {
        this.logger.log(
          `Accepted into cycle with params: ${JSON.stringify(
            cycleParams,
            null,
            2
          )}`
        );
        await this.initCycle(cycleParams);
      }

      // Throw an error if the request is neither accepted nor rejected
      if (
        ![CYCLE_STATUS_ACCEPTED, CYCLE_STATUS_REJECTED].includes(
          cycleParams.status
        )
      ) {
        throw new GridUnknownCycleStatusError(cycleParams.status);
      }
    } catch (error) {
      /**
       * `error` event.
       * Triggered for plethora of error conditions.
       *
       * @event Job#error
       */
      this.observer.broadcast('error', error);
      return;
    }

    // Trigger accepted or rejected event outside try/catch.
    switch (cycleParams.status) {
      case CYCLE_STATUS_ACCEPTED:
        /**
         * `accepted` event.
         * Triggered when PyGrid accepts the client into training cycle.
         *
         * @event Job#accepted
         * @type {Object}
         * @property {SyftModel} model - Instance of SyftModel.
         * @property {Object} clientConfig - Client configuration returned by PyGrid.
         */
        this.observer.broadcast('accepted', {
          model: this.model,
          clientConfig: this.clientConfig,
        });
        break;

      case CYCLE_STATUS_REJECTED:
        this.logger.log(
          `Rejected from cycle with timeout: ${cycleParams.timeout}`
        );

        /**
         * `rejected` event.
         * Triggered when PyGrid rejects the client.
         *
         * @event Job#rejected
         * @type {Object}
         * @property {number|null} timeout - Time in seconds to retry. Empty when the FL model is not trainable anymore.
         */
        this.observer.broadcast('rejected', {
          timeout: cycleParams.timeout,
        });
        break;
    }
  }

  /**
   * Alias for `Job.start`
   *
   * @see Job.start
   * @returns {Promise<void>}
   */
  async request() {
    return this.start();
  }

  /**
   * Submits the model diff to PyGrid.
   *
   * @param {ArrayBuffer} diff - Serialized difference between original and trained model parameters.
   * @returns {Promise<void>}
   */
  async report(diff) {
    await this.grid.submitReport(
      this.worker_id,
      this.cycleParams.request_key,
      base64Encode(diff)
    );
  }

  /**
   * Trains the model against specified plan and using specified parameters.
   * Returns `PlanTrainer` object to have a handle on training process.
   *
   * @param {string} trainingPlan - Training Plan name.
   * @param {Object} parameters - Dictionary of training parameters.
   * @param {[PlanInputSpec]}  parameters.inputs - List of training Plan input arguments
   * @param {[PlanOutputSpec]} parameters.outputs - List of training Plan outputs
   * @param {tf.Tensor} parameters.data - Tensor containing training data
   * @param {tf.Tensor} parameters.target - Tensor containing training targets
   * @param {number} [parameters.epochs] - Epochs to train (if not specified, taken from Job)
   * @param {number} [parameters.batchSize] - Batch size (if not specified, taken from Job)
   * @param {number} [parameters.stepsPerEpoch] - Max number of steps per epoch (if not specified, taken from Job)
   * @param {PlanTrainerCheckpoint} [parameters.checkpoint] - Checkpoint
   * @param {Object} [parameters.events] - List of event listeners
   * @param {Function} [parameters.events.start] - On training start listener
   * @param {Function} [parameters.events.end] - On training end listener
   * @param {Function} [parameters.events.epochStart] - On epoch start listener
   * @param {Function} [parameters.events.epochEnd] - On epoch end listener
   * @param {Function} [parameters.events.batchStart] - On batch start listener
   * @param {Function} [parameters.events.batchEnd] - On batch end listener
   * @returns {PlanTrainer}
   */
  train(trainingPlan, parameters) {
    const trainingParams = {
      clientConfig: this.clientConfig,
      batchSize: this.clientConfig.batch_size,
      epochs: this.clientConfig.max_epochs || 1,
      stepsPerEpoch: this.clientConfig.max_updates || null,
      ...parameters,
    };

    const trainer = new PlanTrainer({
      worker: this.worker,
      plan: this.plans[trainingPlan],
      model: this.model,
      ...trainingParams,
    });

    // For convenience of assigning event handlers, start training in the next macrotask
    setTimeout(() => {
      trainer.start(typeof parameters.checkpoint !== 'undefined');
    }, 0);
    return trainer;
  }
}
