// Types resued in others
export declare interface SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

////////////////
// Message Types
////////////////
export declare class Message implements SerdeSimplifiable {
  contents: Array<any>;

  serdeSimplify(f: any): string;
}

export declare class Operation extends Message {
  message: Message;
  returnIds: Array<number>;
  private _command: string;
  private _self: Operation;
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
  commandName: string;
  message: Message;
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
  start: number;
  end: number;
  step: number;

  serdeSimplify(f: any): string;
}

// Instead of using primitive "Set", we create an extenion which is SerdeSimplifiable
// Now this can be used where needed, or if we need primitive Set we can use that aswell
export declare class SerdeSimplifiableSet extends Set
  implements SerdeSimplifiable {
  serdeSimplify(f: any): string;
}

export declare class Slice implements SerdeSimplifiable {
  start: number;
  end: number;
  step: number;

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
  id: number;
  procedure: Procedure;
  state: State;
  includeState: boolean;
  inputShape: boolean;
  outputShape: Array<any>;
  name: string;
  tags: Array<string>;
  description: string;

  serdeSimplify(f: any): string;
}

export declare class Procedure implements SerdeSimplifiable {
  operations: Array<string>; // the array of (serialized) operations
  argIds: Array<number>; // the argument ids present in the operations
  resultIds: Array<number>; // the result ids present in the operations
  promiseOutId: number;

  serdeSimplify(f: any): string;
}

export declare class State implements SerdeSimplifiable {
  stateIds: Array<number>;
  tensors: Array<any>;

  serdeSimplify(f: any): string;
}

//////////////////////
// PointerTensor Types
//////////////////////

export declare class PointerTensor implements SerdeSimplifiable {
  id: number;
  idAtLocation: number;
  locationId: number;
  pointToAttr: any;
  shape: any;
  garbageCollectData: any;

  serdeSimplify(f: any): string;
}

/////////////////
// Protocol Types
/////////////////

export declare class Protocol implements SerdeSimplifiable {
  id: number;
  tags: Array<string>;
  description: string;
  plans: Array<Plan>;
  workersResolved: any;

  serdeSimplify(f: any): string;
}

//////////////
// Torch Types
//////////////

export declare class TorchTensor implements SerdeSimplifiable {
  id: number;
  bin: any;
  chain: any;
  gradChain: any;
  tags: Array<string>;
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
