/**
 * Creates ArrayBuffer with given size populated with random values
 * @param size {number} - Buffer size in bytes
 * @returns {ArrayBuffer}
 */
export const createRandomBuffer = async (size) => {
  return new Promise((resolve) => {
    // Uint32Array is faster, 4 times less Math.random() calls
    const int32BuffSize = Math.ceil(size / 4);
    const buff = new Uint32Array(int32BuffSize);
    const int32Max = Math.pow(2, 32);
    const randomInt32 = () => Math.random() * int32Max;

    // Don't block event loop too much, break every 1mb
    const int32ChunkSize = (1024 * 1024) / 4;
    const fillNextChunk = (offset = 0) => {
      const stop = Math.min(offset + int32ChunkSize, int32BuffSize);
      for (let i = offset; i < stop; i++) {
        buff[i] = randomInt32();
      }
      if (stop !== int32BuffSize) {
        setTimeout(fillNextChunk, 0, offset + int32ChunkSize);
      } else {
        resolve(buff.buffer);
      }
    };
    setTimeout(fillNextChunk, 0);
  });
};
