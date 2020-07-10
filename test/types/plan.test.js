import { Plan } from '../../src/types/plan';
import { State } from '../../src/types/state';
import { TorchTensor } from '../../src/types/torch';
import { Placeholder, PlaceholderId } from '../../src/types/placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { protobuf, unserialize } from '../../src/protobuf';
import Syft from '../../src/syft';
import {
  MNIST_BATCH_SIZE,
  MNIST_LR,
  MNIST_BATCH_DATA,
  MNIST_PLAN,
  MNIST_MODEL_PARAMS,
  MNIST_UPD_MODEL_PARAMS,
  MNIST_LOSS,
  MNIST_ACCURACY,
  PLAN_WITH_STATE,
  BANDIT_SIMPLE_MODEL_PARAMS,
  BANDIT_SIMPLE_PLAN,
  BANDIT_THOMPSON_PLAN,
  BANDIT_THOMPSON_MODEL_PARAMS
} from '../data/dummy';
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
    const action = new ComputationAction(
      'torch.abs',
      null,
      [phId1],
      null,
      null,
      [phId2]
    );
    const state = new State([], []);
    const role = new Role(777, [action], state, [ph1, ph2], [phId1], [phId2]);
    const obj = new Plan(123, 'plan', role, ['tag1', 'tag2'], 'desc');
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

  test('invalid args shape throws corresponding error', async () => {
    // PLAN_WITH_STATE plan contains input + A(2,2)
    // this should error with tf error about incompatible shapes
    const input = tf.ones([3, 3]);
    const plan = unserialize(
      null,
      PLAN_WITH_STATE,
      protobuf.syft_proto.execution.v1.Plan
    );
    const worker = new Syft({ url: 'dummy' });
    expect(plan.execute(worker, input)).rejects.toThrow(
      'Operands could not be broadcast together with shapes 3,3 and 2.'
    );
  });

  test('can be executed (MNIST example)', async () => {
    const plan = unserialize(
      null,
      MNIST_PLAN,
      protobuf.syft_proto.execution.v1.Plan
    );

    const worker = new Syft({ url: 'dummy' });
    const dataState = unserialize(
      null,
      MNIST_BATCH_DATA,
      protobuf.syft_proto.execution.v1.State
    );
    const [data, labels] = dataState.tensors;
    const lr = tf.tensor(MNIST_LR);
    const batchSize = tf.tensor(MNIST_BATCH_SIZE);
    const modelState = unserialize(
      null,
      MNIST_MODEL_PARAMS,
      protobuf.syft_proto.execution.v1.State
    );
    const modelParams = modelState.tensors;
    const [loss, acc, ...updModelParams] = await plan.execute(
      worker,
      data,
      labels,
      batchSize,
      lr,
      ...modelParams
    );

    const refUpdModelParamsState = unserialize(
      null,
      MNIST_UPD_MODEL_PARAMS,
      protobuf.syft_proto.execution.v1.State
    );
    const refUpdModelParams = refUpdModelParamsState.tensors.map(i =>
      i.toTfTensor()
    );

    expect(loss).toBeInstanceOf(tf.Tensor);
    expect(acc).toBeInstanceOf(tf.Tensor);
    expect(updModelParams).toHaveLength(refUpdModelParams.length);
    expect(loss.arraySync()).toStrictEqual(MNIST_LOSS);
    expect(acc.arraySync()).toStrictEqual(MNIST_ACCURACY);

    for (let i = 0; i < refUpdModelParams.length; i++) {
      // Check that resulting model params are close to pysyft reference
      let diff = refUpdModelParams[i].sub(updModelParams[i]);
      expect(
        diff
          .abs()
          .sum()
          .arraySync()
      ).toBeLessThan(1e-7);
    }
  });

  test('bandit (simple) example can be executed', async () => {
    const plan = unserialize(
      null,
      BANDIT_SIMPLE_PLAN,
      protobuf.syft_proto.execution.v1.Plan
    );

    const worker = new Syft({ url: 'dummy' });
    const modelState = unserialize(
      null,
      BANDIT_SIMPLE_MODEL_PARAMS,
      protobuf.syft_proto.execution.v1.State
    );
    const [means] = modelState.tensors;

    const reward = tf.tensor([0, 1, 0]);
    const n_so_far = tf.tensor([1, 1, 1]);
    const [newMeans] = await plan.execute(worker, reward, n_so_far, means);

    newMeans.print();
  });

  test('bandit (thompson) example can be executed', async () => {
    const plan = unserialize(
      null,
      BANDIT_THOMPSON_PLAN,
      protobuf.syft_proto.execution.v1.Plan
    );

    const worker = new Syft({ url: 'dummy' });
    const modelState = unserialize(
      null,
      BANDIT_THOMPSON_MODEL_PARAMS,
      protobuf.syft_proto.execution.v1.State
    );
    const [alphas, betas] = modelState.tensors;
    const reward = tf.tensor([0, 0, 0]);
    const samples = tf.tensor([0, 0, 1]);
    const [newAlphas, newBetas] = await plan.execute(
      worker,
      reward,
      samples,
      alphas,
      betas
    );

    newAlphas.print();
    newBetas.print();
  });
});
