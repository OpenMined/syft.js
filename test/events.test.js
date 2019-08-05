import EventObserver from '../src/events';

describe('Event Observer', () => {
  jest.spyOn(console, 'log');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('can subscribe to and broadcast an event', () => {
    const observer = new EventObserver();
    const name = 'my-thing';
    const func = data => {
      console.log('hello', data);
    };
    const myData = { awesome: true };

    expect(observer.observers.length).toBe(0);

    observer.subscribe(name, func);
    observer.subscribe(`${name}-other`, func);

    expect(observer.observers.length).toBe(2);
    expect(console.log.mock.calls.length).toBe(0);

    observer.broadcast(name, myData);

    expect(console.log.mock.calls.length).toBe(1);
    expect(console.log.mock.calls[0][0]).toBe('hello');
    expect(console.log.mock.calls[0][1]).toBe(myData);
  });

  test('can unsubscribe to an event', () => {
    const observer = new EventObserver(),
      myType = 'hello';

    expect(observer.observers.length).toBe(0);

    observer.subscribe(myType, () => console.log('awesome'));

    expect(observer.observers.length).toBe(1);

    observer.unsubscribe(myType);

    expect(observer.observers.length).toBe(0);
  });
});
