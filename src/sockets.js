export default class Sockets {
  constructor(opts) {
    const { url, logger, onOpen, onClose, onMessage, onError } = opts;

    const socket = new WebSocket(url);

    socket.onopen = event => this.onOpen(event, onOpen);
    socket.onclose = event => this.onClose(event, onClose);
    socket.onmessage = event => this.onMessage(event, onMessage);
    socket.onerror = event => this.onError(event, onError);

    this.url = url;
    this.logger = logger;
    this.socket = socket;
  }

  onOpen(event, callback) {
    this.logger.log(
      `Opening socket connection to ${event.currentTarget.url}`,
      event
    );

    if (callback) callback(event);
  }

  onClose(event, callback) {
    this.logger.log(
      `Closing socket connection to ${event.currentTarget.url}`,
      event
    );

    if (callback) callback(event);
  }

  onMessage(event, callback) {
    const data = JSON.parse(event.data);

    this.logger.log('Receiving message', data);

    if (callback) callback(data);
  }

  onError(event, callback) {
    this.logger.log('We have a socket error!', event);

    if (callback) callback(event);
  }
}
