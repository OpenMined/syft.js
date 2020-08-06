import { Placeholder } from '../../src/types/placeholder';

describe('Placeholder', () => {
  test('can be properly constructed', () => {
    const obj = new Placeholder(123, ['tag1', 'tag2'], 'desc');
    expect(obj.id).toStrictEqual(123);
    expect(obj.tags).toStrictEqual(['tag1', 'tag2']);
    expect(obj.description).toStrictEqual('desc');
  });
});
