import { NO_DETAILER } from '../_errors';
import { initMappings, PB_TO_UNBUFFERIZER } from './mapping';

export const unbufferize = (worker, pbObj) => {
  if (!PB_TO_UNBUFFERIZER) {
    initMappings();
  }
  const pbType = pbObj.constructor;
  const unbufferizer = PB_TO_UNBUFFERIZER[pbType];
  if (typeof unbufferizer === 'undefined') {
    throw new Error(NO_DETAILER(pbType));
  }
  return unbufferizer(worker, pbObj);
};

export const unserialize = (worker, bin, pbType) => {
  const buff = Buffer.from(bin, 'base64');
  const pbObj = pbType.decode(buff);
  return unbufferize(worker, pbObj);
};

export const getPbId = field => {
  return field[field.id];
};
