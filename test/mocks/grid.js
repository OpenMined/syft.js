import { WebSocket, Server } from 'mock-socket';
import fetchMock from 'fetch-mock';
global.WebSocket = WebSocket;

export class GridMock {
  constructor(hostname = 'localhost', port = 8080) {
    this.hostname = hostname;
    this.port = port;
    this.ws = new Server(`ws://${hostname}:${port}`);

    this.wsConnections = [];
    this.ws.on('connection', (socket) => {
      this.wsConnections.push(socket);
      socket.on('message', (message) => this.messageHandler(socket, message));
      socket.on('error', (err) => console.log('WS ERROR', err));
      socket.on('close', (err) => console.log('WS CLOSE', err));
    });

    this.wsMessagesHistory = [];
  }

  setAuthenticationResponse(data) {
    this.authResponse = data;
  }

  setCycleResponse(data) {
    this.cycleResponse = data;
  }

  setReportResponse(data) {
    this.reportResponse = data;
  }

  _setHttpResponse(method, url, query, data, status) {
    let contentType = 'application/json';
    let json = true;
    if (data instanceof ArrayBuffer || data instanceof Buffer) {
      contentType = 'application/octet-stream';
      json = false;
    }

    fetchMock[method](
      { url, query },
      {
        body: data,
        status,
        headers: {
          'Content-Type': contentType,
        },
      },
      { sendAsJson: json }
    );
  }

  setModel(model_id, data, status = 200) {
    this._setHttpResponse(
      'get',
      `http://${this.hostname}:${this.port}/model-centric/get-model`,
      { model_id },
      data,
      status
    );
  }

  setPlan(plan_id, data, status = 200) {
    this._setHttpResponse(
      'get',
      `http://${this.hostname}:${this.port}/model-centric/get-plan`,
      { plan_id },
      data,
      status
    );
  }

  makeResponse(req, data) {
    const response = {
      type: req.type,
      data,
    };
    if (req.request_id) {
      response.request_id = req.request_id;
    }
    return JSON.stringify(response);
  }

  messageHandler(socket, message) {
    const data = JSON.parse(message);

    this.wsMessagesHistory.push(data);
    switch (data.type) {
      case 'model-centric/authenticate':
        socket.send(this.makeResponse(data, this.authResponse));
        break;

      case 'model-centric/cycle-request':
        socket.send(this.makeResponse(data, this.cycleResponse));
        break;

      case 'model-centric/report':
        socket.send(this.makeResponse(data, this.reportResponse));
        break;
    }
  }

  stop() {
    this.ws.close();
    fetchMock.reset();
  }
}
