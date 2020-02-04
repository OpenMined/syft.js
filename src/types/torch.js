import { default as proto, protobuf } from '../proto';
import * as tf from '@tensorflow/tfjs';
import { getPbId, unbufferize } from '../protobuf';

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
    this._shape = Array.from(bin[0]);
    this._type = bin[1];
    this._value = bin[2];
    this._tfTensor = tf.tensor(this._value, this._shape, this._type);
  }

  serdeSimplify(f) {
    const TYPE = proto['torch.Tensor'];
    const args = ['id', 'bin', 'chain', 'gradChain', 'tags', 'description', 'serializer']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }

  static unbufferize(worker, pb) {
    if (
      pb.serializer !=
      protobuf.syft_proto.types.torch.v1.TorchTensor.Serializer.SERIALIZER_ALL
    ) {
      throw new Error(
        `Tensor serializer ${pb.serializer} is not supported in syft.js`
      );
    }

    const tensor = pb.contents_data;
    const dtype = tensor.dtype;
    const bin = [tensor.shape.dims, dtype, tensor[`contents_${dtype}`]];

    return new TorchTensor(
      getPbId(pb.id),
      bin,
      null,
      null,
      pb.tags,
      pb.description,
      pb.serializer
    );
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

export class TorchParameter {
  constructor(id, tensor, requiresGrad, grad) {
    this.id = id;
    this.tensor = tensor;
    this.requiresGrad = requiresGrad;
    this.grad = grad;
  }

  static unbufferize(worker, pb) {
    return new TorchParameter(
      getPbId(pb.id),
      unbufferize(pb.tensor),
      pb.requires_grad,
      unbufferize(pb.grad)
    );
  }
}
