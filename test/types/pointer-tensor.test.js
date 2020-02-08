import PointerTensor from '../../src/types/pointer-tensor';

describe('PointerTensor', () => {
  test('can be properly constructed', () => {
    const obj = new PointerTensor(123, 444, 'worker1', null, [2, 3], true);
    expect(obj.id).toStrictEqual(123);
    expect(obj.idAtLocation).toStrictEqual(444);
    expect(obj.locationId).toStrictEqual('worker1');
    expect(obj.pointToAttr).toStrictEqual(null);
    expect(obj.shape).toStrictEqual([2, 3]);
    expect(obj.garbageCollectData).toStrictEqual(true);
  });
});
