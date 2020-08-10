import { decode, encode } from 'base64-arraybuffer';

/**
 * Decodes base64-encoded string to ArrayBuffer
 * @param {string} str
 * @returns {Uint8Array}
 */
export const base64Decode = (str) => {
  return new Uint8Array(decode(str));
};

/**
 * Encodes ArrayBuffer to base64 string
 * @param {ArrayBuffer} array
 * @returns {string}
 */
export const base64Encode = (array) => {
  return encode(array);
};
