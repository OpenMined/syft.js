import Logger from './logger';

const HTTP_PATH_VERB = {
  'federated/get-plan': 'GET',
  'federated/get-model': 'GET',
  'federated/cycle-request': 'POST'
};

export default class GridAPIClient {
  constructor({ url }) {
    this.transport = url.match(/^ws/i) ? 'ws' : 'http';
    if (this.transport === 'ws') {
      this.wsUrl = url;
      this.httpUrl = url.replace(/^ws(s)?/i, 'http$1');
    } else {
      this.httpUrl = url;
      this.wsUrl = url.replace(/^http(s)?/i, 'ws$1');
    }
    this.ws = null;
    this.logger = new Logger('grid', true);
    this.responseTimeout = 10000;
  }

  async authenticate(authToken) {
    this.logger.log(`Authenticating with ${authToken}...`);

    const response = await this._send('federated/authenticate', {
      auth_token: authToken
    });

    return response;
  }

  requestCycle(workerId, modelName, modelVersion, ping, download, upload) {
    this.logger.log(
      `[WID: ${workerId}] Requesting cycle for model ${modelName} v.${modelVersion} [${ping}, ${download}, ${upload}]...`
    );

    const response = this._send('federated/cycle-request', {
      worker_id: workerId,
      model: modelName,
      version: modelVersion,
      ping: ping,
      download: download,
      upload: upload
    });

    return response;

    /*
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
    }); */
  }

  async getModel(workerId, requestKey, modelId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting model ${modelId}...`
    );

    // const response = await fetch('/data/model_params.pb');
    // return response.arrayBuffer();

    const response = await this._sendHttp(
      'federated/get-model',
      {
        worker_id: workerId,
        request_key: requestKey,
        model_id: modelId
      },
      'arrayBuffer'
    );
    return response;
  }

  async getPlan(workerId, requestKey, planId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting plan ${planId}...`
    );

    // const response = await fetch('/data/tp_ops.pb');
    // return response.arrayBuffer();

    const response = await this._sendHttp(
      'federated/get-plan',
      {
        worker_id: workerId,
        request_key: requestKey,
        plan_id: planId,
        receive_operations_as: 'list'
      },
      'arrayBuffer'
    );

    return response;
  }

  getProtocol(workerId, requestKey, protocolId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting protocol ${protocolId}...`
    );
    return Promise.resolve(
      'CgYIjcivoCUqEwoGCIHIr6AlEgkSB3dvcmtlcjEqEwoGCIXIr6AlEgkSB3dvcmtlcjIqEwoGCInIr6AlEgkSB3dvcmtlcjM='
    );
  }

  async submitReport(workerId, requestKey, diff) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Submitting report...`
    );

    const response = await this._send('federated/report', {
      worker_id: workerId,
      request_key: requestKey,
      diff
    });

    return response;
  }

  getConnectionSpeed() {
    // TODO meter speed using /federated/speed-test
    return Promise.resolve({
      ping: '8',
      download: '46.3',
      upload: '23.7'
    });
  }

  async _send(path, data) {
    const response =
      this.transport === 'ws'
        ? await this._sendWs(path, data)
        : await this._sendHttp(path, data);

    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  }

  async _sendHttp(path, data, type = 'json') {
    const method = HTTP_PATH_VERB[path] || 'GET';
    let response;

    if (method === 'GET') {
      const query = Object.keys(data)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
        .join('&');
      response = await fetch(this.httpUrl + '/' + path + '?' + query, {
        method: 'GET',
        mode: 'cors'
      });
    } else {
      response = await fetch(this.httpUrl + '/' + path, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response[type]();
  }

  async _sendWs(type, data) {
    if (!this.ws) {
      await this._initWs();
    }

    const message = { type, data };
    this.logger.log('Sending WS message', message);

    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(message));

      const timeoutHandler = setTimeout(() => {
        this.ws.onmessage = null;
        reject();
      }, this.responseTimeout);

      // We expect first message after send to be response.
      this.ws.onmessage = event => {
        // reset handlers
        this.ws.onerror = this._handleWsClose;
        this.ws.onclose = this._handleWsClose;
        this.ws.onmessage = null;
        clearTimeout(timeoutHandler);

        const data = JSON.parse(event.data);
        this.logger.log('Received message', data);
        resolve(data);
      };

      this.ws.onerror = event => {
        clearTimeout(timeoutHandler);
        this._handleWsError(event);
        reject();
      };

      this.ws.onclose = event => {
        clearTimeout(timeoutHandler);
        this._handleWsClose(event);
        reject();
      };
    });
  }

  async _initWs() {
    const ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        // setup handlers
        ws.onerror = this._handleWsError;
        ws.onclose = this._handleWsClose;
        this.ws = ws;
        resolve();
      };
      ws.onerror = event => {
        // couldn't connect
        this._handleWsError(event);
        reject();
      };
      ws.onclose = event => {
        // couldn't connect
        this._handleWsClose(event);
        reject();
      };
    });
  }

  _handleWsError(event) {
    this.logger.log('WS connection error', event);
    this.ws = null;
  }

  _handleWsClose(event) {
    this.logger.log('WS connection closed', event);
    this.ws = null;
  }
}
