import { SOCKET_PING } from './_constants';
import Logger from './logger';

/**
 * Sockets implements and wraps the WebSocket protocol for communication between client and PyGrid.
 */
export default class Sockets {
  /**
   * @param {Object} options
   * @param {string} options.url - Full URL to PyGrid app (`ws` and `http` schemas supported).
   * @param {string} options.workerId - Worker ID returned from PyGrid to the client.
   * @param {Function} [options.onOpen] - Optional function to be invoked when connection is open.
   * @param {Function} [options.onClose] - Optional function to be invoked when connection is closed.
   * @param {Function} [options.onMessage] - Optional function to be invoked when a message is received.
   * @param {number} [options.keepAliveTimeout=20000] - Optional timeout duration to keep connection alive in milliseconds.
   */
  constructor({
    url,
    workerId,
    onOpen,
    onClose,
    onMessage,
    keepAliveTimeout = 20000,
  }) {
    this.logger = new Logger();
    const socket = new WebSocket(url);

    const keepAlive = () => {
      this.send(SOCKET_PING);
      this.timerId = setTimeout(keepAlive, keepAliveTimeout);
    };

    const cancelKeepAlive = () => {
      clearTimeout(this.timerId);
      this.timerId = null;
    };

    socket.onopen = (event) => {
      this.logger.log(
        `Opening socket connection at ${event.currentTarget.url}`,
        event
      );

      keepAlive();

      if (onOpen) onOpen(event);
    };

    socket.onclose = (event) => {
      this.logger.log(
        `Closing socket connection at ${event.currentTarget.url}`,
        event
      );

      cancelKeepAlive();

      if (onClose) onClose(event);
    };

    this.url = url;
    this.workerId = workerId;
    this.socket = socket;
    this.onMessage = onMessage;
    this.timerId = null;
  }

  /**
   * Sends, receives, and handles errors for messages to and from the server.
   *
   * @param {string} type - The type of the message.
   * @param {Object} data - The data to be sent.
   * @returns {Promise<void>}
   */
  send(type, data = {}) {
    return new Promise((resolve, reject) => {
      data.workerId = this.workerId;

      const message = { type, data };

      this.logger.log('Sending message', message);

      this.socket.send(JSON.stringify(message));

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        this.logger.log('Receiving message', data);

        resolve(this.onMessage(data));
      };

      this.socket.onerror = (event) => {
        this.logger.log('We have a socket error!', event);

        reject(event);
      };
    });
  }

  /**
   * Closes the socket connection.
   */
  stop() {
    this.socket.close();
  }
}
