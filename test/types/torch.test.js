import {
  torchTensor,
  id,
  bin,
  chain,
  gradChain,
  tags,
  description,
  torchSizeShape,
  torchSize2
} from '../dummy/torch';

describe('TorchTensor', () => {
  test('can be properly constructed', () => {
    expect(torchTensor.id).toStrictEqual(id);
    expect(torchTensor.bin).toStrictEqual(bin);
    expect(torchTensor.chain).toStrictEqual(chain);
    expect(torchTensor.gradChain).toStrictEqual(gradChain);
    expect(torchTensor.tags).toStrictEqual(tags);
    expect(torchTensor.description).toStrictEqual(description);
  });
});

describe('TorchSize', () => {
  test('can be properly constructed', () => {
    expect(torchSize2.size).toStrictEqual(torchSizeShape);
  });
});
