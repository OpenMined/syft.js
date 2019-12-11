import { SerdeSimplifiable } from '.';

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
