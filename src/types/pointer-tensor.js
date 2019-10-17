import { default as proto } from '../proto';

// Create a class to represent pointer tensors
// Add all the attributes that are serialized, just as for range and slice

export default class PointerTensor {
  constructor(
    id,
    idAtLocation,
    locationId,
    pointToAttr,
    shape,
    garbageCollectData
  ) {
    this.id = id;
    this.idAtLocation = idAtLocation;
    this.locationId = locationId;
    this.pointToAttr = pointToAttr;
    this.shape = shape;
    this.garbageCollectData = garbageCollectData;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.generic.pointers.pointer_tensor.PointerTensor'];
    const args = ['id', 'idAtLocation', 'locationId', 'pointToAttr', 'shape', 'garbageCollectData']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}
