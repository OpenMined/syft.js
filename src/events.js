/**
 * Event Observer that subscribes, unsubscribes and broadcasts events.
 *
 * @property {Object.<string, Function>} observers - Event dictionary.
 */
export default class EventObserver {
  constructor() {
    this.observers = [];
  }

  /**
   * Subscribes an event and its handler to the event dictionary.
   *
   * @param {string} type - Event type.
   * @param {Function} func - Event handler.
   * @param {number|boolean} [expires] - Expire subscription after N invocations.
   */
  subscribe(type, func, expires = false) {
    this.observers.push({ type, func, expires });
  }

  /**
   * Unsubscribes an event from the event dictionary.
   *
   * @param {string} eventType - Event type.
   * @param {Function} [func] - Event handler.
   */
  unsubscribe(eventType, func) {
    this.observers = this.observers.filter((i) => {
      return eventType !== i.type && func !== i.func;
    });
  }

  /**
   * Broadcasts a specific event type.
   *
   * @param {string} eventType - Event type.
   * @param {Object} data - Data to be broadcasted.
   */
  broadcast(eventType, data) {
    this.observers.forEach((observer) => {
      if (
        eventType === observer.type &&
        (observer.expires === false || observer.expires > 0)
      ) {
        if (typeof observer.expires === 'number') {
          observer.expires--;
        }
        observer.func(data);
      }
    });

    // Remove expired subscriptions
    this.observers = this.observers.filter((i) => {
      return i.expires > 0 || i.expires === false;
    });
  }
}
