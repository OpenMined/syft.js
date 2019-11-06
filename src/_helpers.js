import { TorchTensor } from './types/torch';
import PointerTensor from './types/pointer-tensor';

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
  // In Python, some commands in TensorFlow and PyTorch are submitted with double-underscores to avoid method collision
  // Since we don't need this nonsense in TensorFlow.js... let's strip all the underscores
  command = command.split('_').join('');

  // If the command as it's currently named exists in TensorFlow.js already, return the command name
  if (tf.hasOwnProperty(command)) return command;

  // If not, we will need to do a lookup of the command in question
  console.log('WE MUST DO A LOOKUP');

  return 'add';
};
