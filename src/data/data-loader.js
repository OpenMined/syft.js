import { SequentialSampler, BatchSampler, RandomSampler } from './sampler';
import { MapDatasetFetcher } from './fetch';
import { tfjs_collate } from './collate';

/**
 * DataLoader controls fetching the data from the Dataset,
 * including shuffling and batching.
 * Implements iterable protocol to iterate over data samples.
 *
 * Note: currently it only supports tf.Tensor data in the dataset,
 * and collates batches using TFJS.
 *
 * @example
 * const loader = new DataLoader({dataset, batchSize: 32})
 * consle.log('number of batches: ', loader.length)
 * for (let batch of loader) {
 *   // ...
 * }
 *
 * @param {Object} parameters
 * @param {Dataset} parameters.dataset - Dataset to load
 * @param {Number} parameters.batchSize - Batch size for batching
 * @param {Boolean} parameters.shuffle - Shuffle the Dataset
 * @param {Boolean} parameters.dropLast - Skip the last chunk if it is smaller than the `batchSize`
 *
 * @property {Number} length - Data length.
 */
export class DataLoader {
  constructor({ dataset, batchSize = 1, shuffle = true, dropLast = false }) {
    this.dataset = dataset;
    this.batchSize = batchSize;
    this.shuffle = shuffle;
    this.dropLast = dropLast;

    if (this.shuffle) {
      this.sampler = new RandomSampler(this.dataset);
    } else {
      this.sampler = new SequentialSampler(this.dataset);
    }

    this.batchSampler = new BatchSampler(
      this.sampler,
      this.batchSize,
      this.dropLast
    );

    // Default collate function supports TFJS only
    this.collateFn = tfjs_collate;
  }

  /**
   * Iterator producing data batches.
   * @return {*}
   */
  *[Symbol.iterator]() {
    const iterator = new SimpleDataloaderIterator(this);
    yield* iterator;
  }

  /**
   * Returns indices sampler.
   * @private
   * @return {Sampler}
   */
  get indexSampler() {
    return this.batchSampler;
  }

  get length() {
    return this.indexSampler.length;
  }
}

/**
 * Base class for DataLoader iterator.
 *
 * @private
 * @param {DataLoader} loader - DataLoader to iterate
 */
class BaseDataLoaderIterator {
  constructor(loader) {
    this.indexSampler = loader.indexSampler;
    this.collateFn = loader.collateFn;
    this.datasetFetcher = new MapDatasetFetcher(
      loader.dataset,
      loader.collateFn,
      loader.dropLast
    );
  }
}

/**
 * Simple Dataloader iterator that sequentially fetches
 * dataset samples as a single worker.
 *
 * @private
 * @param {DataLoader} loader - DataLoader to iterate
 */
class SimpleDataloaderIterator extends BaseDataLoaderIterator {
  constructor(loader) {
    super(loader);
  }

  *[Symbol.iterator]() {
    for (let index of this.indexSampler) {
      yield this.datasetFetcher.fetch(index);
    }
  }
}
