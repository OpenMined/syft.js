import { AsyncInstance, IAsyncConstructor } from './AsyncClass';
export declare class Optimizer extends AsyncInstance {
    id: string;
    type: 'Optimizer';
    optimizer_type: string;
    static createOptomizer(optimizer_type: Function, params?: any[], hyperParams?: any[]): Promise<string>;
    finish(id: string): void;
    zero_grad(): Promise<any>;
    step(batch_size: number, iteration: number): Promise<any>;
    cmd(options: {
        [key: string]: any;
        functionCall: string;
        tensorIndexParams?: any[];
    }): SocketCMD;
}
export declare class SGD extends Optimizer {
    static $: IAsyncConstructor;
    static create(params: any[], lr?: number, momentum?: number, decay?: number): Promise<SGD>;
    static get(id: string): Promise<SGD>;
}
export declare class RMSProp extends Optimizer {
    static $: IAsyncConstructor;
    static create(params: any[], lr?: number, rho?: number, epsilon?: number, decay?: number): Promise<RMSProp>;
    static get(id: string): Promise<RMSProp>;
}
export declare class Adam extends Optimizer {
    static $: IAsyncConstructor;
    static create(params: any[], lr?: number, beta_1?: number, beta_2?: number, epsilon?: number, decay?: number): Promise<Adam>;
    static get(id: string): Promise<Adam>;
}
