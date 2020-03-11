import { torchToTF, pickTensors } from '../src/_helpers';
import Logger from '../src/logger';
import { TorchTensor } from '../src/types/torch';
import Placeholder from '../src/types/placeholder';
import { Plan, State } from '../src/types/plan';
import { Operation } from '../src';

describe('Helpers', () => {
  const logger = new Logger('syft.js', false);

  test('pickTensors(): can correctly pick out all tensors from Plan', () => {
    const ph1 = new Placeholder(111);
    const tensor1 = new TorchTensor(111, [1, 2.5], [2], 'float32');
    const ph2 = new Placeholder(222);
    const tensor2 = new TorchTensor(222, [1, 2.5], [2], 'float32');
    const state = new State([ph1], [tensor1]);
    const op = new Operation('torch.abs', ph2, [tensor2]);
    const plan = new Plan(123, 'plan', [op], state, []);

    const objects = pickTensors(plan);

    expect(Object.keys(objects).length).toBe(2);
  });

  test('torchToTF(): can convert underscore function', () => {
    expect(torchToTF('__add__', {}, logger)).toBe('add');
  });

  test('torchToTF(): can convert torch function', () => {
    expect(torchToTF('torch.abs', {}, logger)).toBe('abs');
  });

  test('torchToTF(): returns null for unknown command', () => {
    expect(torchToTF('nonexistentFunction', {}, logger)).toBe(null);
  });
});
