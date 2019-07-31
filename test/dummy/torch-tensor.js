import TorchTensor from '../../src/custom-types/torch-tensor';

export const id = 86275536166;
export const bin = 'something here';
export const chain = null;
export const gradChain = null;
export const tags = null;
export const description = null;

export const torchTensor = new TorchTensor(
  id,
  bin,
  chain,
  gradChain,
  tags,
  description
);

export const simplifiedTorchTensor = `
(12,
 (${id},
  (5,(b'${bin}')),
  None,
  None,
  None,
  None))
`;
