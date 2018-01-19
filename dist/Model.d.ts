import { Optimizer } from './Optimizer';
import { Tensor, IntTensor, FloatTensor } from './Tensor';
import { AsyncInit, IAsyncInit } from './AsyncInit';
export declare class Model extends AsyncInit implements IAsyncInit {
    type: string;
    layerType: string;
    id?: string;
    params: boolean;
    outputShape?: string;
    static getModel(id: string): Promise<Sigmoid>;
    constructor(id?: string, params?: any[]);
    finish(id: string): void;
    feed(...args: any[]): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
    parameters(): Promise<Tensor[]>;
    num_parameters(): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
    models(): Promise<Model[]>;
    set_id(new_id: string): Promise<this>;
    fit(input: number[] | Tensor, target: number[] | Tensor, criterion: any, optim: any, batch_size: number, iters?: number, log_interval?: number, metrics?: never[], verbose?: boolean): Promise<number>;
    summary(verbose?: boolean, return_instead_of_print?: boolean): Promise<string | undefined>;
    length(): Promise<number>;
    activation(): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
    getLayerType(): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
    cmd(options: {
        [key: string]: any;
        functionCall: string;
        tensorIndexParams?: any[];
    }): SocketCMD;
    forward(...input: Tensor[]): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class Policy extends Model {
    layerType: string;
    stateType: string;
    optimizer?: Optimizer;
    model?: Model;
    constructor(id: string | undefined, model?: Model, optimizer?: Optimizer, stateType?: string);
    sample(...input: Tensor[]): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
    parameters(): Promise<Tensor[]>;
    feed(...args: any[]): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class Sequential extends Model {
    layerType: string;
    constructor(layers?: Model[]);
    add(model: Model): Promise<void>;
    summary(): Promise<string>;
}
export declare class Linear extends Model {
    layerType: string;
    constructor(id?: string, input_dim?: number, output_dim?: number, initializer?: string);
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
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class NLLLoss extends Model {
    layerType: string;
    constructor(id?: string);
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class CrossEntropyLoss extends Model {
    layerType: 'crossentropyloss';
    constructor(id?: string, dim?: number);
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
