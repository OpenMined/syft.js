import { SOCKET_PING } from 'syft-helpers.js';

export default class Sockets {
  constructor(opts) {
    const { url, logger, instanceId, onOpen, onClose, onMessage, keepAliveTimeout } = opts;

    const socket = new WebSocket(url);

    const keepAlive = () => {
      const timeout = keepAliveTimeout || 20000;

      this.send(SOCKET_PING);
      this.timerId = setTimeout(keepAlive, timeout);
    };

    const cancelKeepAlive = () => {
      clearTimeout(this.timerId);
      this.timerId = null;
    };

    socket.onopen = event => {
      this.logger.log(
        `Opening socket connection at ${event.currentTarget.url}`,
        event
      );

      keepAlive();

      if (onOpen) onOpen(event);
    };

    socket.onclose = event => {
      this.logger.log(
        `Closing socket connection at ${event.currentTarget.url}`,
        event
      );

      cancelKeepAlive();

      if (onClose) onClose(event);
    };

    this.url = url;
    this.logger = logger;
    this.instanceId = instanceId;
    this.socket = socket;
    this.onMessage = onMessage;
    this.timerId = null;
  }

  send(type, data = {}) {
    return new Promise((resolve, reject) => {
      // shallow copy + instanceId
      let _data = Object.assign(
        {}, data,
        { instanceId: this.instanceId }
      );

      const message = { type, data: _data };

      this.logger.log('Sending message', message);

      this.socket.send(JSON.stringify(message));

      this.socket.onmessage = event => {
        const data = JSON.parse(event.data);

        this.logger.log('Receiving message', data);

        resolve(this.onMessage(data));
      };

      this.socket.onerror = event => {
        this.logger.log('We have a socket error!', event);

        reject(event);
      };
    });
  }

  stop() {
    this.socket.close();
  }
}
