import { PlanOutputSpec, PlanInputSpec } from '../src/types/plan';
import { PlanTrainer, PlanTrainerCheckpoint } from '../src/plan-trainer';
import SyftModel from '../src/syft-model';
import { DataLoader, Dataset } from '../src/data';
import { protobuf, unserialize } from '../src/protobuf';
import Syft from '../src/syft';
import { base64Encode } from '../src/utils/base64';

import * as tf from '@tensorflow/tfjs-core';

// Import test data
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

// Dummy dataset that slices provided tensors into samples by 1st dimension
class TensorDataset extends Dataset {
  constructor(...tensors) {
    super();
    this.tensors = tensors;
  }

  getItem(idx) {
    return this.tensors.map(t => t.slice(idx, 1).squeeze());
  }

  get length() {
    return this.tensors[0].shape[0];
  }
}

describe('PlanTrainer', () => {
  let worker, plan, data, target, lr,
    batchSize, model, referenceUpdatedModel,
    planInputSpec, planInputWithLoaderSpec, planOutputSpec, loader;

  beforeEach(() => {
    // Dummy worker
    worker = new Syft({ url: 'dummy' });
    // Load Plan, Model, data, lr, batchSize from test data
    plan = unserialize(
      null,
      MNIST_PLAN,
      protobuf.syft_proto.execution.v1.Plan
    );
    const dataState = unserialize(
      null,
      MNIST_BATCH_DATA,
      protobuf.syft_proto.execution.v1.State
    );
    [data, target] = dataState.getTfTensors();
    lr = tf.tensor(MNIST_LR);
    batchSize = MNIST_BATCH_SIZE;
    model = new SyftModel({
      worker, serializedModelParameters: MNIST_MODEL_PARAMS
    });
    referenceUpdatedModel = new SyftModel({
      worker,
      serializedModelParameters: MNIST_UPD_MODEL_PARAMS
    });
    let commonInputSpec = [
      new PlanInputSpec(PlanInputSpec.TYPE_BATCH_SIZE),
      new PlanInputSpec(PlanInputSpec.TYPE_VALUE, 'lr', null, lr),
      new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W1', 0),
      new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b1', 1),
      new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W2', 2),
      new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b2', 3),
    ];
    planInputSpec = [
      new PlanInputSpec(PlanInputSpec.TYPE_DATA),
      new PlanInputSpec(PlanInputSpec.TYPE_TARGET),
      ...commonInputSpec
    ];
    planInputWithLoaderSpec = [
      new PlanInputSpec(PlanInputSpec.TYPE_DATA, null, 0),
      new PlanInputSpec(PlanInputSpec.TYPE_DATA, null, 1),
      ...commonInputSpec
    ];
    planOutputSpec = [
      new PlanOutputSpec(PlanOutputSpec.TYPE_LOSS),
      new PlanOutputSpec(PlanOutputSpec.TYPE_METRIC, 'accuracy'),
      new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W1', 0),
      new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b1', 1),
      new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W2', 2),
      new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b2', 3),
    ];
    const dataset = new TensorDataset(data, target);
    loader = new DataLoader({dataset, batchSize, shuffle: false});
  });

  test('can be executed (MNIST example)', async (done) => {
    // create trainer
    const trainer = new PlanTrainer({
      worker,
      plan,
      inputs: planInputSpec,
      outputs: planOutputSpec,
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

  test('can be executed with dataloader (MNIST example)', async (done) => {
    // create trainer
    const trainer = new PlanTrainer({
      worker,
      plan,
      inputs: planInputWithLoaderSpec,
      outputs: planOutputSpec,
      model,
      data: loader,
      epochs: 1,
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

  test('can be stopped/resumed', async (done) => {
    // create trainer
    const trainer = new PlanTrainer({
      worker,
      plan,
      inputs: planInputSpec,
      outputs: planOutputSpec,
      model,
      data,
      target,
      epochs: 3,
      batchSize,
      stepsPerEpoch: 1
    });

    let assertions = 0;
    let checkpoint;

    trainer.on('epochEnd', async ({epoch}) => {
      if (epoch === 1) {
        // stop after 2nd epoch
        // checkpoint should have next epoch
        checkpoint = await trainer.stop();
        expect(checkpoint.epoch).toBe(2);
      }
    });
    assertions += 1;

    trainer.on('stop', () => {
      // check that trainer is stopped on 3rd epoch
      expect(trainer.stopped).toBe(true);
      expect(trainer.epoch).toBe(2);
      // resume training
      setTimeout(() => {
        trainer.resume();
      }, 100);
    });
    assertions += 2;

    trainer.on('start', () => {
      if (!checkpoint) {
        // before stop (1st start)
        expect(trainer.epoch).toBe(0);
      } else {
        // after resume (2nd start)
        // should resume from 3rd epoch
        expect(trainer.epoch).toBe(2);
      }
    });
    assertions += 2;

    trainer.on('end', () => {
      done();
    })

    // ensure all assertions are triggered as expected
    expect.assertions(assertions);

    trainer.start();
  }, 20000);

  test('can be continued from checkpoint', async (done) => {
    // create trainer
    let trainer = new PlanTrainer({
      worker,
      plan,
      inputs: planInputSpec,
      outputs: planOutputSpec,
      model,
      data,
      target,
      epochs: 3,
      batchSize,
      stepsPerEpoch: 1
    });

    let assertions = 0;
    let checkpoint, serializedCheckpoint;

    trainer.on('batchEnd', async ({epoch}) => {
      if (epoch === 1) {
        // stop after 2nd epoch
        // checkpoint should have next epoch
        checkpoint = await trainer.stop();
        serializedCheckpoint = await checkpoint.toJSON();
        expect(serializedCheckpoint).toStrictEqual({
          epoch: 2,
          epochs: 3,
          batch: 0,
          batchSize,
          stepsPerEpoch: 1,
          clientConfig: {},
          currentModelBase64: base64Encode(await trainer.currentModel.toProtobuf())
        });
      }
    });
    assertions += 1;

    const restore = () => {
      const cp = PlanTrainerCheckpoint.fromJSON(worker, serializedCheckpoint);
      const trainer2 = new PlanTrainer({
        worker,
        plan,
        inputs: planInputSpec,
        outputs: planOutputSpec,
        model,
        data,
        target,
        checkpoint: cp,
      });

      trainer2.on('batchStart', () => {
        expect(trainer2.epoch).toBe(2);
        for (let i = 0; i < trainer2.currentModel.params.length; i++) {
          expect(trainer2.currentModel.params[i].equal(checkpoint.currentModel.params[i]).all().arraySync()).toBe(1);
        }
      });

      trainer2.on('end', () => {
        done();
      });

      expect(trainer2.stopped).toBe(true);
      trainer2.resume();
    };
    assertions += 2 + model.params.length;

    trainer.on('stop', () => {
      // resume training with different trainer
      setTimeout(restore, 100);
    });

    // ensure all assertions are triggered as expected
    expect.assertions(assertions);

    trainer.start();
  }, 20000);

});
