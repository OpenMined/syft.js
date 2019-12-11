import TupleW from 'tuple-w';
import { SerdeSimplifiable } from '.';

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
