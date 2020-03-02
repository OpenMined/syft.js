import { unserialize, protobuf } from './protobuf';

export default class SyftModel {
  constructor({ worker, modelData }) {
    const state = unserialize(
      worker,
      modelData,
      protobuf.syft_proto.messaging.v1.State
    );
    this.params = state.getTfTensors();
  }
}
