import { getPbId, unbufferize, protobuf, pbId } from '../protobuf';
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
    this._tfTensor = null;
  }

  toTfTensor() {
    if (!this._tfTensor) {
      this._tfTensor = tf.tensor(this.contents, this.shape, this.dtype);
    }
    return this._tfTensor;
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

  bufferize(/* worker */) {
    const tensorData = {
      shape: protobuf.syft_proto.types.torch.v1.Size.create({
        dims: this.shape
      }),
      dtype: this.dtype
    };
    tensorData[`contents_${this.dtype}`] = this.contents;
    const pbTensorData = protobuf.syft_proto.types.torch.v1.TensorData.create(
      tensorData
    );
    return protobuf.syft_proto.types.torch.v1.TorchTensor.create({
      id: pbId(this.id),
      serializer:
        protobuf.syft_proto.types.torch.v1.TorchTensor.Serializer
          .SERIALIZER_ALL,
      contents_data: pbTensorData,
      tags: this.tags,
      description: this.description
    });
  }

  static async fromTfTensor(tensor) {
    const flat = tensor.flatten();
    const array = await flat.array();
    flat.dispose();
    const t = new TorchTensor(tensor.id, array, tensor.shape, tensor.dtype);
    t._tfTensor = tensor;
    return t;
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
