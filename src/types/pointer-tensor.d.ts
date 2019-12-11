import { SerdeSimplifiable } from '.';

export declare class PointerTensor implements SerdeSimplifiable {
  id: any;
  idAtLocation: any;
  locationId: any;
  pointToAttr: any;
  shape: any;
  garbageCollectData: any;

  serdeSimplify(f: any): string;
}
