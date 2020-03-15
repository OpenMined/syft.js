import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { torchToTF } from '../_helpers';
import { TorchTensor } from './torch';
import Placeholder from './placeholder';
import * as tf from '@tensorflow/tfjs-core';
import Logger from '../logger';

export class Message {
  constructor(contents) {
    if (contents) {
      this.contents = contents;
    }
    this.logger = new Logger();
  }
}

export class Operation extends Message {
  constructor(command, owner, args, kwArgs, returnIds, returnPlaceholders) {
    super();
    this.command = command;
    this.owner = owner;
    this.args = args;
    this.kwArgs = kwArgs;
    this.returnIds = returnIds;
    this.returnPlaceholders = returnPlaceholders;
  }

  static unbufferize(worker, pb) {
    return new Operation(
      pb.command,
      unbufferize(worker, pb[pb.owner]),
      unbufferize(worker, pb.args),
      unbufferize(worker, pb.kwargs),
      unbufferize(worker, pb.return_ids),
      unbufferize(worker, pb.return_placeholders)
    );
  }

  execute(worker) {
    // A helper function for helping us determine if all PointerTensors/Placeholders inside of "this.args" also exist as tensors inside of "objects"
    const haveValuesForAllArgs = args => {
      let enoughInfo = true;

      args.forEach(arg => {
        if (
          (arg instanceof PointerTensor &&
            !Object.hasOwnProperty.call(worker.objects, arg.idAtLocation)) ||
          (arg instanceof Placeholder &&
            !Object.hasOwnProperty.call(worker.objects, arg.id))
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
      if (reference instanceof Placeholder) {
        tensor = worker.objects[reference.id];
      } else if (reference instanceof PointerTensor) {
        tensor = worker.objects[reference.idAtLocation];
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

    // Make sure to convert the command name that was given into a valid TensorFlow.js command

    let command = torchToTF(this.command, this.kwArgs);
    let preArgs = [];
    let postArgs = [];
    if (Array.isArray(command)) {
      preArgs = command[1] || [];
      postArgs = command[2] || [];
      command = command[0];
    }

    //worker.logger.log(`Given command: ${this.command}, converted command: ${command} + ${JSON.stringify(preArgs)} + ${JSON.stringify(postArgs)}`);

    // If we're executing the command against itself only, let's roll!
    let result = null;
    if (!this.owner) {
      if (haveValuesForAllArgs(this.args)) {
        // Resolve all PointerTensors/Placeholders in our arguments to operable tensors
        const args = pullTensorsFromArgs(this.args);

        result = tf[command](...preArgs, ...args, ...postArgs);
      }
    } else {
      if (haveValuesForAllArgs(this.args)) {
        // Get the actual tensor inside the PointerTensor/Placeholder "this.owner"
        const self = getTensorByRef(this.owner);

        // Resolve all PointerTensors/Placeholders in our arguments to operable tensors
        const args = pullTensorsFromArgs(this.args);

        // Now we can execute a multi-argument method
        result = tf[command](self, ...preArgs, ...args, ...postArgs);
      }
    }

    // Otherwise, we don't have enough information, return null
    return result;
  }
}

export class ObjectMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  static unbufferize(worker, pb) {
    const tensor = unbufferize(worker, pb.tensor);
    return new ObjectMessage(tensor);
  }
}

// TODO when types will be availbale in protobuf

/*
export class ObjectRequestMessage extends Message {
  constructor(contents) {
    super(contents);
  }
}

export class IsNoneMessage extends Message {
  constructor(contents) {
    super(contents);
  }
}

export class GetShapeMessage extends Message {
  constructor(contents) {
    super(contents);
  }
}

export class ForceObjectDeleteMessage extends Message {
  constructor(contents) {
    super(contents);
  }
}

export class SearchMessage extends Message {
  constructor(contents) {
    super(contents);
  }
}

export class PlanCommandMessage extends Message {
  constructor(commandName, message) {
    super();

    this.commandName = commandName;
    this.message = message;
  }
}
*/
