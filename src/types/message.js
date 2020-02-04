import { default as proto } from '../proto';
import { Tuple } from '../../src/types/native';
import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';
import { torchToTF } from '../_helpers';
import { TorchTensor } from './torch';
import Placeholder from './placeholder';
import * as tf from '@tensorflow/tfjs';

export class Message {
  constructor(contents) {
    if (contents) {
      this.contents = contents;
    }
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Message'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
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

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Operation'];
    return `(${TYPE}, (${f(this.message)}, ${f(this.returnIds)}))`; // prettier-ignore
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

  execute(objects, logger) {
    // A helper function for helping us determine if all PointerTensors/Placeholders inside of "this.args" also exist as tensors inside of "objects"
    const haveValuesForAllArgs = args => {
      let enoughInfo = true;

      args.forEach(arg => {
        if (
          (arg instanceof PointerTensor &&
            !objects.hasOwnProperty(arg.idAtLocation)) ||
          (arg instanceof Placeholder && !objects.hasOwnProperty(arg.id))
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
        return tensor._tfTensor;
      }
      return null;
    };

    const getTensorByRef = reference => {
      if (reference instanceof Placeholder) {
        return objects[reference.id];
      } else if (reference instanceof PointerTensor) {
        return objects[reference.idAtLocation];
      }
      return null;
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

    // TODO: We need to do something with kwargs!

    // Make sure to convert the command name that was given into a valid TensorFlow.js command
    const command = torchToTF(this.command, logger);

    logger.log(`Given command: ${this.command}, converted command: ${command}`);

    // If we're executing the command against itself only, let's roll!
    if (!this.owner) {
      if (haveValuesForAllArgs(this.args)) {
        // Resolve all PointerTensors/Placeholders in our arguments to operable tensors
        const args = pullTensorsFromArgs(this.args);

        return tf[command](...args);
      }

      // Otherwise, we don't have enough information, return null
      return null;
    } else {
      if (haveValuesForAllArgs(this.args)) {
        // Get the actual tensor inside the PointerTensor/Placeholder "this.owner"
        const self = getTensorByRef(this.owner);

        // Resolve all PointerTensors/Placeholders in our arguments to operable tensors
        const args = pullTensorsFromArgs(this.args);

        // Now we can execute a multi-argument method
        return tf[command](self, ...args);
      }

      // Otherwise, we don't have enough information, return null
      return null;
    }
  }
}

export class ObjectMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ObjectMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }

  static unbufferize(worker, pb) {
    const tensor = unbufferize(worker, pb.tensor);
    return new ObjectMessage(tensor);
  }
}

export class ObjectRequestMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ObjectRequestMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }
}

export class IsNoneMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.IsNoneMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }
}

export class GetShapeMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.GetShapeMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }
}

export class ForceObjectDeleteMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ForceObjectDeleteMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }
}

export class SearchMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.SearchMessage'];
    return `(${TYPE}, (${f(this.contents)}))`; // prettier-ignore
  }
}

export class PlanCommandMessage extends Message {
  constructor(commandName, message) {
    super();

    this.commandName = commandName;
    this.message = message;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.PlanCommandMessage'];
    return `(${TYPE}, (${f(this.commandName)}, ${f(this.message)}))`; // prettier-ignore
  }
}
