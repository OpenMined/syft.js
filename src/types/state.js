import { protobuf, unbufferize } from '../protobuf';

export class State {
  constructor(placeholders = null, tensors = null) {
    this.placeholders = placeholders;
    this.tensors = tensors;
  }

  getTfTensors() {
    return this.tensors.map(t => t.toTfTensor());
  }

  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map(stateTensor => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }

  bufferize(worker) {
    const tensorsPb = this.tensors.map(tensor =>
      protobuf.syft_proto.execution.v1.StateTensor.create({
        torch_tensor: tensor.bufferize(worker)
      })
    );
    const placeholdersPb = this.placeholders.map(ph => ph.bufferize());
    return protobuf.syft_proto.execution.v1.State.create({
      placeholders: placeholdersPb,
      tensors: tensorsPb
    });
  }
}
