import { protobuf } from 'syft-proto';
import Protocol from '../types/protocol';
import { Plan, State } from '../types/plan';
import { Operation, ObjectMessage } from '../types/message';
import { TorchParameter, TorchTensor } from '../types/torch';
import Placeholder from '../types/placeholder';

let PB_CLASS_MAP, PB_TO_UNBUFFERIZER;

// because of cyclic dependencies between Protocol/etc modules and protobuf module
// Protocol/etc classes are undefined at the moment when this module is imported
export const initMappings = () => {
  PB_CLASS_MAP = [
    [Protocol, protobuf.syft_proto.execution.v1.Protocol],
    [Plan, protobuf.syft_proto.execution.v1.Plan],
    [State, protobuf.syft_proto.execution.v1.State],
    [Operation, protobuf.syft_proto.types.syft.v1.Operation],
    [
      Placeholder,
      protobuf.syft_proto.frameworks.torch.tensors.interpreters.v1.Placeholder
    ],
    [ObjectMessage, protobuf.syft_proto.messaging.v1.ObjectMessage],
    [TorchTensor, protobuf.syft_proto.types.torch.v1.TorchTensor],
    [TorchParameter, protobuf.syft_proto.types.torch.v1.Parameter]
  ];

  PB_TO_UNBUFFERIZER = PB_CLASS_MAP.reduce((map, item) => {
    map[item[1]] = item[0].unbufferize;
    return map;
  }, {});
};

export { PB_CLASS_MAP, PB_TO_UNBUFFERIZER };
