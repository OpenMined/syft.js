import { unbufferize } from '../protobuf';
import Logger from '../logger';

/**
 * Message enables comunicating between PySyft and Syft workers.
 * Message is the parent class to all other Message types.
 *
 * All Message types are currently are currently not in use.
 *
 * @property {*} contents - For storing unbufferized message data.
 * @property {Logger} logger - For logging information.
 */
export class Message {
  constructor(contents) {
    if (contents) {
      this.contents = contents;
    }
    this.logger = new Logger();
  }
}

/**
 * ObjectMessage is used to send an object as message between PySyft and Syft workers.
 * @extends Message
 */
export class ObjectMessage extends Message {
  constructor(contents) {
    super(contents);
  }

  /**
   * Unbufferizes and maps data from protobuf object to JS object.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments when messaging with PySyft.
   * @param {protobuf.syft_proto.messaging.v1.ObjectMessage} pb - Protobuf object.
   * @returns {ObjectMessage}
   */
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
