import PointerTensor from '../../src/custom-types/pointer-tensor';
import { torchSize2, simplifiedTorchSize } from './torch-size';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';

export const id = 23885703668;
export const idAtLocation = 30300883787;
export const locationId = 85156589176;
export const pointToAttr = null;
export const shape = torchSize2;
export const garbageCollectData = false;

export const firstPointerTensor = new PointerTensor(
  id,
  idAtLocation,
  locationId,
  pointToAttr,
  shape,
  garbageCollectData
);

export const secondPointerTensor = new PointerTensor(
  50671613206,
  53361601662,
  85156589176,
  null,
  null,
  true
);

export const simplifiedPointerTensor = runReplacers(
  `(20, (${id}, ${idAtLocation}, ${locationId}, ${pointToAttr}, ${simplifiedTorchSize}, ${garbageCollectData}))`,
  SIMPLIFY_REPLACERS
);
