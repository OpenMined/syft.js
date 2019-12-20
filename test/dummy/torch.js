import { default as proto } from '../../src/proto';

import { TorchTensor, TorchSize } from '../../src/types/torch';
import { Tuple, List } from '../../src/types/native';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';

const binTensorShape = 2;
const binTensorType = 'float32';
const binTensor1 = 4.199999809265137;
const binTensor2 = 7.300000190734863;

export const id = 86275536166;
export const bin = new Tuple(
  new Tuple(binTensorShape),
  binTensorType,
  new List(binTensor1, binTensor2)
);
export const chain = null;
export const gradChain = null;
export const tags = null;
export const description = null;
export const serializer = 'all';

export const torchTensor = new TorchTensor(id, bin, chain, gradChain, tags, description, serializer); // prettier-ignore
export const simplifiedBin = `(6, ((6, (${binTensorShape},)), (5, (b'${binTensorType}',)), (1, (${binTensor1}, ${binTensor2}))))`;
export const simplifiedSerializer = `(${proto['str']}, (b'${serializer}'))`;
export const simplifiedTorchTensor = runReplacers(
  `(${proto['torch.Tensor']}, (${id}, ${simplifiedBin}, ${chain}, ${gradChain}, ${tags}, ${description}, ${simplifiedSerializer}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const torchSizeShape = [2];
export const torchSize2 = new TorchSize(torchSizeShape);

export const simplifiedTorchSize = runReplacers(
  `(${proto['torch.Size']}, (${torchSizeShape}))`,
  SIMPLIFY_REPLACERS
);
