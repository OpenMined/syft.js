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
 * @returns {{}}
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

export const getPbId = field => {
  // convert int64 to string
  return field[field.id].toString();
};
