import { default as proto } from '../proto';

export class TorchTensor {
  constructor(id, bin, chain, gradChain, tags, description, serializer) {
    this.id = id;
    this.bin = bin;
    this.chain = chain;
    this.gradChain = gradChain;
    this.tags = tags;
    this.description = description;
    this.serializer = serializer;

    // We need a TensorFlow.js tensor to interact with, but we'll still save all the info above
    this._shape = bin[0];
    this._type = bin[1];
    this._value = bin[2];
    this._tfTensor = tf.tensor(this._value, this._shape.toArray(), this._type);
  }

  serdeSimplify(f) {
    const TYPE = proto['torch.Tensor'];
    const args = ['id', 'bin', 'chain', 'gradChain', 'tags', 'description', 'serializer']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}

export class TorchSize {
  constructor(size) {
    this.size = size;
  }

  serdeSimplify(f) {
    const TYPE = proto['torch.Size'];
    return `(${TYPE}, (${this.size}))`; // prettier-ignore
  }
}
