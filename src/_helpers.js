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
  // If the command exists in TensorFlow.js already
  if (tf.hasOwnProperty(command)) return command;
  // If the command exists in TensorFlow.js already by removing the underscores
  else if (tf.hasOwnProperty(command.split('_').join('')))
    return command.split('_').join('');
  // The command definitely doesn't exist under the name given and we must manually map it to a function
  else {
    console.log('WE MUST DO A LOOKUP');

    return 'add';
  }
};
