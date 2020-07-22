import { WebSocket, Server } from 'mock-socket';
import fetchMock from 'fetch-mock';
global.WebSocket = WebSocket;

export class GridMock {
  constructor(hostname = 'localhost', port = 8080) {
    this.hostname = hostname;
    this.port = port;
    this.ws = new Server(`ws://${hostname}:${port}`);

    this.wsConnections = [];
    this.ws.on('connection', socket => {
      this.wsConnections.push(socket);
      socket.on('message', message => this.messageHandler(socket, message));
      socket.on('error', err => console.log('WS ERROR', err));
      socket.on('close', err => console.log('WS CLOSE', err));
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
          'Content-Type': contentType
        }
      },
      { sendAsJson: json }
    );
  }

  setModel(model_id, data, status = 200) {
    this._setHttpResponse(
      'get',
      `http://${this.hostname}:${this.port}/model_centric/get-model`,
      { model_id },
      data,
      status
    );
  }

  setPlan(plan_id, data, status = 200) {
    this._setHttpResponse(
      'get',
      `http://${this.hostname}:${this.port}/model_centric/get-plan`,
      { plan_id },
      data,
      status
    );
  }

  messageHandler(socket, message) {
    const data = JSON.parse(message);
    this.wsMessagesHistory.push(data);
    switch (data.type) {
      case 'model_centric/authenticate':
        socket.send(
          JSON.stringify({
            type: data.type,
            data: this.authResponse
          })
        );
        break;

      case 'model_centric/cycle-request':
        socket.send(
          JSON.stringify({
            type: data.type,
            data: this.cycleResponse
          })
        );
        break;

      case 'model_centric/report':
        socket.send(
          JSON.stringify({
            type: data.type,
            data: this.reportResponse
          })
        );
        break;
    }
  }

  stop() {
    this.ws.close();
    fetchMock.reset();
  }
}
