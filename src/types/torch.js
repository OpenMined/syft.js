import { getPbId, unbufferize, protobuf } from '../protobuf';
import * as tf from '@tensorflow/tfjs-core';

export class TorchTensor {
  constructor(
    id,
    contents,
    shape,
    dtype,
    chain = null,
    gradChain = null,
    tags = [],
    description = null
  ) {
    this.id = id;
    this.shape = shape;
    this.dtype = dtype;
    this.contents = contents;
    this.chain = chain;
    this.gradChain = gradChain;
    this.tags = tags;
    this.description = description;

    // We need a TensorFlow.js tensor to interact with, but we'll still save all the info above
    this._tfTensor = tf.tensor(this.contents, this.shape, this.dtype);
  }

  static unbufferize(worker, pb) {
    if (
      pb.serializer !==
      protobuf.syft_proto.types.torch.v1.TorchTensor.Serializer.SERIALIZER_ALL
    ) {
      throw new Error(
        `Tensor serializer ${pb.serializer} is not supported in syft.js`
      );
    }

    // unwrap TensorData
    const tensorData = pb.contents_data;
    const dtype = tensorData.dtype;
    const shape = tensorData.shape.dims;
    const contents = tensorData[`contents_${dtype}`];

    return new TorchTensor(
      getPbId(pb.id),
      contents,
      shape,
      dtype,
      unbufferize(worker, pb.chain),
      unbufferize(worker, pb.grad_chain),
      pb.tags,
      pb.description
    );
  }
}

export class TorchSize {
  constructor(size) {
    this.size = size;
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
      unbufferize(worker, pb.tensor),
      pb.requires_grad,
      unbufferize(worker, pb.grad)
    );
  }
}
