import EventObserver from './events';
import { protobuf, unserialize } from './protobuf';
import { CYCLE_STATUS_ACCEPTED, CYCLE_STATUS_REJECTED } from './_constants';
import { GRID_UNKNOWN_CYCLE_STATUS } from './_errors';

export default class Job {
  constructor({ worker, modelId, modelVersion, gridClient, logger }) {
    this.worker = worker;
    this.modelId = modelId;
    this.modelVersion = modelVersion;
    this.grid = gridClient;
    this.plans = {};
    this.protocols = {};
    // holds request_key
    this.cycleParams = {};
    this.clientConfig = {};
    this.logger = logger;
    this.observer = new EventObserver();
  }

  on(event, handler) {
    this.observer.subscribe(event, handler);
  }

  async initCycle(cycleParams) {
    this.logger.log(
      `Cycle initialization with params: ${JSON.stringify(cycleParams)}`
    );
    this.cycleParams = cycleParams;
    this.clientConfig = cycleParams.client_config;

    // load all plans
    for (let planName of Object.keys(cycleParams.plans)) {
      const planId = cycleParams.plans[planName];
      const planBinary = await this.grid.getPlan(
        this.worker.id,
        cycleParams.request_key,
        planId
      );
      this.plans[planName] = unserialize(
        this.worker,
        planBinary,
        protobuf.syft_proto.messaging.v1.Plan
      );
    }

    // load all protocols
    for (let protocolName of Object.keys(cycleParams.protocols)) {
      const protocolId = cycleParams.protocols[protocolName];
      const protocolBinary = await this.grid.getProtocol(
        this.worker.id,
        cycleParams.request_key,
        protocolId
      );
      this.protocols[protocolName] = unserialize(
        this.worker,
        protocolBinary,
        protobuf.syft_proto.messaging.v1.Protocol
      );
    }
  }

  async start() {
    // request cycle
    const cycleParams = await this.grid.requestCycle(
      this.worker.id,
      this.modelId
    );

    let model;
    switch (cycleParams.status) {
      case CYCLE_STATUS_ACCEPTED:
        // load plans, protocols, etc.
        this.initCycle(cycleParams);

        // load model
        model = await this.worker.loadModel({
          requestKey: cycleParams.request_key,
          modelId: cycleParams.model_id
        });

        this.observer.broadcast('ready', {
          job: this,
          model,
          clientConfig: this.clientConfig
        });
        break;

      case CYCLE_STATUS_REJECTED:
        this.logger.log(
          `Rejected from cycle with timeout: ${cycleParams.timeout}`
        );
        // wait
        await new Promise(resolve => setTimeout(resolve, cycleParams.timeout));
        await this.start();
        break;

      default:
        throw new Error(GRID_UNKNOWN_CYCLE_STATUS(cycleParams.status));
    }
  }

  async report(data) {
    await this.grid.submitReport(
      this.worker.id,
      this.cycleParams.request_key,
      data
    );
  }
}
