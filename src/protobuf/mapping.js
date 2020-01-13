import { protobuf } from 'syft-proto';
import Protocol from '../types/protocol';
import { ObjectMessage } from '../types/message';
import { TorchTensor } from '../types/torch';

let PB_CLASS_MAP, PB_TO_UNBUFFERIZER;

// because of cyclic dependencies between Protocol/etc modules and protobuf module
// Protocol/etc classes are undefined at the moment when this module is imported
export const initMappings = () => {
  PB_CLASS_MAP = [
    [Protocol, protobuf.syft_proto.messaging.v1.Protocol],
    [ObjectMessage, protobuf.syft_proto.messaging.v1.ObjectMessage],
    [TorchTensor, protobuf.syft_proto.types.torch.v1.TorchTensor]
  ];

  PB_TO_UNBUFFERIZER = PB_CLASS_MAP.reduce((map, item) => {
    map[item[1]] = item[0].unbufferize;
    return map;
  }, {});
};

export { PB_CLASS_MAP, PB_TO_UNBUFFERIZER };
