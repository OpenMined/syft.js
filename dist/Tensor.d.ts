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
    asin(): Promise<any>;
    asin_(): Promise<any>;
    atan(): Promise<any>;
    atan_(): Promise<any>;
    __add__(x: Tensor): Promise<any>;
    __iadd__(x: Tensor): Promise<any>;
    backward(grad?: any): Promise<void>;
    ceil(): Promise<any>;
    ceil_(): Promise<any>;
    contiguous(): Promise<any>;
    copy(): Promise<any>;
    cos(): Promise<any>;
    cos_(): Promise<any>;
    cosh(): Promise<any>;
    cosh_(): Promise<any>;
    children(): Promise<never[]>;
    creation_op(): Promise<any>;
    creators(): Promise<never[]>;
    cumsum(dim?: number): Promise<any>;
    dataOnGpu(): Promise<boolean>;
    exp(): Promise<any>;
    exp_(): Promise<any>;
}
export declare class IntTensor extends Tensor {
    constructor(data: string | any[], data_is_pointer?: boolean);
}
export declare class FloatTensor extends Tensor {
    constructor(data: string | any[], autograd?: boolean, data_is_pointer?: boolean);
    autograd(setter: boolean): Promise<boolean | this>;
}
