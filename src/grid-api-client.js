import Logger from './logger';

export default class GridAPIClient {
  constructor({ url }) {
    this.url = url;
    this.logger = new Logger();
  }

  authenticate(authToken) {
    this.logger.log(`Authenticating with ${authToken}...`);
    return Promise.resolve({
      worker_id: '12345'
    });
  }

  requestCycle(workerId, modelName, modelVersion, ping, download, upload) {
    this.logger.log(
      `[WID: ${workerId}] Requesting cycle for model ${modelName} v.${modelVersion} [${ping}, ${download}, ${upload}]...`
    );
    return Promise.resolve({
      status: 'accepted',
      request_key: 'request_key',
      plans: {
        training_plan: 'training_plan_id',
        another_plan: 'another_plan_id'
      },
      client_config: {
        lr: 0.05,
        batch_size: 64,
        max_updates: 400
      },
      protocols: { secure_agg_protocol: 'sec_agg_protocol_id' },
      model_id: 'model_id'
    });
  }

  async getModel(workerId, requestKey, modelId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting model ${modelId}...`
    );
    const response = await fetch('/data/model_params.pb');
    return response.arrayBuffer();
  }

  async getPlan(workerId, requestKey, planId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting plan ${planId}...`
    );
    const response = await fetch('/data/tp_ops.pb');
    return response.arrayBuffer();
  }

  getProtocol(workerId, requestKey, protocolId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting protocol ${protocolId}...`
    );
    return Promise.resolve(
      'CgYIjcivoCUqEwoGCIHIr6AlEgkSB3dvcmtlcjEqEwoGCIXIr6AlEgkSB3dvcmtlcjIqEwoGCInIr6AlEgkSB3dvcmtlcjM='
    );
  }

  submitReport(workerId, requestKey, data) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Submitting report...`
    );
    for (let param of data) {
      param.print();
    }
    return Promise.resolve({
      status: 'success'
    });
  }

  getConnectionSpeed() {
    // TODO meter speed using /federated/speed-test
    return Promise.resolve({
      ping: '8ms',
      download: '46.3mbps',
      upload: '23.7mbps'
    });
  }
}
