import 'regenerator-runtime/runtime';

import Socket from '../src/sockets';
import { Logger, SOCKET_PING } from 'syft-helpers.js';

import { WebSocket, Server } from 'mock-socket';

global.WebSocket = WebSocket;

const url = 'ws://localhost:8080/';

const makeEventPromise = (emitter, event) => {
  let resolver;
  // Create a promise that is resolved when the event is triggered.
  const promise = new Promise(resolve => (resolver = resolve));
  emitter.on(event, data => resolver(data));
  return promise;
};

describe('Sockets', () => {
  let mockServer;

  jest.spyOn(console, 'log');

  beforeEach(() => {
    mockServer = new Server(url);
    mockServer.connected = makeEventPromise(mockServer, 'connection');
  });

  afterEach(() => {
    mockServer.close();
    jest.clearAllMocks();
  });

  test('sends keep-alive messages automatically', async () => {
    const keepAliveTimeout = 300;
    const expectedMessagesCount = 3;

    const mySocket = new Socket({
      url,
      logger: new Logger('syft.js', true),
      keepAliveTimeout
    });

    const serverSocket = await mockServer.connected;

    let messages = [];
    serverSocket.on('message', message => messages.push(JSON.parse(message)));
    await new Promise(done =>
      setTimeout(
        done,
        keepAliveTimeout * expectedMessagesCount + keepAliveTimeout / 2
      )
    );

    // One keep-alive message is sent right after connection, hence +1.
    expect(messages).toHaveLength(expectedMessagesCount + 1);
    let expectedTypes = [];
    for (let i = 0; i < expectedMessagesCount + 1; i++) {
      expectedTypes.push(SOCKET_PING);
    }
    expect(messages.map(message => message['type'])).toEqual(expectedTypes);
  });

  test('triggers onOpen event', async () => {
    const onOpen = jest.fn();
    const mySocket = new Socket({
      url,
      logger: new Logger('syft.js', true),
      onOpen
    });

    await mockServer.connected;
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('triggers onClose event', async () => {
    const closed = makeEventPromise(mockServer, 'close');
    const onClose = jest.fn();
    const mySocket = new Socket({
      url,
      logger: new Logger('syft.js', true),
      onClose
    });

    await mockServer.connected;
    mySocket.stop();
    await closed;
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mySocket.timerId).toBeNull();
  });

  test('sends data correctly', async () => {
    const testReqType = 'test';
    const testReqData = { blob: 1 };
    const testResponse = { response: 'test' };
    const testInstanceId = 'test-instance';

    const mySocket = new Socket({
      instanceId: testInstanceId,
      url,
      logger: new Logger('syft.js', true),
      onMessage: data => data
    });

    const serverSocket = await mockServer.connected;
    // Skip first keep-alive message.
    await makeEventPromise(serverSocket, 'message');

    const responsePromise = mySocket.send(testReqType, testReqData);
    const message = await makeEventPromise(serverSocket, 'message');
    serverSocket.send(JSON.stringify(testResponse));
    const response = await responsePromise;

    expect(JSON.parse(message)).toEqual({
      type: testReqType,
      data: testReqData
    });
    expect(response).toEqual(testResponse);
  });

  test('returns error when .send() fails', async () => {
    const mySocket = new Socket({
      url,
      logger: new Logger('syft.js', true),
      onMessage: data => data
    });

    const serverSocket = await mockServer.connected;
    // Skip first keep-alive message.
    await makeEventPromise(serverSocket, 'message');

    const responsePromise = mySocket.send('test', {});
    mockServer.simulate('error');

    expect.assertions(1);
    try {
      await responsePromise;
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  test('disconnects from server after .stop()', async () => {
    const mySocket = new Socket({
      url,
      logger: new Logger('syft.js', true)
    });

    const serverSocket = await mockServer.connected;
    expect(mockServer.clients()).toHaveLength(1);
    mySocket.stop();
    await new Promise(done => setTimeout(done, 100));
    expect(mockServer.clients()).toHaveLength(0);
  });

  test('triggers onMessage event', async () => {
    const testResponse = { response: 'test' };
    const testInstanceId = 'test-instance';

    const onMessage = jest.fn(message => message);
    const mySocket = new Socket({
      instanceId: testInstanceId,
      url,
      logger: new Logger('syft.js', true),
      onMessage: onMessage
    });

    const serverSocket = await mockServer.connected;
    // Skip first keep-alive message.
    await makeEventPromise(serverSocket, 'message');
    serverSocket.on('message', () => {
      serverSocket.send(JSON.stringify(testResponse));
    });
    await mySocket.send('test1', {});
    await mySocket.send('test2', {});

    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenLastCalledWith(testResponse);
  });
});
