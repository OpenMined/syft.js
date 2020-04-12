import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { Placeholder, PlaceholderId } from './placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { TorchTensor } from './torch';
import { CANNOT_FIND_COMMAND, MISSING_VARIABLE } from '../_errors';

/*
import Logger from '../logger';
const logger = new Logger();

import { Threepio, Command } from '@openmined/threepio';
const threepio = new Threepio('torch', 'tfjs', tf);
*/

export class ComputationAction {
  constructor(command, target, args, kwargs, returnIds, returnPlaceholderIds) {
    this.command = command;
    this.target = target;
    this.args = args;
    this.kwargs = kwargs;
    this.returnIds = returnIds;
    this.returnPlaceholderIds = returnPlaceholderIds;
  }

  static unbufferize(worker, pb) {
    return new ComputationAction(
      pb.command,
      unbufferize(worker, pb[pb.target]),
      unbufferize(worker, pb.args),
      unbufferize(worker, pb.kwargs),
      unbufferize(worker, pb.return_ids),
      unbufferize(worker, pb.return_placeholder_ids)
    );
  }

  async execute(scope) {
    // A helper function for helping us determine if all PointerTensors/Placeholders inside of "this.args" also exist as tensors inside of "objects"
    const haveValuesForAllArgs = args => {
      let enoughInfo = true;

      args.forEach(arg => {
        if (
          (arg instanceof PointerTensor && !scope.has(arg.idAtLocation)) ||
          (arg instanceof Placeholder && !scope.has(arg.id)) ||
          (arg instanceof PlaceholderId && !scope.has(arg.id))
        ) {
          enoughInfo = false;
        }
      });

      return enoughInfo;
    };

    const toTFTensor = tensor => {
      if (tensor instanceof tf.Tensor) {
        return tensor;
      } else if (tensor instanceof TorchTensor) {
        return tensor.toTfTensor();
      } else if (typeof tensor === 'number') {
        return tensor;
      }
      return null;
    };

    const getTensorByRef = reference => {
      let tensor = null;
      if (reference instanceof PlaceholderId) {
        tensor = scope.get(reference.id);
      } else if (reference instanceof Placeholder) {
        tensor = scope.get(reference.id);
      } else if (reference instanceof PointerTensor) {
        tensor = scope.get(reference.idAtLocation);
      }
      tensor = toTFTensor(tensor);
      return tensor;
    };

    // A helper function for helping us get all operable tensors from PointerTensors inside of "this._args"
    const pullTensorsFromArgs = args => {
      const resolvedArgs = [];

      args.forEach(arg => {
        const tensorByRef = getTensorByRef(arg);
        if (tensorByRef) {
          resolvedArgs.push(toTFTensor(tensorByRef));
        } else {
          resolvedArgs.push(toTFTensor(arg));
        }
      });

      return resolvedArgs;
    };

    //worker.logger.log(`Given command: ${this.command}, converted command: ${command} + ${JSON.stringify(preArgs)} + ${JSON.stringify(postArgs)}`);

    const args = this.args;
    let self = null;

    if (this.target) {
      // resolve "self" if it's present
      self = getTensorByRef(this.target);
      if (!self) {
        throw new Error(MISSING_VARIABLE());
      }
    }

    if (!haveValuesForAllArgs(args)) {
      throw new Error(MISSING_VARIABLE());
    }

    const resolvedArgs = pullTensorsFromArgs(args);

    /*
    try {
      // Threepio
      const functionName = this.command.split('.').pop();
      if (self) {
        resolvedArgs.unshift(self);
      }
      const cmd = new Command(functionName, resolvedArgs, this.kwargs);
      const translation = threepio.translate(cmd);
      return translation.executeRoutine();
    } catch (e) {
      // fallback
      logger.log(`Failed to translate ${this.command} using Threepio fallback to legacy translation`);
      return legacyTorchToTF(this.command, self, resolvedArgs, this.kwargs);
    }
    */

    return legacyTorchToTF(this.command, self, resolvedArgs, this.kwargs);
  }

}

const legacyTorchToTF = (torchCmd, self, args, kwargs) => {
  const cmd_map = {
    t: 'transpose',
    __matmul__: 'matMul',
    __truediv__: 'div',
    __gt__: 'greater',
    eq: 'equal',
    'torch.argmax': ['argMax', [], [kwargs['dim']]],
    float: ['cast', ['float32']],
    'torch.nn.functional.relu': 'relu',
    'torch.nn.functional.softmax': ['softmax', [], [kwargs['dim']]]
  };

  let preArgs = [];
  let postArgs = [];
  let command = null;

  if (torchCmd in cmd_map) {
    command = cmd_map[torchCmd];
    if (Array.isArray(command)) {
      preArgs = command[1] || [];
      postArgs = command[2] || [];
      command = command[0];
    }
  } else {
    // In Python, some commands in TensorFlow and PyTorch are submitted with double-underscores to avoid method collision
    // Since we don't need this nonsense in TensorFlow.js... let's strip all the underscores
    command = torchCmd.split('_').join('');
    // Sometimes PyTorch commands come with "torch." on the beginning, strip that out
    command = command.split('torch.').join('');
  }

  // If the command as it's currently named exists in TensorFlow.js already, return the command name
  if (!Object.hasOwnProperty.call(tf, command)) {
    throw new Error(CANNOT_FIND_COMMAND(command));
  }

  const selfArg = self ? [self] : [];
  return tf[command](...selfArg, ...preArgs, ...args, ...postArgs);
};
