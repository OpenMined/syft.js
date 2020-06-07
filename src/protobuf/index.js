import { NO_DETAILER } from '../_errors';
import { initMappings, PB_TO_UNBUFFERIZER } from './mapping';
import { protobuf } from 'syft-proto';
export { protobuf };

export const unbufferize = (worker, pbObj) => {
  if (!PB_TO_UNBUFFERIZER) {
    initMappings();
  }

  if (
    pbObj === undefined ||
    pbObj === null ||
    ['number', 'string', 'boolean'].includes(typeof pbObj)
  ) {
    return pbObj;
  }

  const pbType = pbObj.constructor;

  // automatically unbufferize repeated fields
  if (Array.isArray(pbObj)) {
    return pbObj.map(item => unbufferize(worker, item));
  }

  // automatically unbufferize map fields
  if (pbType.name === 'Object') {
    let res = {};
    for (let key of Object.keys(pbObj)) {
      res[key] = unbufferize(worker, pbObj[key]);
    }
    return res;
  }

  // automatically unwrap Arg
  if (pbType === protobuf.syft_proto.types.syft.v1.Arg) {
    return unbufferize(worker, pbObj[pbObj.arg]);
  }

  const unbufferizer = PB_TO_UNBUFFERIZER[pbType];
  if (typeof unbufferizer === 'undefined') {
    throw new Error(NO_DETAILER(pbType));
  }
  return unbufferizer(worker, pbObj);
};

/**
 * Converts binary in the form of ArrayBuffer or base64 string to syft class
 * @param worker
 * @param bin
 * @param pbType
 * @returns {Object}
 */
export const unserialize = (worker, bin, pbType) => {
  const buff =
    typeof bin === 'string'
      ? Buffer.from(bin, 'base64')
      : bin instanceof ArrayBuffer
      ? new Uint8Array(bin)
      : bin;
  const pbObj = pbType.decode(buff);
  return unbufferize(worker, pbObj);
};

/**
 * Converts syft class to protobuf-serialized binary
 * @param worker
 * @param obj
 * @returns {ArrayBuffer}
 */
export const serialize = (worker, obj) => {
  const pbObj = obj.bufferize(worker);
  const pbType = pbObj.constructor;
  const err = pbType.verify(pbObj);
  if (err) {
    throw new Error(err);
  }
  const bin = pbType.encode(pbObj).finish();
  return new Uint8Array(bin).buffer;
};

export const getPbId = field => {
  // convert int64 to string
  return field[field.id].toString();
};

export const pbId = value => {
  if (typeof value === 'number') {
    return protobuf.syft_proto.types.syft.v1.Id.create({ id_int: value });
  } else if (typeof value === 'string') {
    return protobuf.syft_proto.types.syft.v1.Id.create({ id_str: value });
  }
};
