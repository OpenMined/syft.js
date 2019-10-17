import { proto_info } from 'pysyft-proto';

const PROTO = {};

for (let type of Object.keys(proto_info.TYPES)) {
  PROTO[type] = proto_info.TYPES[type].code;
}

export default PROTO;
