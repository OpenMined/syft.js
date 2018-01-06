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
    autograd(state: boolean): Promise<void>;
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
    abs(): Promise<any>;
    abs_(): Promise<any>;
    acos(): Promise<any>;
    acos_(): Promise<any>;
    addmm_(x: Tensor, y: Tensor): Promise<any>;
    addmm(x: Tensor, y: Tensor): Promise<any>;
    addmv_(x: Tensor, y: Tensor): Promise<any>;
    addmv(x: Tensor, y: Tensor): Promise<any>;
}
export declare class IntTensor extends Tensor {
    constructor(data: string | any[], data_is_pointer?: boolean);
}
export declare class FloatTensor extends Tensor {
    constructor(data: string | any[], autograd?: boolean, data_is_pointer?: boolean);
}
