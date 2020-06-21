import Syft from '../src/index';
import Job from '../src/job';
import SyftModel from '../src/syft-model';
import { GridMock } from './mocks/grid';
import { MNIST_PLAN, MNIST_MODEL_PARAMS } from './data/dummy';

describe('Syft', () => {
  test('can construct', () => {
    const syft = new Syft({
      url: 'url',
      verbose: true,
      authToken: 'abc',
      peerConfig: { test: 1 }
    });
    expect(syft).toBeInstanceOf(Syft);
    expect(syft.authToken).toBe('abc');
  });

  describe('PyGrid integration', () => {
    const dummyFLConfig = {
      client_config: {
        name: 'mnist',
        version: '1.0.0',
        batch_size: 64,
        lr: 0.005,
        max_updates: 100
      }
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

    test('Auth flow, success', async done => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
        authToken: 'auth secret'
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc'
      });
      grid.setCycleResponse({
        status: 'rejected'
      });
      const job = await syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3'
      });
      job.start({ skipGridSpeedTest: true });

      job.on('rejected', function({ timeout }) {
        expect(this).toBeInstanceOf(Job);
        expect(syft.worker_id).toBe('abc');
        // Timeout is not provided in the response.
        expect(timeout).toBe(undefined);
        expect(grid.wsMessagesHistory[0].data.auth_token).toBe('auth secret');
        done();
      });

      job.on('error', err => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });

    test('Auth flow, error', async () => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true,
        authToken: 'auth secret'
      });

      grid.setAuthenticationResponse({
        error: "The 'auth_token' you sent is invalid."
      });

      expect.assertions(3);
      try {
        await syft.newJob({ modelName: 'test', modelVersion: '1.2.3' });
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain("The 'auth_token' you sent is invalid");
        expect(grid.wsMessagesHistory[0].data.auth_token).toBe('auth secret');
      }
    });

    test('Acceptance into FL cycle (no auth)', async done => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc'
      });
      grid.setCycleResponse({
        status: 'accepted',
        request_key: 'reqkey',
        plans: {
          training_plan: 1
        },
        protocols: {},
        model_id: 1,
        ...dummyFLConfig
      });
      grid.setModel(1, Buffer.from(MNIST_MODEL_PARAMS, 'base64'));
      grid.setPlan(1, Buffer.from(MNIST_PLAN, 'base64'));

      const job = await syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3'
      });
      job.start({ skipGridSpeedTest: true });

      job.on('accepted', function({ model, clientConfig }) {
        expect(this).toBeInstanceOf(Job);
        expect(job.cycleParams.request_key).toBe('reqkey');
        expect(syft.worker_id).toBe('abc');
        expect(model).toBeInstanceOf(SyftModel);
        expect(clientConfig).toStrictEqual(dummyFLConfig.client_config);
        done();
      });

      job.on('error', err => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });

    test('Cycle rejection with timeout', async done => {
      const syft = new Syft({
        url: wsUrl,
        verbose: true
      });

      grid.setAuthenticationResponse({
        status: 'success',
        worker_id: 'abc'
      });
      grid.setCycleResponse({
        status: 'rejected',
        timeout: 100500
      });
      const job = await syft.newJob({
        modelName: 'test',
        modelVersion: '1.2.3'
      });
      job.start({ skipGridSpeedTest: true });

      job.on('rejected', function({ timeout }) {
        expect(this).toBeInstanceOf(Job);
        expect(syft.worker_id).toBe('abc');
        expect(timeout).toBe(100500);
        done();
      });

      job.on('error', err => {
        console.log('ERROR', err);
        expect(err).toBe(undefined);
      });
    });
  });
});
