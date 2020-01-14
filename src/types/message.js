import { default as proto } from '../proto';
import { unbufferize } from '../protobuf';
import PointerTensor from './pointer-tensor';

import { torchToTF } from '../_helpers';
import { TorchTensor } from './torch';

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
  constructor(message, returnIds) {
    super();

    this.message = message;
    this.returnIds = returnIds;

    this._command = message[0];
    this._self = message[1];
    this._args = message[2];
    this._kwargs = message[3];
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Operation'];
    return `(${TYPE}, (${f(this.message)}, ${f(this.returnIds)}))`; // prettier-ignore
  }

  execute(objects, logger) {
    // A helper function for helping us determine if all PointerTensors inside of "this._args" also exist as tensors inside of "objects"
    const haveValuesForAllArgs = args => {
      let enoughInfo = true;

      args.forEach(arg => {
        if (
          arg instanceof PointerTensor &&
          !objects.hasOwnProperty(arg.idAtLocation)
        ) {
          enoughInfo = false;
        }
      });

      return enoughInfo;
    };

    // A helper function for helping us get all operable tensors from PointerTensors inside of "this._args"
    const pullTensorsFromArgs = args => {
      const resolvedArgs = [];

      args.forEach(arg => {
        if (arg instanceof PointerTensor) {
          const tensor = objects[arg.idAtLocation];

          if (tensor && tensor instanceof tf.Tensor) {
            resolvedArgs.push(objects[arg.idAtLocation]);
          } else if (tensor instanceof TorchTensor) {
            resolvedArgs.push(objects[arg.idAtLocation]._tfTensor);
          }
        } else if (arg instanceof TorchTensor) {
          resolvedArgs.push(arg._tfTensor);
        } else resolvedArgs.push(null);
      });

      return resolvedArgs;
    };

    // TODO: We need to do something with kwargs!

    // Make sure to convert the command name that was given into a valid TensorFlow.js command
    const command = torchToTF(this._command, logger);

    logger.log(
      `Given command: ${this._command}, converted command: ${command}`
    );

    // If we're executing the command against itself only, let's roll!
    if (this._self === null) {
      if (haveValuesForAllArgs(this._args)) {
        // Resolve all PointerTensors in our arguments to operable tensors
        const args = pullTensorsFromArgs(this._args);

        return tf[command](...args);
      }

      // Otherwise, we don't have enough information, return null
      return null;
    } else {
      if (haveValuesForAllArgs(this._args)) {
        // Get the actual tensor inside the PointerTensor "this.self"
        const self = objects[this._self.idAtLocation];

        // Resolve all PointerTensors in our arguments to operable tensors
        const args = pullTensorsFromArgs(this._args);

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
