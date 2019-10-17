import { SOCKET_PING } from './_constants';

export default class Sockets {
  constructor(opts) {
    const {
      url,
      logger,
      workerId,
      onOpen,
      onClose,
      onMessage,
      keepAliveTimeout = 20000
    } = opts;

    const socket = new WebSocket(url);

    const keepAlive = () => {
      this.send(SOCKET_PING);
      this.timerId = setTimeout(keepAlive, keepAliveTimeout);
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
    this.workerId = workerId;
    this.socket = socket;
    this.onMessage = onMessage;
    this.timerId = null;
  }

  send(type, data = {}) {
    return new Promise((resolve, reject) => {
      data.workerId = this.workerId;

      const message = { type, data };

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
