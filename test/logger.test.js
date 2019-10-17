import Logger from '../src/logger';

describe('Logger', () => {
  jest.spyOn(console, 'log');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('can skip when verbose is false', () => {
    const testLogger = new Logger('syft.js', false),
      message = 'hello';

    expect(testLogger.verbose).toBe(false);
    expect(console.log.mock.calls.length).toBe(0);

    testLogger.log(message);

    expect(console.log.mock.calls.length).toBe(0);
  });

  test('can log under verbose mode', () => {
    const testLogger = new Logger('syft.js', true),
      message = 'hello';

    expect(testLogger.verbose).toBe(true);
    expect(console.log.mock.calls.length).toBe(0);

    const currentTime = Date.now();
    testLogger.log(message);

    expect(console.log.mock.calls.length).toBe(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `${currentTime}: syft.js - ${message}`
    );
  });

  test('can log with data', () => {
    const testLogger = new Logger('syft.js', true),
      message = 'hello',
      myObj = { awesome: true };

    expect(testLogger.verbose).toBe(true);
    expect(console.log.mock.calls.length).toBe(0);

    const currentTime = Date.now();
    testLogger.log(message, myObj);

    expect(console.log.mock.calls.length).toBe(1);
    expect(console.log.mock.calls[0][0]).toBe(
      `${currentTime}: syft.js - ${message}`
    );
    expect(console.log.mock.calls[0][1]).toStrictEqual(myObj);
  });
});
