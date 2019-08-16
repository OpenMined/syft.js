export default class Sockets {
  constructor(opts) {
    const { url, logger, instanceId, onOpen, onClose, onMessage } = opts;

    const socket = new WebSocket(url);

    socket.onopen = event => {
      this.logger.log(
        `Opening socket connection at ${event.currentTarget.url}`,
        event
      );

      if (onOpen) onOpen(event);
    };

    socket.onclose = event => {
      this.logger.log(
        `Closing socket connection at ${event.currentTarget.url}`,
        event
      );

      if (onClose) onClose(event);
    };

    this.url = url;
    this.logger = logger;
    this.instanceId = instanceId;
    this.socket = socket;
    this.onMessage = onMessage;
  }

  send(type, data = {}) {
    return new Promise((resolve, reject) => {
      data.instanceId = this.instanceId;

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
