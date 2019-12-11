import { SerdeSimplifiable } from '.';

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
