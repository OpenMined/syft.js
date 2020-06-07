import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { Placeholder, PlaceholderId } from './placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { TorchParameter, TorchTensor } from './torch';
import { CANNOT_FIND_COMMAND, MISSING_VARIABLE } from '../_errors';

import { Threepio, Command } from '@openmined/threepio';
const threepio = new Threepio('torch', 'tfjs', tf);

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
      } else if (tensor instanceof TorchParameter) {
        return tensor.tensor.toTfTensor();
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

    // hack to support inplace tensor operation
    // TODO move to Threepio?
    if (this.command === 'add_') {
      this.returnPlaceholderIds[0] = this.target;
    }

    try {
      // Threepio
      const functionName = this.command.split('.').pop();
      if (functionName === 'sum') {
        // TODO update Threepio to support keepdim kwarg
        throw new Error("Threepio sum doesn't support keepdim");
      }
      const args = self ? [self, ...resolvedArgs] : [...resolvedArgs];
      const cmd = new Command(functionName, args, this.kwargs);
      const translation = threepio.translate(cmd);
      return translation.executeRoutine();
    } catch (e) {
      // Try our last resort, legacy translation
      // TODO Update Threepio and remove legacy
      return legacyTorchToTF(this.command, self, resolvedArgs, this.kwargs);
    }
  }
}

/**
 * Legacy translation layer to temporarily support ops missing in Threepio
 * TODO remove it
 * @param torchCmd
 * @param self
 * @param args
 * @param kwargs
 * @returns {Promise<*>}
 */
const legacyTorchToTF = (torchCmd, self, args, kwargs) => {
  const cmdMap = {
    dim: '@rank', // method to property mapping
    sum: ['sum', [], [kwargs['dim'], kwargs['keepdim']]],
    copy: 'clone',
    __rtruediv__: (self, args) => {
      // rdiv is div with reversed args
      return tf.div(args[0], self);
    }
  };

  let preArgs = [];
  let postArgs = [];
  let command = '';
  let property = '';

  if (torchCmd in cmdMap) {
    command = cmdMap[torchCmd];
    if (typeof command === 'function') {
      return command(self, args, kwargs);
    }
    if (Array.isArray(command)) {
      preArgs = command[1] || [];
      postArgs = command[2] || [];
      command = command[0];
    }
  }

  if (command.match(/^@/)) {
    // this is a property on self
    property = command.substr(1);
    command = '';
  }

  if (command) {
    if (!Object.hasOwnProperty.call(tf, command)) {
      throw new Error(CANNOT_FIND_COMMAND(command));
    }

    const selfArg = self ? [self] : [];
    return tf[command](...selfArg, ...preArgs, ...args, ...postArgs);
  } else if (property) {
    if (!(property in self)) {
      throw new Error(CANNOT_FIND_COMMAND(`object.${property}`));
    }

    return self[property];
  } else {
    throw new Error(CANNOT_FIND_COMMAND(torchCmd));
  }
};
