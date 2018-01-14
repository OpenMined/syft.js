import { Optimizer } from './Optimizer';
import { Tensor } from './Tensor';
import { AsyncInit, IAsyncInit } from './AsyncInit';
export declare class Model extends AsyncInit implements IAsyncInit {
    type: string;
    layerType: string;
    id?: string;
    params: boolean;
    outputShape?: string;
    static getModel(id: string): Promise<any>;
    constructor(id?: string, params?: any[]);
    finish(id: string): void;
    __call__(...args: any[]): Promise<any>;
    parameters(): Promise<any>;
    num_parameters(): Promise<any>;
    models(): Promise<any>;
    set_id(new_id: string): Promise<this>;
    fit(input: number[] | Tensor, target: number[] | Tensor, criterion: any, optim: any, batch_size: number, iters?: number, log_interval?: number, metrics?: never[], verbose?: boolean): Promise<number>;
    summary(verbose?: boolean, return_instead_of_print?: boolean): Promise<string | undefined>;
    __len__(): Promise<any>;
    __getitem__(idx: number): Promise<any>;
    activation(): Promise<any>;
    getLayerType(): Promise<any>;
    cmd(function_call: string, params?: any[]): {
        functionCall: string;
        objectType: string;
        objectIndex: string | undefined;
        tensorIndexParams: any[];
    };
    forward(input: Tensor): Promise<any>;
    __repr__(verbose?: boolean): Promise<string>;
}
export declare class Policy extends Model {
    layerType: string;
    stateType: any;
    optimizer: Optimizer;
    constructor(model: any, optimizer: Optimizer, stateType?: string);
    sample(input: Tensor): Promise<any>;
    parameters(): Promise<any>;
    __call__(...args: any[]): Promise<any>;
    history(): Promise<(Tensor | undefined)[][]>;
}
export declare class Sequential extends Model {
    layerType: string;
    constructor(layers?: Model[]);
    add(model: Model): Promise<void>;
    summary(): Promise<void>;
    __repr__(): Promise<string>;
    __getitem__(idx: number): Promise<any>;
}
export declare class Linear extends Model {
    layerType: string;
    constructor(input_dim?: number, output_dim?: number, id?: string, initializer?: string);
    finish(id: string): Promise<void>;
}
export declare class ReLU extends Model {
    layerType: string;
    constructor(id?: string);
}
export declare class Dropout extends Model {
    layerType: string;
    constructor(id?: string, rate?: number);
}
export declare class Sigmoid extends Model {
    layerType: string;
    constructor(id?: string);
}
export declare class Softmax extends Model {
    layerType: string;
    constructor(id?: string, dim?: number);
}
export declare class LogSoftmax extends Model {
    layerType: string;
    constructor(id?: string, dim?: number);
}
export declare class Log extends Model {
    layerType: string;
    constructor(id?: string);
}
export declare class Tanh extends Model {
    layerType: string;
    constructor(id?: string);
}
export declare class MSELoss extends Model {
    layerType: string;
    constructor(id?: string);
    forward(input: Tensor, target: Tensor): Promise<any>;
}
export declare class NLLLoss extends Model {
    layerType: string;
    constructor(id?: string);
    forward(input: Tensor, target: Tensor): Promise<any>;
}
export declare class CrossEntropyLoss extends Model {
    layerType: 'crossentropyloss';
    constructor(id?: string, dim?: number);
    forward(input: Tensor, target: Tensor): Promise<any>;
}
