import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { Placeholder, PlaceholderId } from './placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { TorchParameter, TorchTensor } from './torch';
import { CANNOT_FIND_COMMAND, MISSING_VARIABLE } from '../_errors';

/**
 * ComputationAction describes mathematical operations performed on tensors.
 *
 * @param {string} command - The name of the method to be invoked (e.g. "torch.abs").
 * @param {} target - The object to invoke the method on.
 * @param {} args - The arguments to the method call.
 * @param {} kwargs - The keyword arguments to the method call.
 * @param {} returnIds -
 * @param {} returnPlaceholderIds -
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
    const haveValuesForAllArgs = (args) => {
      let enoughInfo = true;

      args.forEach((arg) => {
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

    const toTFTensor = (tensor) => {
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

    const getTensorByRef = (reference) => {
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
    const pullTensorsFromArgs = (args) => {
      const resolvedArgs = [];

      args.forEach((arg) => {
        const tensorByRef = getTensorByRef(arg);
        if (tensorByRef) {
          resolvedArgs.push(toTFTensor(tensorByRef));
        } else {
          // Try to convert to tensor.
          const tensor = toTFTensor(arg);
          if (tensor !== null) {
            resolvedArgs.push(toTFTensor(arg));
          } else {
            // Keep as is.
            resolvedArgs.push(arg);
          }
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
    const functionName = this.command.split('.').pop();

    if (self) {
      if (!(functionName in self)) {
        throw new Error(CANNOT_FIND_COMMAND(`tensor.${functionName}`));
      } else {
        return self[functionName](...resolvedArgs);
      }
    }

    if (!(functionName in tf)) {
      throw new Error(CANNOT_FIND_COMMAND(functionName));
    } else {
      return tf[functionName](...resolvedArgs, ...Object.values(this.kwargs));
    }
  }
}
