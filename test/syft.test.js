import Syft from '../src/index';
import Job from '../src/job';
import SyftModel from '../src/syft-model';
import { GridMock } from './mocks/grid';
import {
  MNIST_PLAN,
  MNIST_MODEL_PARAMS,
  MNIST_LR,
  MNIST_BATCH_SIZE,
  MNIST_BATCH_DATA,
} from './data/dummy';
import * as tf from '@tensorflow/tfjs-core';
import { protobuf, unserialize } from '../src/protobuf';

beforeAll(async () => {
  await tf.ready();
})

describe('Syft', () => {
  test('can construct', () => {
    const syft = new Syft({
      url: 'url',
      verbose: true,
      peerConfig: { test: 1 },
    });
    expect(syft).toBeInstanceOf(Syft);
    expect(syft.verbose).toBe(true);
  });

  describe('PyGrid integration', () => {
    const dummyFLConfig = {
      client_config: {
        name: 'mnist',
        version: '1.0.0',
        batch_size: 64,
        lr: 0.005,
        max_updates: 100,
      },
    };
    const dummyHostname = 'localhost';
    const dummyPort = 8080;
    const wsUrl = `ws://${dummyHostname}:${dummyPort}`;
    let grid;

    beforeEach(() => {
      grid = new GridMock(dummyHostname, dummyPort);
    });

    afterEach(() => {
      grid.stop();
    });

    test('Per-job auth', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'rejected',
      });

      // 1st job
      const job1 = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
        authToken: 'auth secret',
      });

      job1.on('rejected', function ({ timeout }) {
        expect(this).toBeInstanceOf(Job);
        expect(job1.worker_id).toBe('abc');
        // Timeout is not provided in the response.
        expect(timeout).toBe(undefined);
        expect(grid.wsMessagesHistory[0].data.auth_token).toBe('auth secret');

        // 2nd job, with different auth token
        grid.setAuthenticationResponse({
          error: "The 'auth_token' you sent is invalid.",
        });

        const job2 = syft.newJob({
          modelName: 'test',
          modelVersion: '2.0.0',
          authToken: 'auth secret 2',
        });

        job2.on('error', (err) => {
          // Should be triggered because of auth error.
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toContain("The 'auth_token' you sent is invalid");
          expect(grid.wsMessagesHistory[2].data.auth_token).toBe(
            'auth secret 2'
          );
          done();
        });

        job2.start();
      });

      job1.start();
    });

    test('Auth flow, success', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'rejected',
      });
      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
        authToken: 'auth secret',
      });
      job.request();

      job.on('rejected', function ({ timeout }) {
        expect(this).toBeInstanceOf(Job);
        expect(job.worker_id).toBe('abc');
        // Timeout is not provided in the response.
        expect(timeout).toBe(undefined);
        expect(grid.wsMessagesHistory[0].data.auth_token).toBe('auth secret');
        done();
      });

      job.on('error', (err) => {
        // Should never be triggered.
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });

    test('Auth flow, error', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
        authToken: 'auth secret',
      });

      grid.setAuthenticationResponse({
        error: "The 'auth_token' you sent is invalid.",
      });

      job.request();

      expect.assertions(3);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain("The 'auth_token' you sent is invalid");
        expect(grid.wsMessagesHistory[0].data.auth_token).toBe('auth secret');
        done();
      });
    });

    test('Acceptance into FL cycle (no auth)', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, Buffer.from(MNIST_PLAN, 'base64'));

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      job.on('accepted', function ({ model, clientConfig }) {
        expect(this).toBeInstanceOf(Job);
        expect(job.cycleParams.request_key).toBe('reqkey');
        expect(job.worker_id).toBe('abc');
        expect(model).toBeInstanceOf(SyftModel);
        expect(clientConfig).toStrictEqual(dummyFLConfig.client_config);
        done();
      });

      job.on('error', (err) => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });

    test('Cycle rejection with timeout', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'rejected',
        timeout: 100500,
      });
      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      job.on('rejected', function ({ timeout }) {
        expect(this).toBeInstanceOf(Job);
        expect(job.worker_id).toBe('abc');
        expect(timeout).toBe(100500);
        done();
      });

      job.on('error', (err) => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });

    test('Full flow with diff report (no auth)', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, Buffer.from(MNIST_PLAN, 'base64'));
      grid.setReportResponse({ status: 'success' });

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });

      job.request();

      job.on('accepted', async function ({ model, clientConfig }) {
        expect(clientConfig).toStrictEqual(dummyFLConfig.client_config);

        // Execute real Plan.
        const dataState = unserialize(
          null,
          MNIST_BATCH_DATA,
          protobuf.syft_proto.execution.v1.State
        );
        const [data, labels] = dataState.tensors;
        const lr = tf.tensor(MNIST_LR);
        const batchSize = tf.tensor(MNIST_BATCH_SIZE);
        const modelParams = model.params.map((t) => t.clone());

        const [loss, acc, ...updModelParams] = await job.plans[
          'training_plan'
        ].execute(syft, data, labels, batchSize, lr, ...modelParams);

        expect(loss).toBeInstanceOf(tf.Tensor);
        expect(acc).toBeInstanceOf(tf.Tensor);

        const diff = await model.createSerializedDiff(updModelParams);
        await job.report(diff);

        // Check diff report request.
        expect(grid.wsMessagesHistory[2].data.worker_id).toStrictEqual('abc');
        expect(grid.wsMessagesHistory[2].data.request_key).toStrictEqual(
          job.cycleParams.request_key
        );
        expect(grid.wsMessagesHistory[2].data.diff).toStrictEqual(
          Buffer.from(diff).toString('base64')
        );

        done();
      });

      job.on('error', (err) => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    }, 200000);

    test('Missing FL model', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        error: 'Not found any process related with this cycle and worker ID.',
      });
      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      expect.assertions(2);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain(
          'Not found any process related with this cycle and worker ID.'
        );
        done();
      });
    });

    test('Missing Model', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, { error: 'Model ID not found!' }, 400);
      grid.setPlan(1, { error: 'Plan ID not found!' }, 400);

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      expect.assertions(2);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Model ID not found');
        done();
      });
    });

    test('Missing Plan', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, { error: 'Plan ID not found!' }, 400);

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      expect.assertions(2);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Plan ID not found');
        done();
      });
    });

    test('Invalid Model', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, 'AAAAA');

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      expect.assertions(2);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Failed to load Model');
        done();
      });
    });

    test('Invalid Plan', async (done) => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, 'AAAAA');

      const job = syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3',
      });
      job.request();

      expect.assertions(2);
      job.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain("Failed to load 'training_plan' Plan");
        done();
      });
    });

    test('Multiple Jobs', async () => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
      });

      let job1Done, job2Done;
      const job1Promise = new Promise((done) => {
        job1Done = done;
      });
      const job2Promise = new Promise((done) => {
        job2Done = done;
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'worker1',
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey1',
        plans: {
          training_plan: 1,
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig,
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, Buffer.from(MNIST_PLAN, 'base64'));
      grid.setReportResponse({ status: 'success' });

      const job1 = syft.newJob({
        modelName: 'test1',
        modelVersion: '1.2.3',
      });

      const job2 = syft.newJob({
        modelName: 'test2',
        modelVersion: '1.2.3',
      });

      job1.start();
      job2.start();

      const onAccepted = async function ({ model, clientConfig }) {
        expect(clientConfig).toStrictEqual(dummyFLConfig.client_config);

        // Execute real Plan.
        const dataState = unserialize(
          null,
          MNIST_BATCH_DATA,
          protobuf.syft_proto.execution.v1.State
        );
        const [data, labels] = dataState.tensors;
        const lr = tf.tensor(MNIST_LR);
        const batchSize = tf.tensor(MNIST_BATCH_SIZE);
        const modelParams = model.params.map((t) => t.clone());

        const [loss, acc, ...updModelParams] = await this.plans[
          'training_plan'
        ].execute(syft, data, labels, batchSize, lr, ...modelParams);

        expect(loss).toBeInstanceOf(tf.Tensor);
        expect(acc).toBeInstanceOf(tf.Tensor);

        const diff = await model.createSerializedDiff(updModelParams);
        await this.report(diff);
      };

      const onError = (err) => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      };

      job1.on('accepted', async (e) => {
        console.log('job1 accepted');
        await onAccepted.bind(job1)(e);
        job1Done();
      });
      job2.on('accepted', async (e) => {
        console.log('job2 accepted');
        await onAccepted.bind(job2)(e);
        job2Done();
      });
      job1.on('error', onError);
      job2.on('error', onError);

      return Promise.all([job1Promise, job2Promise]);
    }, 200000);
  });
});
