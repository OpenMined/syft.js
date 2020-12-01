/**
 * PointerTensor points to a remote tensor and forwards all API calls
 * to its remote tensor. A PointerTensor mimic the entire API of a normal
 * tensor, but instead of computing a tensor function (such as addition,
 * subtraction, etc.) locally, PointerTensor forwards the computation to
 * a remote machine as specified by self.locationId.
 *
 * Note that PointerTensor is currently not supported. Support for communication
 * between workers comes from Protocol.
 */
export default class PointerTensor {
  /**
   * @param {number} id - Id of the PointerTensor.
   * @param {number} idAtLocation - Id of the remote tensor being pointed at.
   * @param {string} locationId - Id of the location where the remote tensor resides.
   * @param {string} pointToAttr - String value to specify if the PointerTensor should point to an attribute of the remote tensor such as .child or .grad.
   * @param {Array.<number>} shape - Size of the tensor the pointer points to.
   * @param {boolean} garbageCollectData - If True, delete the remote tensor when the PointerTensor is removed.
   */
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
