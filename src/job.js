import EventObserver from './events';
import { protobuf, unserialize } from './protobuf';
import { CYCLE_STATUS_ACCEPTED, CYCLE_STATUS_REJECTED } from './_constants';
import { GRID_UNKNOWN_CYCLE_STATUS } from './_errors';
import SyftModel from './syft_model';
import Logger from './logger';

export default class Job {
  constructor({ worker, modelName, modelVersion, gridClient }) {
    this.worker = worker;
    this.modelName = modelName;
    this.modelVersion = modelVersion;
    this.grid = gridClient;
    this.logger = new Logger();
    this.observer = new EventObserver();

    // parameters loaded from grid
    this.model = null;
    this.plans = {};
    this.protocols = {};
    // holds request_key
    this.cycleParams = {};
    this.clientConfig = {};
  }

  on(event, handler) {
    if (['accepted', 'rejected', 'error'].includes(event)) {
      this.observer.subscribe(event, handler.bind(this));
    }
  }

  async initCycle(cycleParams) {
    this.logger.log(
      `Cycle initialization with params: ${JSON.stringify(cycleParams)}`
    );
    this.cycleParams = cycleParams;
    this.clientConfig = cycleParams.client_config;

    // load the model
    const modelData = await this.grid.getModel(
      this.worker.worker_id,
      cycleParams.request_key,
      cycleParams.model_id
    );
    this.model = new SyftModel({
      worker: this.worker,
      modelData
    });

    // load all plans
    for (let planName of Object.keys(cycleParams.plans)) {
      const planId = cycleParams.plans[planName];
      const planBinary = await this.grid.getPlan(
        this.worker.worker_id,
        cycleParams.request_key,
        planId
      );
      this.plans[planName] = unserialize(
        this.worker,
        planBinary,
        protobuf.syft_proto.execution.v1.Plan
      );
    }

    // load all protocols
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

  async start() {
    // speed test
    const { ping, download, upload } = await this.grid.getConnectionSpeed();

    // request cycle
    const cycleParams = await this.grid.requestCycle(
      this.worker.worker_id,
      this.modelName,
      this.modelVersion,
      ping,
      download,
      upload
    );

    switch (cycleParams.status) {
      case CYCLE_STATUS_ACCEPTED:
        // load model, plans, protocols, etc.
        this.logger.log(
          `Accepted into cycle with params: ${JSON.stringify(
            cycleParams,
            null,
            2
          )}`
        );
        await this.initCycle(cycleParams);

        this.observer.broadcast('accepted', {
          model: this.model,
          clientConfig: this.clientConfig
        });
        break;

      case CYCLE_STATUS_REJECTED:
        this.logger.log(
          `Rejected from cycle with timeout: ${cycleParams.timeout}`
        );
        this.observer.broadcast('rejected', {
          timeout: cycleParams.timeout
        });
        break;

      default:
        throw new Error(GRID_UNKNOWN_CYCLE_STATUS(cycleParams.status));
    }
  }

  /**
   * Sends diff to pygrid
   * @param {ArrayBuffer} diff
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
