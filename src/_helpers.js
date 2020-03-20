import { TorchTensor } from './types/torch';
import PointerTensor from './types/pointer-tensor';
import * as tf from '@tensorflow/tfjs-core';
import { Threepio } from '@openmined/threepio';

export const pickTensors = tree => {
  const objects = {};

  const recur = data => {
    if (data instanceof TorchTensor || data instanceof PointerTensor) {
      objects[data.id] = data;
    }

    if (data === null) return;
    else if (Array.isArray(data)) return data.forEach(item => recur(item));
    else if (typeof data === 'object')
      return Object.keys(data).forEach(item => recur(data[item]));

    return data;
  };

  recur(tree);

  return objects;
};

export const torchToTF = command => {
  const threepio = new Threepio('torch', 'tfjs', tf);
  return threepio.translate(command);
};
