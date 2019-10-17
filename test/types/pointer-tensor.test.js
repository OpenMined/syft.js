import {
  id,
  idAtLocation,
  locationId,
  pointToAttr,
  shape,
  garbageCollectData,
  firstPointerTensor
} from '../dummy/pointer-tensor';

describe('PointerTensor', () => {
  test('can be properly constructed', () => {
    expect(firstPointerTensor.id).toStrictEqual(id);
    expect(firstPointerTensor.idAtLocation).toStrictEqual(idAtLocation);
    expect(firstPointerTensor.locationId).toStrictEqual(locationId);
    expect(firstPointerTensor.pointToAttr).toStrictEqual(pointToAttr);
    expect(firstPointerTensor.shape).toStrictEqual(shape);
    expect(firstPointerTensor.garbageCollectData).toStrictEqual(
      garbageCollectData
    );
  });
});
