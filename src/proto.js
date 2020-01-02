import { proto_info } from 'syft-proto';

const PROTO = {};

for (let type of Object.keys(proto_info.TYPES)) {
  PROTO[type] = proto_info.TYPES[type].code;
}

export default PROTO;
