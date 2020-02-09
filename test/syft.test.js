// TODO: We need to start test cover here!!!

import { protobuf, unserialize } from '../src/protobuf';
import Syft from '../src';
import * as tf from '@tensorflow/tfjs-core';

describe('Syft', () => {
  test('can execute a Plan', done => {
    const plan =
      'CgYIgcivoCUSRwoHX19hZGRfXxoWCgYIgsivoCUSCCNpbnB1dC0wEgIjMioWShQKBgiAyK+gJRICIzESBiNzdGF0ZUIMCgYIhMivoCUSAiMzEjQKCXRvcmNoLmFicyoOSgwKBgiEyK+gJRICIzNCFwoGCIPIr6AlEgIjNBIJI291dHB1dC0wGj8KFAoGCIDIr6AlEgIjMRIGI3N0YXRlEicKJQoGCIDIr6AlEhkKAwoBAhIHZmxvYXQzMrIBCGZmhkCamelAQAQgASgBMgdib2JQbGFuShQKBgiAyK+gJRICIzESBiNzdGF0ZUoWCgYIgsivoCUSCCNpbnB1dC0wEgIjMkoMCgYIhMivoCUSAiMzShcKBgiDyK+gJRICIzQSCSNvdXRwdXQtMA==';
    const input = tf.tensor([
      [1, 2],
      [-30, -40]
    ]);
    // this is what plan contains
    const state = tf.tensor([4.2, 7.3]);
    const expected = tf.abs(tf.add(input, state));

    const syft = new Syft({ verbose: true });
    syft.plan = unserialize(null, plan, protobuf.syft_proto.messaging.v1.Plan);
    syft.executePlan(input).then(
      res => {
        expect(res[0].value).toBeInstanceOf(tf.Tensor);
        expect(
          tf
            .equal(res[0].value, expected)
            .all()
            .dataSync()[0]
        ).toBe(1);
        done();
      },
      err => done.fail('Plan failed to execute: ' + err)
    );
  });
});

// import 'regenerator-runtime/runtime';
// import { Server } from 'mock-socket';
// import Syft from '../src/index';
// import { TENSOR_REMOVED } from '../src/_constants';

// const fakeURL = 'ws://localhost:8080/';

// let syft = null;
// let mockServer = null;

// describe('Syft', () => {
//   beforeAll(done => {
//     mockServer = new Server(fakeURL);
//     syft = new Syft({ verbose: true });

//     done();
//   });

//   beforeEach(() => {
//     syft.start(fakeURL);
//   });

//   afterEach(() => {
//     if (syft.socket) {
//       syft.stop();
//     }
//   });

//   /* ----- CONSTRUCTOR ----- */

//   test('can construct a syft client', async () => {
//     const newSyft = new Syft({
//       url: fakeURL,
//       verbose: true
//     });

//     expect(newSyft.tensors.length).toBe(0);

//     expect(typeof newSyft.observer.subscribe).toBe('function');
//     expect(typeof newSyft.observer.unsubscribe).toBe('function');
//     expect(typeof newSyft.observer.broadcast).toBe('function');

//     expect(typeof newSyft.logger.log).toBe('function');
//     expect(newSyft.logger.verbose).toBe(true);

//     expect(newSyft.socket.url).toBe(fakeURL);
//   });

//   /* ----- HELPERS ----- */

//   // genTensors()
//   test('can get a list of tensors', async () => {
//     expect(syft.getTensors().length).toBe(0);

//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//     expect(syft.getTensors().length).toBe(1);
//   });

//   // getTensorById()
//   test('can get a tensor by id', async () => {
//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);

//     const tensor = syft.getTensorById('first-tensor');

//     expect(tensor.id).toBe('first-tensor');
//   });

//   // getTensorIndex()
//   test('can the index of a tensor', async () => {
//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//     await syft.addTensor('second-tensor', [[1, 2], [3, 4]]);
//     await syft.addTensor('third-tensor', [[1, 2], [3, 4]]);

//     const index = syft.getTensorIndex('second-tensor');

//     expect(index).toBe(1);
//   });

//   /* ----- FUNCTIONALITY ----- */

//   // addTensor()
//   test('can add a tensor to the list', async () => {
//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]).then(tensors => {
//       expect(tensors.length).toBe(1);
//       expect(tensors[0].id).toBe('first-tensor');
//     });
//   });

//   // removeTensor()
//   test('can remove a tensor from the list', async () => {
//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);

//     await syft.removeTensor('first-tensor').then(tensors => {
//       expect(tensors.length).toBe(0);
//     });
//   });

//   // runOperation()
//   test('can perform a TensorFlow operation', async () => {
//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//     await syft.addTensor('second-tensor', [[5, 6], [7, 8]]);

//     await syft
//       .runOperation('add', ['first-tensor', 'second-tensor'])
//       .then(result => {
//         const resultData = result.dataSync();

//         expect(resultData).toContain(6);
//         expect(resultData).toContain(8);
//         expect(resultData).toContain(10);
//         expect(resultData).toContain(12);

//         expect(resultData).not.toContain(1);
//         expect(resultData).not.toContain(2);
//         expect(resultData).not.toContain(3);
//         expect(resultData).not.toContain(4);
//       });
//   });

//   /* ----- EVENT HANDLERS ----- */

//   test('can subscribe and unsubscribe from an event', async () => {
//     syft.onTensorRemoved(({ id, tensors }) => ({ id, tensors }));

//     expect(syft.observer.observers.length).toBe(1);

//     syft.observer.unsubscribe(TENSOR_REMOVED);

//     expect(syft.observer.observers.length).toBe(0);
//   });

//   // onMessageReceived()
//   // TODO

//   // onMessageSent()
//   // TODO

//   // onRunOperation()
//   test('can subscribe to a TensorFlow operation being performed', async () => {
//     syft.onRunOperation(({ func, result }) => {
//       expect(func).toBe('add');

//       const resultData = result.dataSync();

//       expect(resultData).toContain(6);
//       expect(resultData).toContain(8);
//       expect(resultData).toContain(10);
//       expect(resultData).toContain(12);

//       expect(resultData).not.toContain(1);
//       expect(resultData).not.toContain(2);
//       expect(resultData).not.toContain(3);
//       expect(resultData).not.toContain(4);
//     });

//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//     await syft.addTensor('second-tensor', [[5, 6], [7, 8]]);
//     await syft.runOperation('add', ['first-tensor', 'second-tensor']);
//   });

//   // onTensorAdded()
//   test('can subscribe to a tensor being added', async () => {
//     syft.onTensorAdded(({ id, tensor, tensors }) => {
//       expect(id).toBe('first-tensor');
//       expect(tensor.size).toBe(4);
//       expect(tensors.length).toBe(1);
//     });

//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//   });

//   // onTensorRemoved()
//   test('can subscribe to a tensor being removed', async () => {
//     syft.onTensorRemoved(({ id, tensors }) => {
//       expect(id).toBe('first-tensor');
//       expect(tensors.length).toBe(0);
//     });

//     await syft.addTensor('first-tensor', [[1, 2], [3, 4]]);
//     await syft.removeTensor('first-tensor');
//   });

//   /* ----- SOCKET COMMUNICATION ----- */

//   // createSocketConnection()
//   test('can create a socket connection', async () => {
//     expect(syft.createSocketConnection()).toBe(null);
//     expect(syft.createSocketConnection(fakeURL).url).toBe(fakeURL);
//   });

//   // sendMessage()
//   // TODO

//   // start()
//   test('can start', async () => {
//     const newSyft = new Syft();

//     newSyft.start(fakeURL);

//     expect(newSyft.socket.url).toBe(fakeURL);
//   });

//   // stop()
//   test('can stop', async () => {
//     syft.stop();

//     expect(syft.socket).toBe(null);
//   });
// });
