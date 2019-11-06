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

    // TODO: No idea what to do with "kwargs" in this case...

    const pointerTensorExists = tensor =>
      tensor instanceof PointerTensor &&
      objects.hasOwnProperty(tensor.idAtLocation);

    const allPointerTensorsExist = tensors => {
      let allExist = true;

      tensors.forEach(tensor => {
        if (!pointerTensorExists(tensor)) allExist = false;
      });

      return allExist;
    };

    // If the "self" is a PointerTensor and exists in objects
    // AND if the "args" either contains all existent PointerTensor(s) OR none at all
    // THEN we can execute the command (because we have all the values we need)
    if (
      pointerTensorExists(this.self) &&
      ((this.args.length > 0 && allPointerTensorsExist(this.args)) ||
        this.args.length === 0)
    ) {
      const command = torchToTF(this.command);
      const self = objects[this.self.idAtLocation];

      console.log(this.command, command);

      // If we're executing the command against itself only, let's roll
      if (this.args.length === 0) {
        return tf[command](self);
      }

      console.log('HEY', this.args);

      // Otherwise, we need to get the actual objects of each of the PointerTensors in args
      const args = [];
      this.args.forEach(arg => args.push(objects[arg.idAtLocation]));

      return tf[command](self, ...args);
    }

    return 'NOT ENOUGH INFO';
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
