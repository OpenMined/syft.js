/**
 * Base transformation class.
 *
 * @param {...Object} options - Each argument is an options dict for an individual input
 */
export class Transform {
  constructor(...options) {
    this.options = options;
  }

  apply(...items) {
    return items.map((item, idx) => {
      if (!this.options[idx]) {
        return item;
      }
      return this.applyToItem(item, this.options[idx]);
    });
  }

  applyToItem(item /* options */) {
    // no-op
    return item;
  }
}

/**
 * Composes multiple transforms into one.
 *
 * @param {Transform[]} transforms - Array of transforms
 */
export class Compose extends Transform {
  constructor(transforms) {
    super();
    this.transforms = transforms;
  }

  apply(...data) {
    let _data = data;
    for (let transform of this.transforms) {
      _data = transform.apply(..._data);
    }
    return _data;
  }
}
