// Types resued in others
export declare interface SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

////////////////
// Message Types
////////////////
export declare class Message implements SerdeSimplifiable {
  contents: any;

  serdeSimplify(f: any): string;
}

export declare class Operation extends Message {
  message: any;
  returnIds: any;
  private _command: any;
  private _self: any;
  private _args: any;
  private _kwargs: any;

  serdeSimplify(f: any): string;
  execute(objects: any, logger: any): any;
}

export declare class ObjectMessage extends Message {}

export declare class ObjectRequestMessage extends Message {}

export declare class IsNoneMessage extends Message {}

export declare class GetShapeMessage extends Message {}

export declare class ForceObjectDeleteMessage extends Message {}

export declare class SearchMessage extends Message {}

export declare class PlanCommandMessage extends Message {
  commandName: any;
  message: any;
}

///////////////
// Native Types
///////////////
import TupleW from 'tuple-w';

export declare abstract class Dict extends Map implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

export declare class List extends Array implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

export declare class Range implements SerdeSimplifiable {
  start: Number;
  end: Number;
  step: Number;

  serdeSimplify(f: any): string;
}

// Instead of using primitive "Set", we create an extenion which is SerdeSimplifiable
// Now this can be used where needed, or if we need primitive Set we can use that aswell
export declare class SerdeSimplifiableSet extends Set
  implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

export declare class Slice implements SerdeSimplifiable {
  start: Number;
  end: Number;
  step: Number;

  serdeSimplify(f: any): string;
}

// Instead of using primitive "String", we create an extenion which is SerdeSimplifiable
// Now this can be used where needed, or if we need primitive Set we can use that aswell
export declare class SerdeSimplifiableString extends String
  implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

export declare class Tuple extends TupleW implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

/////////////
// Plan Types
/////////////
export declare class Plan implements SerdeSimplifiable {
  id: any;
  procedure: any;
  state: any;
  includeState: any;
  inputShape: any;
  outputShape: any;
  name: any;
  tags: any;
  description: any;

  serdeSimplify(f: any): string;
}

export declare class Procedure implements SerdeSimplifiable {
  operations: any;
  argIds: any;
  resultIds: any;
  promiseOutId: any;

  serdeSimplify(f: any): string;
}

export declare class State implements SerdeSimplifiable {
  stateIds: any;
  tensors: any;

  serdeSimplify(f: any): string;
}

//////////////////////
// PointerTensor Types
//////////////////////

export declare class PointerTensor implements SerdeSimplifiable {
  id: any;
  idAtLocation: any;
  locationId: any;
  pointToAttr: any;
  shape: any;
  garbageCollectData: any;

  serdeSimplify(f: any): string;
}

/////////////////
// Protocol Types
/////////////////

export declare class Protocol implements SerdeSimplifiable {
  id: any;
  tags: any;
  description: string;
  plans: any;
  workersResolved: any;

  serdeSimplify(f: any): string;
}

//////////////
// Torch Types
//////////////

export declare class TorchTensor implements SerdeSimplifiable {
  id: any;
  bin: any;
  chain: any;
  gradChain: any;
  tags: any;
  description: string;
  serializer: any;
  private _shape: Array<any>;
  private _type: any;
  private _value: any;
  private _tfTensor: any;

  serdeSimplify(f: any): string;
}

export declare class TorchSize implements SerdeSimplifiable {
  size: any;
  serdeSimplify(f: any): string;
}
