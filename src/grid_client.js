import { PLAN, MODEL, PROTOCOL } from '../test/data/dummy';
import Logger from './logger';

export default class GridAPIClient {
  constructor({ url, logger }) {
    this.url = url;
    this.logger = logger || new Logger('GridClient', true);
  }

  authenticate() {
    this.logger.log(`Authenticating...`);
    return Promise.resolve({
      worker_id: '12345'
    });
  }

  requestCycle(workerId, modelId, versionId = null) {
    this.logger.log(
      `[WID: ${workerId}] Requesting cycle for model ${modelId}...`
    );
    return Promise.resolve({
      status: 'accepted',
      request_key: 'request_key',
      plans: {
        training_plan: 'training_plan_id',
        another_plan: 'another_plan_id'
      },
      client_config: {
        lr: 0.01,
        batch_size: 32,
        max_updates: 5
      },
      protocols: { secure_agg_protocol: 'sec_agg_protocol_id' },
      model_id: 'model_id'
    });
  }

  getModel(workerId, requestKey, modelId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting model ${modelId}...`
    );
    return Promise.resolve(MODEL);
  }

  getPlan(workerId, requestKey, planId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting plan ${planId}...`
    );
    return Promise.resolve(PLAN);
  }

  getProtocol(workerId, requestKey, protocolId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting protocol ${protocolId}...`
    );
    return Promise.resolve(PROTOCOL);
  }

  submitReport(workerId, requestKey, data) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Submitting report...`
    );
    return Promise.resolve({
      status: 'success'
    });
  }
}
