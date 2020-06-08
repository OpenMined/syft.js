import { unserialize, protobuf, serialize } from './protobuf';
import { State } from './types/state';
import { TorchTensor } from './types/torch';
import { Placeholder } from './types/placeholder';

/**
 * Model parameters as stored in the PyGrid.
 *
 * @property {Array.<tf.Tensor>} params Array of Model parameters.
 */
export default class SyftModel {
  /**
   * @hideconstructor
   * @param {Object} options
   * @param {Syft} options.worker Instance of Syft client.
   * @param {ArrayBuffer} options.modelData Serialized Model parameters as returned by PyGrid.
   */
  constructor({ worker, modelData }) {
    const state = unserialize(
      worker,
      modelData,
      protobuf.syft_proto.execution.v1.State
    );
    this.worker = worker;
    this.params = state.getTfTensors();
  }

  /**
   * Calculates difference between 2 versions of the Model parameters
   * and returns serialized `diff` that can be submitted to PyGrid.
   *
   * @param {Array.<tf.Tensor>} updatedModelParams Array of model parameters (tensors).
   * @returns {Promise<ArrayBuffer>} Protobuf-serialized `diff`.
   */
  async createSerializedDiff(updatedModelParams) {
    const placeholders = [],
      tensors = [];

    for (let i = 0; i < updatedModelParams.length; i++) {
      let paramDiff = this.params[i].sub(updatedModelParams[i]);
      placeholders.push(new Placeholder(i, [`#${i}`, `#state-${i}`]));
      tensors.push(await TorchTensor.fromTfTensor(paramDiff));
    }
    const state = new State(placeholders, tensors);
    const bin = serialize(this.worker, state);

    // Free memory.
    tensors.forEach(t => t._tfTensor.dispose());

    return bin;
  }
}
