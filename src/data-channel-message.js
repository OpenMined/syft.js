import EventObserver from './events';
import { WEBRTC_DATACHANNEL_CHUNK_SIZE } from './_constants';

export default class DataChannelMessage {
  static chunkHeaderSign = 0xff00;
  static chunkHeaderLength = 10;

  constructor({ data, id, worker_id }) {
    if (data === undefined) {
      this.data = new ArrayBuffer(0);
    } else if (typeof data === 'string') {
      this.data = new TextEncoder().encode(data).buffer;
    } else if (data instanceof ArrayBuffer) {
      this.data = data;
    } else {
      throw new Error('Message type is not supported');
    }

    this.worker_id = worker_id;
    this.size = this.data.byteLength;
    this.dataChunks = [];
    this.id = id || Math.floor(Math.random() * 0xffffffff);
    this.observer = new EventObserver();
    this.chunks = Math.ceil(
      this.size /
        (WEBRTC_DATACHANNEL_CHUNK_SIZE - DataChannelMessage.chunkHeaderLength)
    );
    this.makeChunkHeader(0);
  }

  /**
   * Creates chunk header for given chunk index
   * @param {number} chunk Chunk index
   * @returns {ArrayBuffer}
   */
  makeChunkHeader(chunk) {
    if (this.chunkHeader === undefined) {
      this.chunkHeader = new ArrayBuffer(DataChannelMessage.chunkHeaderLength);

      const view = new DataView(this.chunkHeader);

      view.setUint16(0, DataChannelMessage.chunkHeaderSign);
      view.setUint32(2, this.id);
      view.setUint16(6, this.chunks);
      view.setUint16(8, chunk);
    } else {
      const view = new DataView(this.chunkHeader);

      view.setUint16(8, chunk);
    }

    return this.chunkHeader;
  }

  once(event, func) {
    this.observer.subscribe(event, data => {
      this.observer.unsubscribe(event);

      func(data);
    });
  }

  /**
   * Gets chunk info from header
   * @param {ArrayBuffer} buf
   */
  static messageInfoFromBuf(buf) {
    let view;

    try {
      view = new DataView(buf);
      if (view.getUint16(0) !== DataChannelMessage.chunkHeaderSign) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return {
      id: view.getUint32(2),
      chunks: view.getUint16(6),
      chunk: view.getUint16(8)
    };
  }

  /**
   * Adds chunk for further assembly
   * @param {ArrayBuffer} buf
   */
  addChunk(buf) {
    const info = DataChannelMessage.messageInfoFromBuf(buf);

    if (info === false) {
      throw new Error(`Is not a valid chunk`);
    }

    if (this.id !== info.id) {
      throw new Error(
        `Trying to add chunk from different message: ${this.id} != ${info.id}`
      );
    }

    if (this.dataChunks[info.chunk] !== undefined) {
      throw new Error(`Duplicated chunk ${info.chunks} in message ${this.id}`);
    }

    this.dataChunks[info.chunk] = buf.slice(
      DataChannelMessage.chunkHeaderLength
    );

    if (this.dataChunks.length === info.chunks) {
      this.assemble();
    }
  }

  /**
   * Concatenate data pieces
   */
  assemble() {
    let size = 0;

    for (let chunk of this.dataChunks) {
      size += chunk.byteLength;
    }

    const data = new Uint8Array(size);
    let offset = 0;

    for (let chunk of this.dataChunks) {
      data.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    this.chunks = this.dataChunks.length;
    this.size = size;
    this.data = data.buffer;

    // Clean up
    this.dataChunks = [];

    // Emit event when done
    this.observer.broadcast('ready', this);
  }

  /**
   * Slice a piece of message and add a header
   * @param {number} num
   * @returns {ArrayBuffer}
   */
  getChunk(num) {
    const start =
      num *
      (WEBRTC_DATACHANNEL_CHUNK_SIZE - DataChannelMessage.chunkHeaderLength);
    const end = Math.min(
      start +
        WEBRTC_DATACHANNEL_CHUNK_SIZE -
        DataChannelMessage.chunkHeaderLength,
      this.size
    );
    const chunk = new Uint8Array(
      DataChannelMessage.chunkHeaderLength + end - start
    );
    const header = this.makeChunkHeader(num);

    chunk.set(new Uint8Array(header), 0);
    chunk.set(
      new Uint8Array(this.data.slice(start, end)),
      DataChannelMessage.chunkHeaderLength
    );

    return chunk.buffer;
  }
}
