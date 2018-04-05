import { Tensor, FloatTensor, Model } from './syft';
export declare const verbose: boolean;
export declare function log(...args: any[]): void;
export declare function cmd(options: {
    [key: string]: any;
    functionCall: string;
    tensorIndexParams?: any[];
}): SocketCMD;
export declare function numModels(): Promise<any>;
export declare function load(filename: string): Promise<any>;
export declare function save(x: Tensor, filename: string): Promise<boolean>;
export declare function concatenate(tensors: Tensor[], axis?: number): Promise<any>;
export declare function numTensors(): Promise<number>;
export declare function newTensorsAllowed(allowed?: boolean): Promise<boolean>;
export declare function sendJSON(message: SocketCMD, returnType?: string): Promise<string | number | boolean | FloatTensor | Tensor[] | Model[] | undefined>;
