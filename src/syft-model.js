import { unserialize, protobuf, serialize } from './protobuf';
import { State } from './types/state';
import { TorchTensor } from './types/torch';
import { Placeholder } from './types/placeholder';
import { MODEL_LOAD_FAILED } from './_errors';

/**
 * Model parameters as stored in the PyGrid.
 *
 * @property {[tf.Tensor]} params - Array of Model parameters.
 */
export default class SyftModel {
  /**
   * @hideconstructor
   * @param {Object} options
   * @param {Syft} options.worker - Instance of Syft client.
   * @param {ArrayBuffer} options.serializedModelParameters - Serialized Model parameters as returned by PyGrid.
   * @param {[tf.Tensor]} options.modelParameters - Serialized Model parameters as returned by PyGrid.
   */
  constructor({
    worker,
    serializedModelParameters = null,
    modelParameters = null,
  }) {
    this.worker = worker;
    if (serializedModelParameters) {
      // Convert model from binary and store model weights in the syft class State
      try {
        const state = unserialize(
          worker,
          serializedModelParameters,
          protobuf.syft_proto.execution.v1.State
        );
        this.params = state.getTfTensors();
      } catch (e) {
        throw new Error(MODEL_LOAD_FAILED(e.message));
      }
    }
    if (modelParameters) {
      this.params = modelParameters;
    }
  }

  /**
   * Calculates difference between 2 versions of the Model parameters
   * and returns serialized `diff` that can be submitted to PyGrid.
   *
   * @param {Array.<tf.Tensor>} updatedModelParams - Array of model parameters (tensors).
   * @returns {Promise<ArrayBuffer>} Protobuf-serialized `diff`.
   */
  async createSerializedDiff(updatedModelParams) {
    const placeholders = [],
      tensors = [];

    // Store model weight differences in a new State and convert to protobuf-serialized binary
    for (let i = 0; i < updatedModelParams.length; i++) {
      let paramDiff = this.params[i].sub(updatedModelParams[i]);
      placeholders.push(new Placeholder(i, [`#${i}`, `#state-${i}`]));
      tensors.push(await TorchTensor.fromTfTensor(paramDiff));
    }
    const state = new State(placeholders, tensors);
    const bin = serialize(this.worker, state);

    // Free up memory
    tensors.forEach((t) => t._tfTensor.dispose());

    return bin;
  }

  /**
   * Calculates difference between 2 versions of the Model
   * and returns serialized `diff` that can be submitted to PyGrid.
   *
   * @param {SyftModel} model - Model to compare with.
   * @returns {Promise<ArrayBuffer>} Protobuf-serialized `diff`.
   */
  async createSerializedDiffFromModel(model) {
    return this.createSerializedDiff(model.params);
  }
}
