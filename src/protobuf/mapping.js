import { protobuf } from 'syft-proto';
import Protocol from '../types/protocol';
import { Plan } from '../types/plan';
import { Role } from '../types/role';
import { State } from '../types/state';
import { ObjectMessage } from '../types/message';
import { TorchParameter, TorchTensor } from '../types/torch';
import { Placeholder, PlaceholderId } from '../types/placeholder';
import { ComputationAction } from '../types/computation-action';

let PB_CLASS_MAP, PB_TO_UNBUFFERIZER;

// Because of cyclic dependencies between Protocol/etc modules and protobuf module
// Protocol/etc classes are undefined at the moment when this module is imported
export const initMappings = () => {
  PB_CLASS_MAP = [
    [Protocol, protobuf.syft_proto.execution.v1.Protocol],
    [Plan, protobuf.syft_proto.execution.v1.Plan],
    [Role, protobuf.syft_proto.execution.v1.Role],
    [State, protobuf.syft_proto.execution.v1.State],
    [ComputationAction, protobuf.syft_proto.execution.v1.ComputationAction],
    [Placeholder, protobuf.syft_proto.execution.v1.Placeholder],
    [PlaceholderId, protobuf.syft_proto.execution.v1.PlaceholderId],
    [ObjectMessage, protobuf.syft_proto.messaging.v1.ObjectMessage],
    [TorchTensor, protobuf.syft_proto.types.torch.v1.TorchTensor],
    [TorchParameter, protobuf.syft_proto.types.torch.v1.Parameter],
  ];

  PB_TO_UNBUFFERIZER = PB_CLASS_MAP.reduce((map, item) => {
    map[item[1]] = item[0].unbufferize;
    return map;
  }, {});
};

export { PB_CLASS_MAP, PB_TO_UNBUFFERIZER };
