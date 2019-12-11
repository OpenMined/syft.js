import { SerdeSimplifiable } from '.';

export declare class Protocol implements SerdeSimplifiable {
  id: any;
  tags: any;
  description: string;
  plans: any;
  workersResolved: any;

  serdeSimplify(f: any): string;
}
