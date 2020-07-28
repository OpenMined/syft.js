import EventObserver from './events';
import { protobuf, unserialize } from './protobuf';
import { CYCLE_STATUS_ACCEPTED, CYCLE_STATUS_REJECTED } from './_constants';
import { GRID_UNKNOWN_CYCLE_STATUS, PLAN_LOAD_FAILED } from './_errors';
import SyftModel from './syft-model';
import Logger from './logger';

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
   * @param {GridAPIClient} options.gridClient - Instance of GridAPIClient.
   */
  constructor({ worker, modelName, modelVersion, gridClient }) {
    this.worker = worker;
    this.modelName = modelName;
    this.modelVersion = modelVersion;
    this.grid = gridClient;
    this.logger = new Logger();
    this.observer = new EventObserver();

    // Parameters to be loaded from PyGrid
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
      this.worker.worker_id,
      cycleParams.request_key,
      cycleParams.model_id
    );
    this.model = new SyftModel({
      worker: this.worker,
      modelData,
    });

    // Load all plans
    for (let planName of Object.keys(cycleParams.plans)) {
      const planId = cycleParams.plans[planName];
      const planBinary = await this.grid.getPlan(
        this.worker.worker_id,
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
        throw new Error(PLAN_LOAD_FAILED(planName, e.message));
      }
    }

    // Load all protocols
    for (let protocolName of Object.keys(cycleParams.protocols)) {
      const protocolId = cycleParams.protocols[protocolName];
      const protocolBinary = await this.grid.getProtocol(
        this.worker.worker_id,
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
      let [ping, download, upload] = [0, 0, 0];
      // Test connection speed if required
      if (this.worker.requires_speed_test) {
        ({ ping, download, upload } = await this.grid.getConnectionSpeed(
          this.worker.worker_id
        ));
      }

      // Client request to join an active federated learning cycle on PyGrid
      cycleParams = await this.grid.requestCycle(
        this.worker.worker_id,
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
        throw new Error(GRID_UNKNOWN_CYCLE_STATUS(cycleParams.status));
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

    // Trigger events for acacepted or rejected outside the try/catch.
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
   * Submits the model diff to PyGrid.
   *
   * @param {ArrayBuffer} diff - Serialized difference between original and trained model parameters.
   * @returns {Promise<void>}
   */
  async report(diff) {
    await this.grid.submitReport(
      this.worker.worker_id,
      this.cycleParams.request_key,
      Buffer.from(diff).toString('base64')
    );
  }
}
