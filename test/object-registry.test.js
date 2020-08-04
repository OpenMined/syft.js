import ObjectRegistry from '../src/object-registry';
import { Placeholder, PlaceholderId } from '../src/types/placeholder';

describe('ObjectRegistry', () => {
  test('Can initialize', () => {
    const objectRegistry = new ObjectRegistry();
    expect(objectRegistry).toBeInstanceOf(ObjectRegistry);
  });

  test('Can store object with a given id and gc value', () => {
    const objectRegistry = new ObjectRegistry();
    const phId1 = new PlaceholderId(555);
    const phId2 = new PlaceholderId(666);
    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);

    objectRegistry.set(phId1.id, ph1);
    objectRegistry.set(phId2.id, ph2, true);

    expect(objectRegistry.objects[phId1.id]).toStrictEqual(ph1);
    expect(objectRegistry.gc[phId1.id]).toBe(false);

    expect(objectRegistry.objects[phId2.id]).toStrictEqual(ph2);
    expect(objectRegistry.gc[phId2.id]).toBe(true);
  });

  test('Can store boolean gc for given id', () => {
    const objectRegistry = new ObjectRegistry();
    objectRegistry.setGc(666, false);
    expect(objectRegistry.gc[666]).toBe(false);
  });

  test('Can retrieve an object given an id', () => {
    const objectRegistry = new ObjectRegistry();
    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);

    objectRegistry.set(555, ph1, true);
    objectRegistry.set(666, ph2);

    expect(objectRegistry.get(555)).toStrictEqual(ph1);
    expect(objectRegistry.get(666)).toStrictEqual(ph2);
  });

  test('Can check whether it has an object given an id', () => {
    const objectRegistry = new ObjectRegistry();
    const ph1 = new Placeholder(555);

    objectRegistry.set(555, ph1, true);

    expect(objectRegistry.has(555)).toBe(true);
    expect(objectRegistry.has(666)).toBe(false);
  });

  test('Can clear list of objects', () => {
    const objectRegistry = new ObjectRegistry();
    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);

    objectRegistry.set(555, ph1, true);
    objectRegistry.set(666, ph2);

    objectRegistry.clear();

    expect(Object.keys(objectRegistry.objects).length).toBe(0);
    expect(Object.keys(objectRegistry.gc).length).toBe(0);
  });

  test('Can load objects from another ObjectRegistry and store them', () => {
    const objectRegistry1 = new ObjectRegistry();
    const objectRegistry2 = new ObjectRegistry();

    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);

    objectRegistry1.set(555, ph1, true);
    objectRegistry1.set(666, ph2);

    objectRegistry2.load(objectRegistry1);

    let numEqualObj = 0;

    for (let key of Object.keys(objectRegistry2.objects)) {
      if (objectRegistry2.get(key) == objectRegistry1.get(key)) {
        numEqualObj++;
      }
    }
    expect(numEqualObj).toBe(Object.keys(objectRegistry1.objects).length);
  });
});
