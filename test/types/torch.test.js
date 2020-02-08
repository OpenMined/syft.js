import { TorchParameter, TorchTensor, TorchSize } from '../../src/types/torch';
import * as tf from '@tensorflow/tfjs';

describe('TorchTensor', () => {
  test('can be properly constructed', () => {
    const chain = new TorchTensor(
      555,
      new Float32Array([6, 6, 6, 6]),
      [2, 2],
      'float32'
    );
    const grad = new TorchTensor(
      666,
      new Float32Array([6, 6, 6, 6]),
      [2, 2],
      'float32'
    );
    const obj = new TorchTensor(
      123,
      new Float32Array([1, 2, 3.3, 4]),
      [2, 2],
      'float32',
      chain,
      grad,
      ['tag1', 'tag2'],
      'desc'
    );
    const tfTensor = tf.tensor([1, 2, 3.3, 4], [2, 2], 'float32');

    expect(obj.id).toStrictEqual(123);
    expect(obj.shape).toStrictEqual([2, 2]);
    expect(obj.dtype).toStrictEqual('float32');
    expect(obj.contents).toStrictEqual(new Float32Array([1, 2, 3.3, 4]));

    // resulting TF tensors are equal
    expect(
      tf
        .equal(obj._tfTensor, tfTensor)
        .all()
        .dataSync()[0]
    ).toBe(1);

    expect(obj.chain).toBe(chain);
    expect(obj.gradChain).toBe(grad);
    expect(obj.tags).toStrictEqual(['tag1', 'tag2']);
    expect(obj.description).toStrictEqual('desc');
  });
});

describe('TorchSize', () => {
  test('can be properly constructed', () => {
    const obj = new TorchSize([2, 3]);
    expect(obj.size).toStrictEqual([2, 3]);
  });
});

describe('TorchParameter', () => {
  test('can be properly constructed', () => {
    const grad = new TorchTensor(
      666,
      new Float32Array([6, 6, 6, 6]),
      [2, 2],
      'float32'
    );
    const tensor = new TorchTensor(
      123,
      new Float32Array([1, 2, 3.3, 4]),
      [2, 2],
      'float32'
    );
    const obj = new TorchParameter(123, tensor, true, grad);

    expect(obj.id).toStrictEqual(123);
    expect(obj.tensor).toBe(tensor);
    expect(obj.requiresGrad).toStrictEqual(true);
    expect(obj.grad).toBe(grad);
  });
});
