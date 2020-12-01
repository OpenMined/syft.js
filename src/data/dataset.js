/**
 * Abstract class for Dataset.
 * `getItem` method and `length` getter must be defined in the child class.
 *
 * @example
 * class MyDataset extends Dataset {
 *   constructor() {
 *     super();
 *     this.data = [1, 2, 3, 4, 5].map(i => tf.tensor(i));
 *     this.labels = [0, 0, 1, 0, 1].map(i => tf.tensor(i));
 *   }
 *
 *   getItem(index) {
 *     return [this.data[index], this.labels[index]];
 *   }
 *
 *   get length() {
 *     return this.data.length;
 *   }
 * }
 *
 * const ds = new MyDataset();
 * ds[0][0].print() // => Tensor 1
 * ds[0][1].print() // => Tensor 0
 *
 * @property {Function} getItem - Returns a sample
 * @property {Number} length - Length of the datasets
 * @abstract
 */
export class Dataset {
  constructor() {
    if (new.target === Dataset) {
      throw new TypeError('Dataset is abstract, extend it');
    }
    if (this.getItem === undefined) {
      throw new TypeError('Override getItem method');
    }
    if (
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), 'length')
        .get === undefined
    ) {
      throw new TypeError('Override length getter');
    }

    // Make dataset[x] work
    const subscriptableHandler = {
      get: function (target, prop /* receiver */) {
        const possibleIdx = parseInt(prop);
        if (Number.isInteger(possibleIdx) && possibleIdx >= 0) {
          return target.getItem(prop);
        } else {
          return Reflect.get(...arguments);
        }
      },
    };

    return new Proxy(this, subscriptableHandler);
  }
}
