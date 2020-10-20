/**
 * Abstract Sampler class.
 * Sampler produces indices for fetching samples from the Dataset.
 *
 * @private
 */
export class Sampler {
  constructor(dataset) {
    if (new.target === Sampler) {
      throw new TypeError('Sampler is abstract, extend it');
    }
    if (this[Symbol.iterator] === undefined) {
      throw new TypeError('Override iterator method');
    }
    if (
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), 'length')
        .get === undefined
    ) {
      throw new TypeError('Override length getter');
    }
    this.dataset = dataset;
  }
}

/**
 * Sequential sampler produces indices in sequential order.

 * @private
 * @param {Dataset} dataset
 */
export class SequentialSampler extends Sampler {
  constructor(dataset) {
    super(dataset);
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.dataset.length; i++) {
      yield i;
    }
  }

  get length() {
    return this.dataset.length;
  }
}

/**
 * Random sampler produces random indices drawn from uniform distribution.
 *
 * @private
 * @param {Dataset} dataset
 */
export class RandomSampler extends Sampler {
  constructor(dataset) {
    super(dataset);
  }

  *[Symbol.iterator]() {
    // Create & shuffle list of dataset indices
    const indices = [...Array(this.dataset.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    yield* indices;
  }

  get length() {
    return this.dataset.length;
  }
}

/**
 * Batch sampler produces batched indices of other samplers.
 *
 * @private
 * @param {Sampler} sampler - Sampler to use for batching
 * @param {Number} batchSize - Batch size
 * @param {Boolean} dropLast - Whether the last undersized batch should be omitted
 */
export class BatchSampler extends Sampler {
  constructor(sampler, batchSize, dropLast) {
    super();
    this.sampler = sampler;
    this.batchSize = batchSize;
    this.dropLast = dropLast;
  }

  *[Symbol.iterator]() {
    let batch = [];
    for (let idx of this.sampler) {
      batch.push(idx);
      if (batch.length === this.batchSize) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length > 0 && !this.dropLast) {
      yield batch;
    }
  }

  get length() {
    return Math[this.dropLast ? 'floor' : 'ceil'](
      this.sampler.length / this.batchSize
    );
  }
}
