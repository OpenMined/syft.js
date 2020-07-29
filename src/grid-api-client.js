import Logger from './logger';
import { SpeedTest } from './speed-test';
import { GRID_ERROR } from './_errors';
import EventObserver from './events';

const HTTP_PATH_VERB = {
  'model-centric/get-plan': 'GET',
  'model-centric/get-model': 'GET',
  'model-centric/get-protocol': 'GET',
  'model-centric/cycle-request': 'POST',
  'model-centric/report': 'POST',
  'model-centric/authenticate': 'POST',
};

export default class GridAPIClient {
  constructor({ url, allowInsecureUrl = false }) {
    this.transport = url.match(/^ws/i) ? 'ws' : 'http';
    if (this.transport === 'ws') {
      this.wsUrl = url;
      this.httpUrl = url.replace(/^ws(s)?/i, 'http$1');
    } else {
      this.httpUrl = url;
      this.wsUrl = url.replace(/^http(s)?/i, 'ws$1');
    }
    if (!allowInsecureUrl) {
      this.wsUrl = this.wsUrl.replace('ws', 'wss');
      this.httpUrl = this.httpUrl.replace('http', 'https');
    }
    this.ws = null;
    this.observer = new EventObserver();
    this.wsMessageQueue = [];
    this.logger = new Logger('grid', true);
    this.responseTimeout = 10000;

    this._handleWsMessage = this._handleWsMessage.bind(this);
    this._handleWsError = this._handleWsError.bind(this);
    this._handleWsClose = this._handleWsClose.bind(this);
  }

  async authenticate(modelName, modelVersion, authToken) {
    this.logger.log(
      `Authenticating against ${modelName} ${modelVersion} with ${authToken}...`
    );

    const response = await this._send('model-centric/authenticate', {
      model_name: modelName,
      model_version: modelVersion,
      auth_token: authToken,
    });

    return response;
  }

  requestCycle(workerId, modelName, modelVersion, ping, download, upload) {
    this.logger.log(
      `[WID: ${workerId}] Requesting cycle for model ${modelName} v.${modelVersion} [${ping}, ${download}, ${upload}]...`
    );

    const response = this._send('model-centric/cycle-request', {
      worker_id: workerId,
      model: modelName,
      version: modelVersion,
      ping: ping,
      download: download,
      upload: upload,
    });

    return response;
  }

  async getModel(workerId, requestKey, modelId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting model ${modelId}...`
    );

    const response = await this._sendHttp(
      'model-centric/get-model',
      {
        worker_id: workerId,
        request_key: requestKey,
        model_id: modelId,
      },
      'arrayBuffer'
    );
    return response;
  }

  async getPlan(workerId, requestKey, planId) {
    this.logger.log(
      `[WID: ${workerId}, KEY: ${requestKey}] Requesting plan ${planId}...`
    );

    const response = await this._sendHttp(
      'model-centric/get-plan',
      {
        worker_id: workerId,
        request_key: requestKey,
        plan_id: planId,
        receive_operations_as: 'tfjs',
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

    const response = await this._send('model-centric/report', {
      worker_id: workerId,
      request_key: requestKey,
      diff,
    });

    return response;
  }

  async getConnectionSpeed(workerId) {
    const speedTest = new SpeedTest({
      downloadUrl:
        this.httpUrl +
        '/model-centric/speed-test?worker_id=' +
        encodeURIComponent(workerId) +
        '&random=' +
        Math.random(),
      uploadUrl:
        this.httpUrl +
        '/model-centric/speed-test?worker_id=' +
        encodeURIComponent(workerId) +
        '&random=' +
        Math.random(),
      pingUrl:
        this.httpUrl +
        '/model-centric/speed-test?is_ping=1&worker_id=' +
        encodeURIComponent(workerId) +
        '&random=' +
        Math.random(),
    });

    const ping = await speedTest.getPing();
    // start tests altogether
    const [download, upload] = await Promise.all([
      speedTest.getDownloadSpeed(),
      speedTest.getUploadSpeed(),
    ]);

    return {
      ping,
      download,
      upload,
    };
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
        .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
        .join('&');
      response = await fetch(this.httpUrl + '/' + path + '?' + query, {
        method: 'GET',
        mode: 'cors',
      });
    } else {
      response = await fetch(this.httpUrl + '/' + path, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    }

    if (!response.ok) {
      let error = `${response.status} ${response.statusText}`;
      try {
        let res = await response.json();
        if (res.error) {
          error = res.error;
        }
      } catch (e) {
        // not JSON
      }
      throw new Error(GRID_ERROR(error));
    }

    return response[type]();
  }

  async _sendWs(type, data) {
    if (!this.ws) {
      await this._initWs();
    }

    const message = { type, data };
    this.logger.log('Sending WS message', type);

    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(message));

      const cleanUp = () => {
        // Remove all handlers related to message.
        this.wsMessageQueue = this.wsMessageQueue.filter(
          (item) => item !== onMessage
        );
        this.observer.unsubscribe('ws-error', onError);
        this.observer.unsubscribe('ws-close', onClose);
        clearTimeout(timeoutHandler);
      };

      const timeoutHandler = setTimeout(() => {
        cleanUp();
        reject(new Error('Response timeout'));
      }, this.responseTimeout);

      const onMessage = (data) => {
        if (data.type !== message.type) {
          this.logger.log('Received invalid response type, ignoring');
          return false;
        }
        cleanUp();
        resolve(data.data);
      };

      const onError = (event) => {
        cleanUp();
        reject(new Error(event));
      };

      const onClose = () => {
        cleanUp();
        reject(new Error('WS connection closed'));
      };

      // We expect responses coming in same order as requests.
      this.wsMessageQueue.push(onMessage);

      // Other events while waiting for response.
      this.observer.subscribe('ws-error', onError);
      this.observer.subscribe('ws-close', onClose);
    });
  }

  async _initWs() {
    const ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        // setup handlers
        ws.onerror = this._handleWsError;
        ws.onclose = this._handleWsClose;
        ws.onmessage = this._handleWsMessage;
        this.ws = ws;
        resolve();
      };
      ws.onerror = (event) => {
        // couldn't connect
        this._handleWsError(event);
        reject(new Error(event));
      };
      ws.onclose = (event) => {
        // couldn't connect
        this._handleWsClose(event);
        reject(new Error('WS connection closed during connect'));
      };
    });
  }

  _handleWsMessage(event) {
    this.logger.log('Received message', event.data);
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      this.logger.log('Message is not valid JSON!');
    }

    // Call response handlers (in order of requests),
    // stopping at the first successful handler.
    for (let handler of this.wsMessageQueue) {
      if (handler(data) !== false) {
        break;
      }
    }
  }

  _handleWsError(event) {
    this.logger.log('WS connection error', event);
    this.observer.broadcast('ws-error', event);
    this.ws = null;
  }

  _handleWsClose(event) {
    this.logger.log('WS connection closed', event);
    this.observer.broadcast('ws-close', event);
    this.ws = null;
  }
}
