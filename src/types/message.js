import { unbufferize } from '../protobuf';
import Logger from '../logger';

export class Message {
  constructor(contents) {
    if (contents) {
      this.contents = contents;
    }
    this.logger = new Logger();
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
