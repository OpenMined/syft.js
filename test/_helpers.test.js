import { torchToTF, pickTensors } from '../src/_helpers';
import Logger from '../src/logger';

import { detailedPlan } from './dummy/plan';

describe('Helpers', () => {
  const logger = new Logger('syft.js', false);

  test.skip('pickTensors(): can correctly pick out all tensors from Plan', () => {
    const objects = pickTensors(detailedPlan);

    expect(Object.keys(objects).length).toBe(4);
  });

  test('torchToTF(): can convert underscore function', () => {
    expect(torchToTF('__add__', logger)).toBe('add');
  });

  test('torchToTF(): can convert torch function', () => {
    expect(torchToTF('torch.abs', logger)).toBe('abs');
  });

  test('torchToTF(): returns null for unknown command', () => {
    expect(torchToTF('nonexistentFunction', logger)).toBe(null);
  });
});
