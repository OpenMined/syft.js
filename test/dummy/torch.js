import { default as proto } from '../../src/proto';

import { TorchTensor, TorchSize } from '../../src/types/torch';
import { runReplacers, SIMPLIFY_REPLACERS } from '../../src/serde';

// TODO: We have to get this binary simplifying
// const BINARY = `\x80\x02\x8a\nl\xfc\x9cF\xf9 j\xa8P\x19.\x80\x02M\xe9\x03.\x80\x02}q\x00(X\x10\x00\x00\x00protocol_versionq\x01M\xe9\x03X\r\x00\x00\x00little_endianq\x02\x88X\n\x00\x00\x00type_sizesq\x03}q\x04(X\x05\x00\x00\x00shortq\x05K\x02X\x03\x00\x00\x00intq\x06K\x04X\x04\x00\x00\x00longq\x07K\x04uu.\x80\x02ctorch._utils\n_rebuild_tensor_v2\nq\x00((X\x07\x00\x00\x00storageq\x01ctorch\nFloatStorage\nq\x02X\x0f\x00\x00\x00140426915320352q\x03X\x03\x00\x00\x00cpuq\x04K\x01Ntq\x05QK\x00K\x01\x85q\x06K\x01\x85q\x07\x89ccollections\nOrderedDict\nq\x08)Rq\ttq\nRq\x0b.\x80\x02]q\x00X\x0f\x00\x00\x00140426915320352q\x01a.\x01\x00\x00\x00\x00\x00\x00\x00ff\x86@`;

export const id = 86275536166;
// export const bin = BINARY;
export const bin = 'somethinghere';
export const chain = null;
export const gradChain = null;
export const tags = null;
export const description = null;

export const torchTensor = new TorchTensor(id, bin, chain, gradChain, tags, description); // prettier-ignore
export const simplifiedTorchTensor = runReplacers(
  `(${proto['torch.Tensor']}, (${id}, (5,(b'${bin}')), ${chain}, ${gradChain}, ${tags}, ${description}))`, // prettier-ignore
  SIMPLIFY_REPLACERS
);

export const torchSizeShape = [2];
export const torchSize2 = new TorchSize(torchSizeShape);

export const simplifiedTorchSize = runReplacers(
  `(${proto['torch.Size']}, (${torchSizeShape}))`,
  SIMPLIFY_REPLACERS
);
