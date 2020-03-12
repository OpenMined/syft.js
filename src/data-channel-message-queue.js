import EventObserver from './events';

export default class DataChannelMessageQueue {
  constructor() {
    this.messages = new Map();
    this.observer = new EventObserver();
  }

  /**
   * Register new message
   * @param {DataChannelMessage} message
   */
  register(message) {
    if (this.isRegistered(message.id)) {
      return false;
    }
    this.messages.set(message.id, message);
    message.once('ready', this.onMessageReady.bind(this));
  }

  unregister(message) {
    this.messages.delete(message.id);
  }

  /**
   * Check if registered by message id
   * @param {number} id
   */
  isRegistered(id) {
    return this.messages.has(id);
  }

  /**
   * Check if registered by message id
   * @param {number} id
   */
  getById(id) {
    return this.messages.get(id);
  }

  /**
   *
   * @param {DataChannelMessage} message
   */
  onMessageReady(message) {
    this.unregister(message);
    this.observer.broadcast('message', message);
  }

  on(event, func) {
    this.observer.subscribe(event, func);
  }
}
