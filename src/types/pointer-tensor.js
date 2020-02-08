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
}
