import { unserialize, protobuf, serialize } from './protobuf';
import { State } from './types/plan';
import { TorchTensor } from './types/torch';

export default class SyftModel {
  constructor({ worker, modelData }) {
    const state = unserialize(
      worker,
      modelData,
      protobuf.syft_proto.execution.v1.State
    );
    this.worker = worker;
    this.params = state.getTfTensors();
  }

  async createSerializedDiff(updatedModelParams) {
    const modelDiff = [];
    for (let i = 0; i < updatedModelParams.length; i++) {
      modelDiff.push(this.params[i].sub(updatedModelParams[i]));
    }

    const tensors = [];
    for (let param of modelDiff) {
      tensors.push(await TorchTensor.fromTfTensor(param));
    }
    const state = new State([], tensors);
    const bin = serialize(this.worker, state);

    // free memory
    tensors.forEach(t => t._tfTensor.dispose());

    return bin;
  }
}
