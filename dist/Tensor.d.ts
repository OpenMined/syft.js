export declare class Tensor {
    __error__: Error;
    __ready__: boolean;
    __waits__: {
        res: () => void;
        rej: () => void;
    }[];
    id: string;
    data: Float64Array | Int32Array;
    data_is_pointer: boolean;
    type: string;
    constructor(data: string | any[], data_is_pointer?: boolean);
    __finish__(res: string): void;
    ready(): Promise<void>;
    autograd(): Promise<void>;
    shape(): Promise<number[]>;
    params_func(name: string, params: any[], return_response?: boolean, return_type?: string): Promise<any>;
    no_params_func(name: string, return_response?: boolean, return_type?: string): Promise<any>;
    get(param_name?: string, response_as_tensor?: boolean, return_type?: string): Promise<any>;
    protected cmd(functionCall: string, tensorIndexParams?: any[]): {
        'functionCall': string;
        'objectType': string;
        'objectIndex': string;
        'tensorIndexParams': any[];
    };
    is_contiguous(): Promise<boolean>;
    to_numpy(): Promise<"" | " - non-contiguous - ">;
    __repr__(verbose?: boolean): Promise<string>;
}
export declare class IntTensor extends Tensor {
}
export declare class FloatTensor extends Tensor {
}
