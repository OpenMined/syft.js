import { Tensor, FloatTensor, IntTensor, Model } from './syft';
export declare const verbose: boolean;
export declare function log(...args: any[]): void;
export declare function cmd(options: {
    [key: string]: any;
    functionCall: string;
    tensorIndexParams?: any[];
}): SocketCMD;
export declare function num_models(): Promise<any>;
export declare function load(filename: string): Promise<any>;
export declare function save(x: Tensor, filename: string): Promise<any>;
export declare function concatenate(tensors: Tensor[], axis?: number): Promise<any>;
export declare function num_tensors(): Promise<number>;
export declare function new_tensors_allowed(allowed?: boolean): Promise<boolean>;
export declare function sendJSON(message: SocketCMD, return_type?: string): Promise<string | number | boolean | FloatTensor | IntTensor | Tensor[] | Model[] | undefined>;
