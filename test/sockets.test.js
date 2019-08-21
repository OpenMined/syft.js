import 'regenerator-runtime/runtime';

import Socket from '../src/sockets';
import Logger from '../src/logger';

import { WebSocket, Server } from 'mock-socket';

global.WebSocket = WebSocket;

const url = 'ws://localhost:8080/';

const onMessage = event => console.log('NEW MESSAGE', event);
const onOpen = event => console.log('NEW OPEN', event);
const onClose = event => console.log('NEW CLOSE', event);
const onError = event => console.log('NEW ERROR', event);

describe('Sockets', () => {
  jest.spyOn(console, 'log');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('can communicate with a socket server', async () => {
    const message = { message: 'This is a test' };

    const mockServer = new Server(url);
    const mySocket = new Socket({
      url,
      logger: new Logger(true),
      onMessage: event => onMessage(event),
      onOpen: event => onOpen(event),
      onClose: event => onClose(event),
      onError: event => onError(event)
    });

    expect(console.log.mock.calls.length).toBe(0);

    await mockServer.on('connection', async socket => {
      await expect(console.log.mock.calls.length).toBe(2);
      await expect(console.log.mock.calls[0][0]).toEqual(
        expect.stringContaining(`Opening socket connection to ${url}`)
      );
      await expect(console.log.mock.calls[1][0]).toBe(`NEW OPEN`);

      await socket.send(JSON.stringify(message));

      await expect(console.log.mock.calls.length).toBe(4);
      await expect(console.log.mock.calls[2][0]).toEqual(
        expect.stringContaining('Receiving message')
      );
      await expect(console.log.mock.calls[3][0]).toBe(`NEW MESSAGE`);

      await socket.close();

      await expect(console.log.mock.calls.length).toBe(6);
      await expect(console.log.mock.calls[4][0]).toEqual(
        expect.stringContaining(`Closing socket connection to ${url}`)
      );
      await expect(console.log.mock.calls[5][0]).toBe(`NEW CLOSE`);
    });
  });
});
