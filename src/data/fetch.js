/**
 * Base class for dataset fetchers.
 * Fetcher takes index or list of indices and returns collated samples from the dataset.
 *
 * @private
 * @param {Dataset} dataset - Dataset to fetch from
 * @param {Function} collateFn - Collate function
 * @param {Boolean} dropLast - If the last batch needs to be dropped
 */
class BaseDatasetFetcher {
  constructor(dataset, collateFn, dropLast) {
    this.dataset = dataset;
    this.collateFn = collateFn;
    this.dropLast = dropLast;
  }

  fetch(/* index */) {}
}

/**
 * Map-style dataset fetcher.
 * Assumes that a dataset sample can be accessed by specific index,
 * i.e. it is not iterable-style dataset.
 *
 * @private
 */
export class MapDatasetFetcher extends BaseDatasetFetcher {
  constructor(dataset, collateFn, dropLast) {
    super(dataset, collateFn, dropLast);
  }

  /**
   * Fetches a sample or batch of samples from the dataset.
   *
   * @param {Number[]|Number} indices
   * @return {*}
   */
  fetch(indices) {
    let data;
    if (Array.isArray(indices)) {
      data = indices.map((idx) => this.dataset.getItem(idx));
    } else {
      data = this.dataset.getItem(indices);
    }
    return this.collateFn(data);
  }
}
