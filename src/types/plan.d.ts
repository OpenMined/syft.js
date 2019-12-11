import { SerdeSimplifiable } from '.';

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
