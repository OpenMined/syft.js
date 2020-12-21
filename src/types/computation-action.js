import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { Placeholder, PlaceholderId } from './placeholder';
import * as tf from '@tensorflow/tfjs-core';
import { TorchParameter, TorchTensor } from './torch';
import { CannotFindCommandError, MissingVariableError } from '../_errors';

/**
 * ComputationAction describes mathematical operations performed on tensors.
 *
 * @param {string} command - The name of the method to be invoked (e.g. "torch.abs").
 * @param {string|PointerTensor|PlaceholderId|TorchTensor} target - The object to invoke the method on.
 * @param {*} args - The arguments to the method call.
 * @param {Object} kwargs - The keyword arguments to the method call.
 * @param {Array.<string>} returnIds - List of ids for action results.
 * @param {Array.<PlaceholderId>} returnPlaceholderIds - List of PlaceholderIds returned from the action.
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

  /**
   * Reconstructs a ComputationAction object from a protobuf message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.ComputationAction} pb - Protobuf object for ComputationAction.
   * @returns {ComputationAction}
   */
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

  /**
   * Execute the ComputationAction with given worker.
   * @param {ObjectRegistry} scope - Local scope provided by the Role on executing the Plan and its actions.
   * @returns {Promise<Array.<tf.Tensor|number>>}
   */
  async execute(scope) {
    // Helper function to determine if all PointerTensors/Placeholders in "this.args" also exist as tensors in "objects"
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

    // Helper function to get all operable tensors from PointerTensors in "this.args"
    const pullTensorsFromArgs = (args) => {
      const resolvedArgs = [];

      args.forEach((arg) => {
        const tensorByRef = getTensorByRef(arg);
        if (tensorByRef) {
          resolvedArgs.push(toTFTensor(tensorByRef));
        } else {
          // Try to convert to tensor
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

    const args = this.args;
    let self = null;

    if (this.target) {
      // Resolve "self" if it's present
      self = getTensorByRef(this.target);
      if (!self) {
        throw new MissingVariableError();
      }
    }

    if (!haveValuesForAllArgs(args)) {
      throw new MissingVariableError();
    }

    const resolvedArgs = pullTensorsFromArgs(args);
    const functionName = this.command.split('.').pop();

    // If target exists, check if target contains the specific function and return computed results
    if (self) {
      if (!(functionName in self)) {
        throw new CannotFindCommandError(`tensor.${functionName}`);
      } else {
        return self[functionName](...resolvedArgs);
      }
    }

    // Else, check if tfjs contains the specific function and return computed results
    if (!(functionName in tf)) {
      throw new CannotFindCommandError(functionName);
    } else {
      return tf[functionName](...resolvedArgs, ...Object.values(this.kwargs));
    }
  }
}
