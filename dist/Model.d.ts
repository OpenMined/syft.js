import { Optimizer } from './Optimizer';
import { Tensor, IntTensor, FloatTensor } from './Tensor';
import { AsyncInstance, IAsyncConstructor } from './AsyncClass';
export declare class Model extends AsyncInstance {
    type: string;
    layerType: string;
    params: boolean;
    outputShape?: number | string;
    protected static assertLayerType(a: string, b: Function): void;
    protected static newModel($: any, id: string, type: string): Model;
    static getModelType(id: string): Promise<string>;
    static getModel(id: string): Promise<Model>;
    static createModel(layerConstructor: Function, ...params: any[]): Promise<string>;
    feed(...args: any[]): Promise<any>;
    parameters(): Promise<Tensor[]>;
    num_parameters(): Promise<any>;
    models(): Promise<Model[]>;
    set_id(new_id: string): Promise<this>;
    fit(input: Tensor, target: Tensor, criterion: Model, optim: Optimizer, batch_size: number, iters?: number, log_interval?: number, metrics?: string[], verbose?: boolean): Promise<number>;
    length(): Promise<number>;
    activation(): Promise<any>;
    getLayerType(): Promise<any>;
    cmd(options: {
        [key: string]: any;
        functionCall: string;
        tensorIndexParams?: any[];
    }): SocketCMD;
    forward(...input: Tensor[]): Promise<any>;
}
export declare class Policy extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    stateType: string;
    optimizer?: Optimizer;
    model?: Model;
    static get(id: string): Promise<Policy>;
    static create(model: Model, optimizer: Optimizer, stateType?: string): Promise<Policy>;
    sample(...input: Tensor[]): Promise<any>;
    parameters(): Promise<Tensor[]>;
    feed(...args: any[]): Promise<any>;
}
export declare class Sequential extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Sequential>;
    static create(layers?: Model[]): Promise<Sequential>;
    add(model: Model): Promise<void>;
}
export declare class Linear extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Linear>;
    static create(input_dim?: number, output_dim?: number, initializer?: string): Promise<Linear>;
    finish(id: string): Promise<void>;
}
export declare class ReLU extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<ReLU>;
    static create(): Promise<ReLU>;
}
export declare class Dropout extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Dropout>;
    static create(rate?: number): Promise<Dropout>;
}
export declare class Sigmoid extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Sigmoid>;
    static create(): Promise<Sigmoid>;
}
export declare class Softmax extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Softmax>;
    static create(dim?: number): Promise<Softmax>;
}
export declare class LogSoftmax extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<LogSoftmax>;
    static create(dim?: number): Promise<LogSoftmax>;
}
export declare class Log extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Log>;
    static create(): Promise<Log>;
}
export declare class Tanh extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Tanh>;
    static create(): Promise<Tanh>;
}
export declare class MSELoss extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<MSELoss>;
    static create(): Promise<MSELoss>;
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class NLLLoss extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<NLLLoss>;
    static create(): Promise<NLLLoss>;
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class CrossEntropyLoss extends Model {
    static $: IAsyncConstructor;
    layerType: 'crossentropyloss';
    static get(id: string): Promise<CrossEntropyLoss>;
    static create(dim?: number): Promise<CrossEntropyLoss>;
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
export declare class Categorical_CrossEntropy extends Model {
    static $: IAsyncConstructor;
    layerType: 'categorical_crossentropy';
    static get(id: string): Promise<Categorical_CrossEntropy>;
    static create(): Promise<Categorical_CrossEntropy>;
    forward(input: Tensor, target: Tensor): Promise<string | number | boolean | any[] | FloatTensor | IntTensor | undefined>;
}
