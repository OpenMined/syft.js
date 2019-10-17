import { default as proto } from '../proto';

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
    this.returnIds = returnIds;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.message.Operation'];
    return `(${TYPE}, (${this.type}, (${f(this.message)}, ${f(this.returnIds)})))`; // prettier-ignore
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
