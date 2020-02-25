import EventObserver from './events';
import { protobuf, unserialize } from './protobuf';

export default class Job {
  constructor({ worker, modelId, modelVersion, gridClient, logger }) {
    this.worker = worker;
    this.modelId = modelId;
    this.modelVersion = modelVersion;
    this.grid = gridClient;
    this.plans = {};
    this.protocols = {};
    this.cycleConfig = {};
    this.clientConfig = {};
    this.logger = logger;
    this.observer = new EventObserver();
  }

  on(event, handler) {
    this.observer.subscribe(event, handler);
  }

  initCycle(cycleConfig) {
    this.logger.log(
      `Cycle initialization with params: ${JSON.stringify(cycleConfig)}`
    );
    this.cycleConfig = cycleConfig;
    this.clientConfig = cycleConfig.client_config;

    // load all plans
    const plans = [];
    for (let planName of Object.keys(cycleConfig.plans)) {
      const planId = cycleConfig.plans[planName];
      const plan = this.grid
        .getPlan(this.worker.id, cycleConfig.request_key, planId)
        .then(data => ({
          name: planName,
          value: unserialize(
            this.worker,
            data,
            protobuf.syft_proto.messaging.v1.Plan
          )
        }));
      plans.push(plan);
    }

    // load all protocols
    const protocols = [];
    for (let protocolName of Object.keys(cycleConfig.protocols)) {
      const protocolId = cycleConfig.protocols[protocolName];
      const protocol = this.grid
        .getProtocol(this.worker.id, cycleConfig.request_key, protocolId)
        .then(data => ({
          name: protocolName,
          value: unserialize(
            this.worker,
            data,
            protobuf.syft_proto.messaging.v1.Protocol
          )
        }));
      protocols.push(protocol);
    }

    // return model, plans, protocols
    const result = [
      this.worker.loadModel({
        requestKey: cycleConfig.request_key,
        modelId: cycleConfig.model_id
      }),
      Promise.all(plans),
      Promise.all(protocols)
    ];

    return Promise.all(result);
  }

  start() {
    this.grid
      .requestCycle(this.worker.id, this.modelId)
      .then(this.initCycle.bind(this))
      .then(result => {
        const [model, plans, protocols] = result;
        plans.forEach(item => {
          this.plans[item.name] = item.value;
        });
        protocols.forEach(item => {
          this.protocols[item.name] = item.value;
        });

        this.observer.broadcast('ready', {
          job: this,
          model,
          clientConfig: this.clientConfig
        });
      });
  }

  report() {
    return this.grid
      .submitReport(
        this.worker.id,
        this.cycleConfig.request_key,
        {} // TODO
      )
      .then(this.done.bind(this));
  }

  done() {
    this.observer.broadcast('done', {
      job: this
    });
  }
}
