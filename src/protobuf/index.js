import { NoDetailerError, ProtobufUnserializeFailedError } from '../_errors';
import { initMappings, PB_TO_UNBUFFERIZER } from './mapping';
import { protobuf } from 'syft-proto';
import Long from 'long';
import { base64Decode } from '../utils/base64';

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
    return pbObj.map((item) => unbufferize(worker, item));
  }

  // automatically unbufferize map fields
  if (pbType.name === 'Object') {
    let res = {};
    for (let key of Object.keys(pbObj)) {
      res[key] = unbufferize(worker, pbObj[key]);
    }
    return res;
  }

  // automatically unbufferize Id
  if (pbType === protobuf.syft_proto.types.syft.v1.Id) {
    return getPbId(pbObj);
  }

  // automatically unwrap Arg
  if (pbType === protobuf.syft_proto.types.syft.v1.Arg) {
    if (pbObj.arg === 'arg_int' && pbObj[pbObj.arg] instanceof Long) {
      // protobuf int64 is represented as Long
      return pbObj[pbObj.arg].toNumber();
    } else {
      return unbufferize(worker, pbObj[pbObj.arg]);
    }
  }

  // automatically unwrap ArgList
  if (pbType === protobuf.syft_proto.types.syft.v1.ArgList) {
    return unbufferize(worker, pbObj.args);
  }

  const unbufferizer = PB_TO_UNBUFFERIZER[pbType];
  if (typeof unbufferizer === 'undefined') {
    throw new NoDetailerError(pbType.name);
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
      ? base64Decode(bin)
      : bin instanceof ArrayBuffer
      ? new Uint8Array(bin)
      : bin;
  let pbObj;
  try {
    pbObj = pbType.decode(buff);
  } catch (e) {
    throw new ProtobufUnserializeFailedError(pbType.name, e.message);
  }
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

export const getPbId = (field) => {
  // convert int64 to string
  return field[field.id].toString();
};

export const pbId = (value) => {
  if (typeof value === 'number') {
    return protobuf.syft_proto.types.syft.v1.Id.create({ id_int: value });
  } else if (typeof value === 'string') {
    return protobuf.syft_proto.types.syft.v1.Id.create({ id_str: value });
  }
};
