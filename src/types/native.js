import TupleW from 'tuple-w';
import { default as proto } from '../proto';

export class Dict extends Map {
  constructor(...args) {
    super(...args);
  }

  serdeSimplify(f) {
    const TYPE = proto['dict'];
    return `(${TYPE}, (${Array.from(this.entries()).map(([key, value]) => `(${f(key)}, ${f(value)})`).join()}))`; // prettier-ignore
  }
}

export class List extends Array {
  constructor(...args) {
    // We have to do a weird check for the list being of a single item...
    // That's because if you do `new Array()` with just a single item passed and that item is also a positive integer
    // then it will generate an array with the length of that integer.
    // new Array(239487843) creates a VERY long array with no items, NOT an array with one item: 239487843
    const isSingle = args.length === 1;

    if (isSingle) args.push('');
    super(...args);
    if (isSingle) this.pop();
  }

  serdeSimplify(f) {
    const TYPE = proto['list'];
    return `(${TYPE}, (${this.map(i => f(i)).join()}))`; // prettier-ignore
  }
}

export class Range {
  constructor(start, end, step) {
    this.start = start;
    this.end = end;
    this.step = step;

    // TODO: Fill out range further
    // Keep in mind, we don't want to generate the range in memory because that's exactly what makes Python ranges so efficient
  }

  serdeSimplify(f) {
    const TYPE = proto['range'];
    return `(${TYPE}, (${this.start}, ${this.end}, ${this.step}))`; // prettier-ignore
  }
}

// NOTE: We're adding a method to the primitive "Set" - this is normally considered dangerous.
// However, due to the specific name "serdeSimplify" I think we're safe from conflicts with other libraries and future JS methods
Set.prototype.serdeSimplify = function(f) {
  const TYPE = proto['set'];
  return `(${TYPE}, (${[...this].map(i => f(i)).join()}))`; // prettier-ignore
};

export class Slice {
  constructor(start, end, step = null) {
    this.start = start;
    this.end = end;
    this.step = step;

    // TODO: Fill out slice further
    // Keep in mind, we don't want to generate the slice in memory because that's exactly what makes Python ranges so efficient
  }

  serdeSimplify(f) {
    const TYPE = proto['slice'];
    return `(${TYPE}, (${this.start}, ${this.end}, ${this.step}))`; // prettier-ignore
  }
}

// NOTE: We're adding a method to the primitive "String" - this is normally considered dangerous.
// However, due to the specific name "serdeSimplify" I think we're safe from conflicts with other libraries and future JS methods
String.prototype.serdeSimplify = function(f) {
  const TYPE = proto['str'];
  return `(${TYPE}, (b'${this}'))`;
};

export class Tuple extends TupleW {
  constructor(...args) {
    super(...args);
  }

  serdeSimplify(f) {
    const TYPE = proto['tuple'];
    return `(${TYPE}, (${this.toArray().map(i => f(i)).join()}))`; // prettier-ignore
  }
}
