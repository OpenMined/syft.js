import { Plan, State } from '../../src/types/plan';
import { TorchTensor } from '../../src/types/torch';
import { Operation } from '../../src/types/message';
import Placeholder from '../../src/types/placeholder';

describe('State', () => {
  test('can be properly constructed', () => {
    const ph = new Placeholder(123);
    const ts = new TorchTensor(
      234,
      new Float32Array([1, 2, 3, 4]),
      [2, 2],
      'float32'
    );
    const obj = new State([ph], [ts]);
    expect(obj.placeholders).toStrictEqual([ph]);
    expect(obj.tensors).toStrictEqual([ts]);
  });
});

describe('Plan', () => {
  test('can be properly constructed', () => {
    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);
    const op = new Operation('torch.abs', null, [ph1], null, [][ph2]);
    const state = new State([], []);
    const obj = new Plan(
      123,
      'plan',
      [op],
      state,
      [ph1, ph2],
      ['tag1', 'tag2'],
      'desc'
    );
    expect(obj.id).toBe(123);
    expect(obj.name).toBe('plan');
    expect(obj.operations).toStrictEqual([op]);
    expect(obj.state).toBe(state);
    expect(obj.placeholders).toStrictEqual([ph1, ph2]);
    expect(obj.tags).toStrictEqual(['tag1', 'tag2']);
    expect(obj.description).toStrictEqual('desc');
  });

  test('gets input/output placeholders in proper order', () => {
    const ph1 = new Placeholder(555, ['#input-100']);
    const ph2 = new Placeholder(666, ['#input-2']);
    const ph3 = new Placeholder(777, ['#output-15']);
    const ph4 = new Placeholder(888, ['#output-002']);
    const plan = new Plan(123, 'plan', null, null, [ph1, ph2, ph3, ph4]);

    expect(plan.getInputPlaceholders()).toStrictEqual([ph2, ph1]);
    expect(plan.getOutputPlaceholders()).toStrictEqual([ph4, ph3]);
  });
});
