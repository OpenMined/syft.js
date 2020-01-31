import 'regenerator-runtime/runtime';
import Logger from '../src/logger';
import Message from '../src/message';
import MessageQueue from '../src/message_queue';
import { WEBRTC_DATACHANNEL_CHUNK_SIZE } from '../src';
import { randomFillSync } from 'crypto';

describe('Data Message Queue', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('can register a message', () => {
    const queue = new MessageQueue();
    const message = new Message({id: 123});
    queue.register(message);
    expect(queue.isRegistered(message.id)).toBe(true);
    expect(queue.register(message)).toBe(false);
  });

  test('can unregister a message', () => {
    const queue = new MessageQueue();
    const message = new Message({id: 123});
    queue.register(message);
    expect(queue.isRegistered(message.id)).toBe(true);
    queue.unregister(message);
    expect(queue.isRegistered(message.id)).toBe(false);
  });

  test('can get a registered message', () => {
    const queue = new MessageQueue();
    const message = new Message({id: 123});
    queue.register(message);
    expect(queue.getById(message.id)).toBe(message);
    queue.unregister(message);
    expect(queue.getById(message.id)).toBe(undefined);
  });

  test('Emits "message" event when the message is ready', (done) => {
    const buf = new ArrayBuffer(WEBRTC_DATACHANNEL_CHUNK_SIZE + 100);
    randomFillSync(new Uint8Array(buf), 0, buf.byteLength);
    const messageOrig = new Message({data: buf});
    const chunk1 = messageOrig.getChunk(0);
    const chunk2 = messageOrig.getChunk(1);
    const info1 = Message.messageInfoFromBuf(chunk1);
    const info2 = Message.messageInfoFromBuf(chunk2);

    const messageAssembled = new Message({id: info1.id});
    const queue = new MessageQueue();
    queue.register(messageAssembled);

    queue.on('message', (message) => {
      expect(message.chunks).toBe(messageOrig.chunks);
      expect(message.size).toBe(messageOrig.size);
      const orig = new Uint8Array(messageOrig.data);
      const assembled = new Uint8Array(message.data);
      expect(orig.every((v, i) => assembled[i] === v)).toBe(true);
      done();
    });

    messageAssembled.addChunk(chunk1);
    messageAssembled.addChunk(chunk2);
  });

});
