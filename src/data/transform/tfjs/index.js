import * as tf from '@tensorflow/tfjs-core';
import { Transform } from '../core';

/**
 * Converts numeric data to tfjs tensor of specified shape and dtype.
 *
 * @param {...Object} options - Options dict per each input
 * @param {Number[]} options.shape - Tensor shape
 * @param {String} options.dtype - Tensor dtype
 */
export class ToTensor extends Transform {
  applyToItem(item, options) {
    const { shape = null, dtype = null } = options || {};
    return tf.tensor(item, shape, dtype);
  }
}

/**
 * Scales tensor using mean/std.
 *
 * @param {...Object} options - Options dict per each input
 * @param {Number[]} options.mean - Mean (one item per channel)
 * @param {Number[]} options.std - Std (one item per channel)
 */
export class Normalize extends Transform {
  applyToItem(item, options) {
    const { mean, std } = options;
    const channels = mean.length;
    let dataChannels, dataShape;
    if (item.rank <= 1) {
      dataChannels = 1;
      dataShape = item.shape;
    } else {
      [dataChannels, ...dataShape] = item.shape;
    }

    if (channels !== 1 && dataChannels !== channels) {
      throw new TypeError('Number of channels does not match');
    }

    let result;
    if (channels > 1) {
      const means = [];
      const stds = [];
      for (let i = 0; i < channels; i++) {
        means.push(tf.zeros(dataShape).add(mean[i]));
        stds.push(tf.zeros(dataShape).add(std[i]));
      }
      result = item.sub(tf.stack(means)).div(tf.stack(stds));
    } else {
      result = item.sub(mean[0]).div(std[0]);
    }
    return result;
  }
}

/**
 * One-hot encoding of tensor.
 *
 * @param {...Object} options - Options dict per each input
 * @param {Number} options.depth - Number of classes for one-hot encoding
 * @param {Boolean} options.squeeze - Do not add extra dimension
 */
export class OneHot extends Transform {
  applyToItem(item, options) {
    const { depth, squeeze = false } = options;
    const oneHot = tf.oneHot(item, depth);
    if (squeeze) {
      return tf.squeeze(oneHot);
    }
    return oneHot;
  }
}
