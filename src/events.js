export default class EventObserver {
  constructor() {
    this.observers = [];
  }

  subscribe(type, func) {
    this.observers.push({ type, func });
  }

  unsubscribe(eventType) {
    this.observers = this.observers.filter(({ type }) => eventType !== type);
  }

  broadcast(eventType, data) {
    this.observers.forEach(observer => {
      if (eventType === observer.type) {
        return observer.func(data);
      }
    });
  }
}
