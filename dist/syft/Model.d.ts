import { AsyncInstance, IAsyncConstructor } from '../lib';
import { Optimizer } from './Optimizer';
import { Tensor } from './Tensor';
export declare class Model extends AsyncInstance {
    type: string;
    layerType: string;
    outputShape?: number | string;
    protected static assertLayerType(layerType: string, modelConstructor: Function): void;
    protected static newModel($: any, id: string, type: string): Model;
    static getModelType(id: string): Promise<string>;
    static getModel(id: string): Promise<Model>;
    static createModel(layerConstructor: Function, ...params: any[]): Promise<string>;
    feed(...args: any[]): Promise<any>;
    parameters(): Promise<Tensor[]>;
    numParameters(): Promise<any>;
    models(): Promise<Model[]>;
    set_id(new_id: string): Promise<this>;
    fit({input, target, criterion, optimizer, batchSize, iterations, logInterval, metrics, verbose}: {
        input: Tensor;
        target: Tensor;
        criterion: Model;
        optimizer: Optimizer;
        batchSize: number;
        iterations?: number;
        logInterval?: number;
        metrics?: string[];
        verbose?: boolean;
    }): Promise<number>;
    length(): Promise<number>;
    activation(): Promise<any>;
    getLayerType(): Promise<any>;
    protected cmd(options: {
        [key: string]: any;
        functionCall: string;
        tensorIndexParams?: any[];
    }): SocketCMD;
    forward(...input: Tensor[]): Promise<any>;
    static Policy: PolicyConstructor;
    static Sequential: SequentialConstructor;
    static Linear: LinearConstructor;
    static ReLU: ReLUConstructor;
    static Dropout: DropoutConstructor;
    static Sigmoid: SigmoidConstructor;
    static Softmax: SoftmaxConstructor;
    static LogSoftmax: LogSoftmaxConstructor;
    static Log: LogConstructor;
    static Tanh: TanhConstructor;
    static MSELoss: MSELossConstructor;
    static NLLLoss: NLLLossConstructor;
    static CrossEntropyLoss: CrossEntropyLossConstructor;
    static Categorical_CrossEntropy: Categorical_CrossEntropyConstructor;
}
export interface PolicyConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Policy;
    get(id: string): Promise<Policy>;
    create(...args: any[]): Promise<Policy>;
}
export interface SequentialConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Sequential;
    get(id: string): Promise<Sequential>;
    create(...args: any[]): Promise<Sequential>;
}
export interface LinearConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Linear;
    get(id: string): Promise<Linear>;
    create(...args: any[]): Promise<Linear>;
}
export interface ReLUConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): ReLU;
    get(id: string): Promise<ReLU>;
    create(...args: any[]): Promise<ReLU>;
}
export interface DropoutConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Dropout;
    get(id: string): Promise<Dropout>;
    create(...args: any[]): Promise<Dropout>;
}
export interface SigmoidConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Sigmoid;
    get(id: string): Promise<Sigmoid>;
    create(...args: any[]): Promise<Sigmoid>;
}
export interface SoftmaxConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Softmax;
    get(id: string): Promise<Softmax>;
    create(...args: any[]): Promise<Softmax>;
}
export interface LogSoftmaxConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): LogSoftmax;
    get(id: string): Promise<LogSoftmax>;
    create(...args: any[]): Promise<LogSoftmax>;
}
export interface LogConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Log;
    get(id: string): Promise<Log>;
    create(...args: any[]): Promise<Log>;
}
export interface TanhConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Tanh;
    get(id: string): Promise<Tanh>;
    create(...args: any[]): Promise<Tanh>;
}
export interface MSELossConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): MSELoss;
    get(id: string): Promise<MSELoss>;
    create(...args: any[]): Promise<MSELoss>;
}
export interface NLLLossConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): NLLLoss;
    get(id: string): Promise<NLLLoss>;
    create(...args: any[]): Promise<NLLLoss>;
}
export interface CrossEntropyLossConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): CrossEntropyLoss;
    get(id: string): Promise<CrossEntropyLoss>;
    create(...args: any[]): Promise<CrossEntropyLoss>;
}
export interface Categorical_CrossEntropyConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Categorical_CrossEntropy;
    get(id: string): Promise<Categorical_CrossEntropy>;
    create(...args: any[]): Promise<Categorical_CrossEntropy>;
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
    static create({inputDim, outputDim, initializer}: {
        inputDim?: number;
        outputDim: number;
        initializer?: string;
    }): Promise<Linear>;
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
    forward(input: Tensor, target: Tensor): Promise<any>;
}
export declare class NLLLoss extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<NLLLoss>;
    static create(): Promise<NLLLoss>;
    forward(input: Tensor, target: Tensor): Promise<any>;
}
export declare class CrossEntropyLoss extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<CrossEntropyLoss>;
    static create(dim?: number): Promise<CrossEntropyLoss>;
    forward(input: Tensor, target: Tensor): Promise<any>;
}
export declare class Categorical_CrossEntropy extends Model {
    static $: IAsyncConstructor;
    layerType: string;
    static get(id: string): Promise<Categorical_CrossEntropy>;
    static create(): Promise<Categorical_CrossEntropy>;
    forward(input: Tensor, target: Tensor): Promise<any>;
}
