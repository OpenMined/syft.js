import { protobuf, unbufferize } from '../protobuf';
import { TorchTensor } from './torch';

/**
 * State stores a list of tensors. In Syft.JS, State is used to
 * serialize and store model weights.
 */
export class State {
  /**
   * @hideconstructor
   * @param {Array.<Placeholder>} [placeholders=null] - Array of Placeholders.
   * @param {Array.<TorchTensor>} [tensors=null] - Array of TorchTensors.
   */
  constructor(placeholders = null, tensors = null) {
    this.placeholders = placeholders;
    this.tensors = tensors;
  }

  /**
   * Converts an Array of TorchTensor to tf.Tensor.
   * @returns {Array.<tf.Tensor>}
   */
  getTfTensors() {
    return this.tensors.map((t) => t.toTfTensor());
  }

  /**
   * Reconstructs a State object from the protobuf message.
   * Note that this method take a worker-specific argument in the future.
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.State} pb - Protobuf object for State.
   * @returns {State}
   */
  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map((stateTensor) => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }

  /**
   * Bufferizes the State object, its tensors and placeholders to
   * a protobuf State object.
   *
   * Note that this method should take a worker-specific argument in the future.
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @returns {protobuf.syft_proto.execution.v1.State}
   */
  bufferize(worker) {
    const tensorsPb = this.tensors.map((tensor) =>
      protobuf.syft_proto.execution.v1.StateTensor.create({
        torch_tensor: tensor.bufferize(worker),
      })
    );
    const placeholdersPb = this.placeholders.map((ph) => ph.bufferize());
    return protobuf.syft_proto.execution.v1.State.create({
      placeholders: placeholdersPb,
      tensors: tensorsPb,
    });
  }
}
