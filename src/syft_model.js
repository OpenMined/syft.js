import { unserialize, protobuf } from './protobuf';

export default class SyftModel {
  constructor({ worker, data }) {
    const state = unserialize(
      worker,
      data,
      protobuf.syft_proto.messaging.v1.State
    );
    this.params = state.tensors;
  }
}
