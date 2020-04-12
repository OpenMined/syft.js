import { Plan } from '../../src/types/plan';
import { State } from '../../src/types/state';
import { TorchTensor } from '../../src/types/torch';
import { Placeholder, PlaceholderId } from '../../src/types/placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { protobuf, unserialize } from '../../src/protobuf';
import Syft from '../../src/syft';
import { MODEL_MNIST, PLAN_MNIST, PLAN_WITH_STATE } from '../data/dummy';
import { ComputationAction } from '../../src/types/computation-action';
import { Role } from '../../src/types/role';

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
    const phId1 = new PlaceholderId(555);
    const phId2 = new PlaceholderId(666);
    const ph1 = new Placeholder(555);
    const ph2 = new Placeholder(666);
    const action = new ComputationAction('torch.abs', null, [phId1], null, null, [phId2]);
    const state = new State([], []);
    const role = new Role(777, [action], state, [ph1, ph2], [phId1], [phId2]);
    const obj = new Plan(
      123,
      'plan',
      role,
      ['tag1', 'tag2'],
      'desc'
    );
    expect(obj.id).toBe(123);
    expect(obj.name).toBe('plan');
    expect(obj.role.actions).toStrictEqual([action]);
    expect(obj.role.state).toBe(state);
    expect(obj.role.placeholders).toStrictEqual([ph1, ph2]);
    expect(obj.role.input_placeholder_ids).toStrictEqual([phId1]);
    expect(obj.role.output_placeholder_ids).toStrictEqual([phId2]);
    expect(obj.tags).toStrictEqual(['tag1', 'tag2']);
    expect(obj.description).toStrictEqual('desc');
  });

  test('can be executed (with state)', async () => {
    const input = tf.tensor([
      [1, 2],
      [-30, -40]
    ]);
    // this is what plan contains
    const state = tf.tensor([4.2, 7.3]);
    const expected = tf.abs(tf.add(input, state));
    const plan = unserialize(
      null,
      PLAN_WITH_STATE,
      protobuf.syft_proto.execution.v1.Plan
    );
    const worker = new Syft({ url: 'dummy' });
    const result = await plan.execute(worker, input);
    expect(result[0]).toBeInstanceOf(tf.Tensor);
    expect(
      tf
        .equal(result[0], expected)
        .all()
        .dataSync()[0]
    ).toBe(1);
  });

  test('can be executed (MNIST example)', async () => {
    const plan = unserialize(
      null,
      PLAN_MNIST,
      protobuf.syft_proto.execution.v1.Plan
    );
    const worker = new Syft({ url: 'dummy' });
    const lr = tf.tensor(0.01);
    const batchSize = tf.tensor(1);
    const dataBatch = tf.zeros([1, 784]);
    const labelsBatch = tf.oneHot(tf.tensor1d([8], 'int32'), 10);
    const modelState = unserialize(
      null,
      MODEL_MNIST,
      protobuf.syft_proto.execution.v1.State
    );
    const modelParams = modelState.tensors;
    const [loss, acc, ...newParams] = await plan.execute(worker, dataBatch, labelsBatch, batchSize, lr, ...modelParams);
    expect(loss).toBeInstanceOf(tf.Tensor);
    expect(acc).toBeInstanceOf(tf.Tensor);
    expect(newParams).toHaveLength(4);
    expect(loss.arraySync().toFixed(5)).toBe("0.23026");
    expect(acc.arraySync().toFixed(5)).toBe("0.00000");
  });
});
