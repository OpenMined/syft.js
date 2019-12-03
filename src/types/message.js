import { default as proto } from '../proto';
import PointerTensor from './pointer-tensor';

import { torchToTF } from '../_helpers';

export const CODES = {
  CMD: 1,
  OBJ: 2,
  OBJ_REQ: 3,
  OBJ_DEL: 4,
  EXCEPTION: 5,
  IS_NONE: 6,
  GET_SHAPE: 7,
  SEARCH: 8,
  FORCE_OBJ_DEL: 9,
  PLAN_CMD: 10
};

export class Message {
  constructor(type, contents) {
    this.type = type;

    if (contents) {
      this.contents = contents;
    }
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Message'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class Operation extends Message {
  constructor(message, returnIds) {
    super(CODES.CMD);

    this.message = message;
    this.command = message[0];
    this.self = message[1];
    this.args = message[2];
    this.kwargs = message[3];
    this.returnIds = returnIds;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Operation'];
    return `(${TYPE}, (${this.type}, (${f(this.message)}, ${f(this.returnIds)})))`; // prettier-ignore
  }

  execute(d, objects) {
    console.log(this.command, this.self, this.args, this.kwargs, d, objects);

    // A helper function for helping us determine if all PointerTensors inside of "this.args" also exist as tensors inside of "objects"
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

    // Get the actual tensor inside the PointerTensor "this.self"
    const self = objects[this.self.idAtLocation];

    // Make sure to convert the command name that was given into a valid TensorFlow.js command
    const command = torchToTF(this.command);

    console.log(
      `Given command: ${this.command}`,
      `Converted command: ${command}`
    );

    // TODO: We need to do something with kwargs here

    // If we're executing the command against itself only, let's roll!
    if (this.args.length === 0) return tf[command](self);
    else {
      if (haveValuesForAllArgs(this.args)) {
        // Get the actual tensors in each of the items of "args"
        const args = [];

        this.args.forEach(arg => {
          if (arg instanceof PointerTensor)
            args.push(objects[arg.idAtLocation]);
          else args.push(arg);
        });

        console.log(this.args, args);

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
    super(CODES.OBJ, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ObjectMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class ObjectRequestMessage extends Message {
  constructor(contents) {
    super(CODES.OBJ_REQ, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ObjectRequestMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class IsNoneMessage extends Message {
  constructor(contents) {
    super(CODES.IS_NONE, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.IsNoneMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class GetShapeMessage extends Message {
  constructor(contents) {
    super(CODES.GET_SHAPE, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.GetShapeMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class ForceObjectDeleteMessage extends Message {
  constructor(contents) {
    super(CODES.FORCE_OBJ_DEL, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.ForceObjectDeleteMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class SearchMessage extends Message {
  constructor(contents) {
    super(CODES.SEARCH, contents);
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.SearchMessage'];
    return `(${TYPE}, (${this.type}, ${f(this.contents)}))`; // prettier-ignore
  }
}

export class PlanCommandMessage extends Message {
  constructor(commandName, message) {
    super(CODES.PLAN_CMD);

    this.commandName = commandName;
    this.message = message;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.PlanCommandMessage'];
    return `(${TYPE}, (${this.type}, (${f(this.commandName)}, ${f(this.message)})))`; // prettier-ignore
  }
}
