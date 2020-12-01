import * as tf from '@tensorflow/tfjs-core';

/**
 * Collates list of samples into one tensor.
 * When sample is a list or dictionary of tensors:
 *  `[[sampleA1, sampleB1], [sampleA2, sampleB2], ... ]`
 *  `[{a: sampleA1, b: sampleB1}, {a: sampleA2, b: sampleB2}, ... ]`
 * result is a list or dict of collated samples:
 *  `[batchA, batchB]`
 *  `{a: batchA, b: batchB}`
 *
 * @param {Array<tf.Tensor>|Array<Array<tf.Tensor>>|Object} batch - List of data samples to collate
 * @return {tf.Tensor|{}|tf.Tensor[]}
 */
export const tfjs_collate = (batch) => {
  const elem = batch[0];
  if (elem instanceof tf.Tensor) {
    // List of Tensors to stack
    return tf.stack(batch, 0);
  } else if (Array.isArray(elem)) {
    // Sample is a list, we need to collate each element of it
    const params = [];
    for (let i = 0; i < elem.length; i++) {
      params.push(tfjs_collate(batch.map((item) => item[i])));
    }
    return params;
  } else if (typeof batch === 'object' && !!batch) {
    // Sample is an object, we need to collate each property of it
    const dict = {};
    for (let key of Object.keys(elem)) {
      dict[key] = tfjs_collate(batch.map((item) => item[key]));
    }
    return dict;
  }
};
