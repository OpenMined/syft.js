import 'regenerator-runtime/runtime';

import Socket from '../src/sockets';
import { Logger, SOCKET_PING } from 'syft-helpers.js';

import { WebSocket, Server } from 'mock-socket';

global.WebSocket = WebSocket;

const url = 'ws://localhost:8080/';

/**
 * Creates promise from the first event call
 * @param emitter Object that emits the event
 * @param event Event name
 * @returns {Promise}
 */
function makeEventPromise(emitter, event) {
  let resolver;
  let promise = new Promise(resolve => resolver = resolve);
  emitter.on(event, data => resolver(data));
  return promise;
}

describe('Sockets', () => {
  // common test objects
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

  test('keep-alive messages', async() => {
    const keepAliveTimeout = 300;
    const expectedMessagesCount = 3;

    const mySocket = new Socket({
      url,
      logger: new Logger(true),
      keepAliveTimeout
    });
    let serverSocket = await mockServer.connected;
    // collect messages
    let messages = [];
    serverSocket.on('message', message => messages.push(JSON.parse(message)));
    // if we wait long enough, we should see `expectedMessagesCount` keep-alive messages
    await new Promise(done => setTimeout(done,
      keepAliveTimeout * expectedMessagesCount + keepAliveTimeout / 2));
    // one message is sent right after establishing the connection hence +1 
    // (do we really need that?)
    expect(messages).toHaveLength(expectedMessagesCount + 1);
    let expectedTypes  =[];
    for (let i = 0; i < expectedMessagesCount + 1; i++) {
      expectedTypes.push(SOCKET_PING);
    }
    expect(messages.map(message => message["type"])).toEqual(expectedTypes);
  });

  test('onopen event works', async () => {
    const onOpen = jest.fn();
    const mySocket = new Socket({
      url,
      logger: new Logger(true),
      onOpen
    });
    await mockServer.connected;
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('onclose event works', async () => {
    const closed = makeEventPromise(mockServer, 'close');
    const onClose = jest.fn();
    const mySocket = new Socket({
      url,
      logger: new Logger(true),
      onClose
    });
    await mockServer.connected;
    mySocket.stop();
    await closed;
    expect(onClose).toHaveBeenCalledTimes(1);
    // keepalive timer is deleted
    expect(mySocket.timerId).toBeNull();
  });

  test('sends correct data', async () => {
    // test data
    const testReqType = "test";
    const testReqData = {"blob": 1};
    const testResponse = {"response": "test"};
    const testInstanceId = "test-instance";

    const mySocket = new Socket({
      instanceId: testInstanceId,
      url,
      logger: new Logger(true),
      // weird that onMessage listener must provide the result of Socket.send()
      onMessage: data => data
    });
    // wait for connection and skip the first keep alive message
    const serverSocket = await mockServer.connected;
    await makeEventPromise(serverSocket, 'message');

    // send & receive the message on the server and send server response
    const responsePromise = mySocket.send(testReqType, testReqData);
    const message = await makeEventPromise(serverSocket, 'message');
    serverSocket.send(JSON.stringify(testResponse));
    // get the response on the client
    const response = await responsePromise;
    // check data
    // socket injects instanceId into data (perhaps use separate field?)
    testReqData.instanceId = testInstanceId;
    expect(JSON.parse(message)).toEqual({"type": testReqType, "data": testReqData});
    expect(response).toEqual(testResponse);
  });

  test('send returns error', async () => {
    const mySocket = new Socket({
      url,
      logger: new Logger(true),
      // weird that onMessage listener must provide the result of Socket.send()
      onMessage: data => data
    });
    // wait for connection and the first keep alive message
    const serverSocket = await mockServer.connected;
    await makeEventPromise(serverSocket, 'message');

    // send the message but simulate connection error
    const responsePromise = mySocket.send("test", {});
    mockServer.simulate('error');

    expect.assertions(1);
    try { await responsePromise; } catch(e) {
      // returns event object, perhaps we need a string?
      expect(e).toBeDefined();
    }
  });

  test('stop disconnects', async () => {
    const mySocket = new Socket({
      url,
      logger: new Logger(true)
    });
    // wait for connection and the first keep alive message
    const serverSocket = await mockServer.connected;
    expect(mockServer.clients()).toHaveLength(1);
    mySocket.stop();
    await new Promise(done => setTimeout(done, 100));
    expect(mockServer.clients()).toHaveLength(0);
  });

  test('onmessage event works', async () => {
    const testResponse = {"response": "test"};
    const testInstanceId = "test-instance";

    const onMessage = jest.fn(message => message);
    const mySocket = new Socket({
      instanceId: testInstanceId,
      url,
      logger: new Logger(true),
      onMessage: onMessage
    });
    // wait for connection and skip the first keep-alive message
    const serverSocket = await mockServer.connected;
    await makeEventPromise(serverSocket, 'message');
    // always send static response
    serverSocket.on('message', () => {
      serverSocket.send(JSON.stringify(testResponse));
    });
    // send something and wait for server response
    await mySocket.send("test1", {});
    await mySocket.send("test2", {});

    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenLastCalledWith(testResponse);
  });

});
