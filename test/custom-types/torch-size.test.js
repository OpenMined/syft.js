import { torchSizeShape, torchSize2 } from '../dummy/torch-size';

describe('TorchSize', () => {
  test('can be properly constructed', () => {
    expect(torchSize2.size).toStrictEqual(torchSizeShape);
  });
});
