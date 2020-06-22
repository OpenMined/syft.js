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

  setModel(model_id, data) {
    fetchMock.get(
      {
        url: `http://${this.hostname}:${this.port}/federated/get-model`,
        query: { model_id }
      },
      {
        body: data,
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' }
      },
      { sendAsJson: false }
    );
  }

  setPlan(plan_id, data) {
    fetchMock.get(
      {
        url: `begin:http://${this.hostname}:${this.port}/federated/get-plan`,
        query: { plan_id }
      },
      {
        body: data,
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' }
      },
      { sendAsJson: false }
    );
  }

  messageHandler(socket, message) {
    const data = JSON.parse(message);
    this.wsMessagesHistory.push(data);
    switch (data.type) {
      case 'federated/authenticate':
        socket.send(
          JSON.stringify({
            type: data.type,
            data: this.authResponse
          })
        );
        break;

      case 'federated/cycle-request':
        socket.send(
          JSON.stringify({
            type: data.type,
            data: this.cycleResponse
          })
        );
        break;

      case 'federated/report':
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
