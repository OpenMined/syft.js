import { SOCKET_PING } from '../src/_constants';
import { WebSocket, Server } from 'mock-socket';

import Socket from '../src/sockets';

global.WebSocket = WebSocket;

const url = 'ws://localhost:8080/';

// Create a promise that is resolved when the event is triggered.
const makeEventPromise = (emitter, event) => {
  let resolver;

  const promise = new Promise((resolve) => (resolver = resolve));
  emitter.on(event, (data) => resolver(data));

  console.log('==========Inside makeEventPromise==========');
  console.log(promise.constructor);
  console.log('==========makeEventPromise Returns==========');
  return promise;
};

describe('Sockets', () => {
  let mockServer;

  beforeEach(() => {
    mockServer = new Server(url);
    mockServer.connected = makeEventPromise(mockServer, 'connection');
  });

  afterEach(() => {
    mockServer.close();
  });

  test('client socket sends keep-alive messages automatically', async () => {
    const keepAliveTimeout = 300,
      expectedMessagesCount = 3,
      messages = [],
      expectedTypes = [];

    // Creating a socket will open connection and start keep-alive pings.
    new Socket({ url, keepAliveTimeout });

    // Resolving the Promise returns a Websocket object
    const serverSocket = await mockServer.connected;

    serverSocket.on('message', (message) => messages.push(JSON.parse(message)));

    // Use Promise chain to sleep enough time for client socket to ping server socket
    await new Promise((done) =>
      setTimeout(
        done,
        keepAliveTimeout * expectedMessagesCount + keepAliveTimeout / 2
      )
    );

    // One keep-alive message is sent right after connection, hence +1.
    expect(messages).toHaveLength(expectedMessagesCount + 1);

    for (let i = 0; i < expectedMessagesCount + 1; i++) {
      expectedTypes.push(SOCKET_PING);
    }

    expect(messages.map((message) => message['type'])).toEqual(expectedTypes);
  });

  test('triggers onOpen event', async () => {
    const onOpen = jest.fn();

    new Socket({ url, onOpen });

    await mockServer.connected;

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('triggers onClose event', async () => {
    const closed = makeEventPromise(mockServer, 'close'),
      onClose = jest.fn(),
      mySocket = new Socket({
        url,
        onClose,
      });

    await mockServer.connected;

    mySocket.stop();

    await closed;

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mySocket.timerId).toBeNull();
  });

  test('sends data correctly', async () => {
    const testReqType = 'test',
      testReqData = { blob: 1 },
      testResponse = { response: 'test' },
      testworkerId = 'test-worker',
      mySocket = new Socket({
        workerId: testworkerId,
        url,
        onMessage: (data) => data,
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
      data: testReqData,
    });
    expect(response).toEqual(testResponse);
  });

  test('returns error when .send() fails', async () => {
    const mySocket = new Socket({
      url,
      onMessage: (data) => data,
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
    });

    await mockServer.connected;

    expect(mockServer.clients()).toHaveLength(1);

    mySocket.stop();

    await new Promise((done) => setTimeout(done, 100));

    expect(mockServer.clients()).toHaveLength(0);
  });

  test('triggers onMessage event', async () => {
    const testResponse = { response: 'test' },
      testworkerId = 'test-worker',
      onMessage = jest.fn((message) => message),
      mySocket = new Socket({
        workerId: testworkerId,
        url,
        onMessage: onMessage,
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
