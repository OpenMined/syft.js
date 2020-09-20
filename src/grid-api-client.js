import Logger from './logger';
import { SpeedTest } from './speed-test';
import { GRID_ERROR } from './_errors';
import EventObserver from './events';
import { createRandomBuffer } from './utils/random-buffer';
import { base64Encode } from './utils/base64';

// Define the type of request (GET, POST) associated with each possible call
const HTTP_PATH_VERB = {
  'model-centric/get-plan': 'GET',
  'model-centric/get-model': 'GET',
  'model-centric/get-protocol': 'GET',
  'model-centric/cycle-request': 'POST',
  'model-centric/report': 'POST',
  'model-centric/authenticate': 'POST',
};

/**
 * GridAPIClient defines the possible API calls that can be made to PyGrid from a client perspective
 * Operations include get-plan, get-model, get-protocol, cycle-request, report and authenticate
 */
export default class GridAPIClient {
  constructor({ url, allowInsecureUrl = false }) {
    // Choose between web socket or http protocol
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

    // Define all necessary components for both web socket and http
    this.ws = null;
    this.observer = new EventObserver();
    this.wsMessages = {};
    this.logger = new Logger('grid', true);
    this.responseTimeout = 10000;

    this._handleWsMessage = this._handleWsMessage.bind(this);
    this._handleWsError = this._handleWsError.bind(this);
    this._handleWsClose = this._handleWsClose.bind(this);
  }

  /**
   * Authenticates a connection to the grid
   * using a particular token associated with a model name and version
   * @param {string} modelName
   * @param {string} modelVersion
   * @param {string} authToken
   */
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

  /**
   * Requests to join an active federated learning cycle in PyGrid
   * @param {string} workerId
   * @param {string} modelName
   * @param {string} modelVersion
   * @param {number} ping
   * @param {number} download
   * @param {number} upload
   */
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

  /**
   * Submits a report indicating the difference between the model parameters from workerID and original PyGrid parameters
   * @param {string} workerId
   * @param {string} requestKey
   * @param {string} diff - a base64 encoded string difference between current and original model parameters in PyGrid
   */
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
    // Start tests altogether
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
    const request_id = base64Encode(await createRandomBuffer(32));
    const message = { request_id, type, data };
    this.logger.log('Sending WS message', request_id, type);

    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(message));

      const cleanUp = () => {
        // Remove all handlers related to message.
        delete this.wsMessages[request_id];
        this.observer.unsubscribe('ws-error', onError);
        this.observer.unsubscribe('ws-close', onClose);
        clearTimeout(timeoutHandler);
      };

      const timeoutHandler = setTimeout(() => {
        cleanUp();
        reject(new Error('Response timeout'));
      }, this.responseTimeout);

      const onMessage = (data) => {
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

      // Save response handler under specific request_id.
      // We expect same request_id in the response.
      this.wsMessages[request_id] = onMessage;

      // Other events while waiting for response.
      this.observer.subscribe('ws-error', onError);
      this.observer.subscribe('ws-close', onClose);
    });
  }

  async _initWs() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      ws.onopen = () => {
        // setup handlers
        ws.onerror = this._handleWsError;
        ws.onclose = this._handleWsClose;
        ws.onmessage = this._handleWsMessage;
        this.ws = ws;
        resolve();
      };
      ws.onerror = (event) => {
        // Couldn't connect and error is returned
        this._handleWsError(event);
        reject(new Error(event));
      };
      ws.onclose = (event) => {
        // Couldn't connect and connection closed
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

    // Call response handler, it should be stored under request_id.
    const request_id = data.request_id;
    if (request_id && Object.hasOwnProperty.call(this.wsMessages, request_id)) {
      const handler = this.wsMessages[request_id];
      handler(data);
    } else {
      this.logger.log('Message with unknown request_id');
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
