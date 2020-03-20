import { unserialize, protobuf, serialize } from './protobuf';
import { State } from './types/plan';
import { TorchTensor } from './types/torch';
import Placeholder from './types/placeholder';

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
    const
      placeholders = [],
      tensors = [];

    for (let i = 0; i < updatedModelParams.length; i++) {
      let paramDiff = this.params[i].sub(updatedModelParams[i]);
      placeholders.push(new Placeholder(i, [`#${i}`, `#state-${i}`]));
      tensors.push(await TorchTensor.fromTfTensor(paramDiff));
    }
    const state = new State(placeholders, tensors);
    const bin = serialize(this.worker, state);

    // free memory
    tensors.forEach(t => t._tfTensor.dispose());

    return bin;
  }
}
