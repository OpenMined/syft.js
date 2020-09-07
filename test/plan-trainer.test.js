import { PlanOutputSpec, PlanInputSpec } from '../src/types/plan';
import { PlanTrainer } from '../src/plan-trainer';
import SyftModel from '../src/syft-model';
import * as tf from '@tensorflow/tfjs-core';
import { protobuf, unserialize } from '../src/protobuf';
import Syft from '../src/syft';
import {
  MNIST_BATCH_SIZE,
  MNIST_LR,
  MNIST_BATCH_DATA,
  MNIST_PLAN,
  MNIST_MODEL_PARAMS,
  MNIST_UPD_MODEL_PARAMS,
  MNIST_LOSS,
  MNIST_ACCURACY
} from './data/dummy';

describe('PlanTrainer', () => {

  test('can be executed (MNIST example)', async (done) => {
    // Dummy worker
    const worker = new Syft({ url: 'dummy' });
    // Load Plan, Model, data, lr, batchSize from test data
    const plan = unserialize(
      null,
      MNIST_PLAN,
      protobuf.syft_proto.execution.v1.Plan
    );
    const dataState = unserialize(
      null,
      MNIST_BATCH_DATA,
      protobuf.syft_proto.execution.v1.State
    );
    const [data, target] = dataState.getTfTensors();
    const lr = tf.tensor(MNIST_LR);
    const batchSize = MNIST_BATCH_SIZE;
    const model = new SyftModel({
      worker, serializedModelParameters: MNIST_MODEL_PARAMS
    });
    const referenceUpdatedModel = new SyftModel({
      worker,
      serializedModelParameters: MNIST_UPD_MODEL_PARAMS
    });

    // create trainer
    const trainer = new PlanTrainer({
      worker,
      plan,
      planInputs: [
        new PlanInputSpec(PlanInputSpec.TYPE_DATA),
        new PlanInputSpec(PlanInputSpec.TYPE_TARGET),
        new PlanInputSpec(PlanInputSpec.TYPE_BATCH_SIZE),
        new PlanInputSpec(PlanInputSpec.TYPE_VALUE, 'lr', null, lr),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W1', 0),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b1', 1),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W2', 2),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b2', 3),
      ],
      planOutputs: [
        new PlanOutputSpec(PlanOutputSpec.TYPE_LOSS),
        new PlanOutputSpec(PlanOutputSpec.TYPE_METRIC, 'accuracy'),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W1', 0),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b1', 1),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W2', 2),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b2', 3),
      ],
      model,
      data,
      target,
      epochs: 1,
      batchSize,
      stepsPerEpoch: 1
    });

    // ensure all assertions are executed
    expect.assertions(4 + referenceUpdatedModel.params.length);

    trainer.on(PlanTrainer.EVENT_BATCH_END, ({epoch, batch, loss, metrics}) => {
      expect(epoch).toStrictEqual(0);
      expect(batch).toStrictEqual(0);
      expect(loss).toStrictEqual(MNIST_LOSS);
      expect(metrics['accuracy']).toStrictEqual(MNIST_ACCURACY);

      for (let i = 0; i < referenceUpdatedModel.params.length; i++) {
        // Check that resulting model params are close to pysyft reference
        let diff = referenceUpdatedModel.params[i].sub(trainer.currentModel.params[i]);
        expect(
          diff
            .abs()
            .sum()
            .arraySync()
        ).toBeLessThan(1e-7);
      }
    });

    trainer.on(PlanTrainer.EVENT_TRAINING_END, () => {
      done();
    });

    trainer.start();
  });

});
