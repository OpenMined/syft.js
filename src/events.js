/**
 * EventObserver is used by Syft, Job, and GridAPIClient to subscribe, unsubscribe or broadcast events.
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
   */
  subscribe(type, func) {
    this.observers.push({ type, func });
  }

  /**
   * Unsubscribes an event from the event dictionary.
   *
   * @param {string} type - Event type.
   */
  unsubscribe(eventType) {
    this.observers = this.observers.filter(({ type }) => eventType !== type);
  }

  /**
   * Broadcasts a specific event type by invoking the appropriate event handler.
   *
   * @param {string} eventType - Event type.
   * @param {Object} data - Data to be broadcasted.
   * @returns TODO: Document what is returned
   */
  broadcast(eventType, data) {
    this.observers.forEach((observer) => {
      if (eventType === observer.type) {
        return observer.func(data);
      }
    });
  }
}
