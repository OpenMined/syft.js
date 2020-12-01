import { DataLoader, Dataset } from '../src/data';
import * as tf from '@tensorflow/tfjs-core';

class TestDataset extends Dataset {
  constructor() {
    super();
    // make tensors 0,1,2,3,...
    this.data = [...Array(10).keys()].map(i => tf.tensor(i));
  }

  getItem(idx) {
    return this.data[idx];
  }

  get length() {
    return this.data.length;
  }
}

describe('DataLoader', () => {
  const dataset = new TestDataset();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns samples in original order when shuffle is false', () => {
    const loader = new DataLoader({dataset, batchSize: 4, shuffle: false, dropLast: false});
    const samples = [...loader];
    expect(samples).toHaveLength(3);
    expect(samples[0].arraySync()).toStrictEqual([0, 1, 2, 3]);
    expect(samples[1].arraySync()).toStrictEqual([4, 5, 6, 7]);
    expect(samples[2].arraySync()).toStrictEqual([8, 9]);
  });

  test('returns samples shuffled when shuffle is true', async () => {
    const loader = new DataLoader({dataset, batchSize: 4, shuffle: true, dropLast: false});
    const samples = [...loader].map(i => i.arraySync());
    expect(samples).toHaveLength(3);

    const full = [...samples[0], ...samples[1], ...samples[2]];
    expect(full).not.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(full.sort()).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('doesnt return incomplete batch when droplast is true', () => {
    // last batch will be dropped because it will have only 2 elements
    const loader1 = new DataLoader({dataset, batchSize: 4, shuffle: false, dropLast: true});
    const samples1 = [...loader1];
    expect(samples1).toHaveLength(2);
    expect(samples1[0].arraySync()).toStrictEqual([0, 1, 2, 3]);
    expect(samples1[1].arraySync()).toStrictEqual([4, 5, 6, 7]);

    // last batch won't be dropped because all batches are complete
    const loader2 = new DataLoader({dataset, batchSize: 5, shuffle: false, dropLast: true});
    const samples2 = [...loader2];
    expect(samples2).toHaveLength(2);
    expect(samples2[0].arraySync()).toStrictEqual([0, 1, 2, 3, 4]);
    expect(samples2[1].arraySync()).toStrictEqual([5, 6, 7, 8, 9]);
  });

});
