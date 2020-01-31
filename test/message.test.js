import 'regenerator-runtime/runtime';
import Message from '../src/message';
import { WEBRTC_DATACHANNEL_CHUNK_SIZE } from '../src';
import { randomFillSync } from 'crypto';

describe('Data Message', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('wrap arraybuffer with Message', () => {
    const buf = new ArrayBuffer(100000);
    const message = new Message({data: buf});
    expect(message.chunks).toBe(Math.ceil(100000 / WEBRTC_DATACHANNEL_CHUNK_SIZE));
    expect(() => new Message({data: {}})).toThrow();
  });

  test('Message chunks', () => {
    const buf = new ArrayBuffer(100000);
    const message = new Message({data: buf});
    const chunk = message.getChunk(0);
    expect(chunk.byteLength).toBe(WEBRTC_DATACHANNEL_CHUNK_SIZE);
    const info = Message.messageInfoFromBuf(chunk);
    expect(info.id).toBe(message.id);
    expect(info.chunks).toBe(message.chunks);
    expect(info.chunk).toBe(0);
  });

  test('Get info from chunk', (done) => {
    const buf = new ArrayBuffer(WEBRTC_DATACHANNEL_CHUNK_SIZE + 100);
    randomFillSync(new Uint8Array(buf), 0, buf.byteLength);
    const messageOrig = new Message({data: buf});
    const chunk1 = messageOrig.getChunk(0);
    const info1 = Message.messageInfoFromBuf(chunk1);
    expect(info1.id).toBe(messageOrig.id);
    expect(info1.chunks).toBe(messageOrig.chunks);
    expect(info1.chunk).toBe(0);

    new Uint8Array(chunk1)[0] = 123;
    const infoErr = Message.messageInfoFromBuf(chunk1);
    expect(infoErr.chunk).toBe(false);
  });

  test('Assemble from chunks', (done) => {
    const buf = new ArrayBuffer(WEBRTC_DATACHANNEL_CHUNK_SIZE + 100);
    randomFillSync(new Uint8Array(buf), 0, buf.byteLength);
    const messageOrig = new Message({data: buf});
    const chunk1 = messageOrig.getChunk(0);
    const chunk2 = messageOrig.getChunk(1);
    const info1 = Message.messageInfoFromBuf(chunk1);
    const info2 = Message.messageInfoFromBuf(chunk2);

    const messageAssembled = new Message({id: info1.id});
    messageAssembled.once('ready', (message) => {
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

  test('should error on invalid chunks', (done) => {
    const buf = new ArrayBuffer(WEBRTC_DATACHANNEL_CHUNK_SIZE + 100);
    randomFillSync(new Uint8Array(buf), 0, buf.byteLength);
    const messageOrig = new Message({data: buf});
    const chunk1 = messageOrig.getChunk(0);
    const chunk2 = messageOrig.getChunk(1);

    // id doesn't match
    const messageAssembled = new Message({id: 123});
    expect(() => messageAssembled.addChunk(chunk1)).toThrow();

    // simply invalid chunk
    expect(() => messageAssembled.addChunk(new Uint8Array(3))).toThrow();

    // double chunk add
    const messageAssembled2 = new Message({id: messageOrig.id});
    messageAssembled2.addChunk(chunk1);
    expect(() => messageAssembled2.addChunk(chunk1)).toThrow();
  });

});
