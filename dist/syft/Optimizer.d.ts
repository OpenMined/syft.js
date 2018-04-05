import { AsyncInstance, IAsyncConstructor } from '../lib';
export declare class Optimizer extends AsyncInstance {
    type: string;
    optimizerType: string;
    static createOptomizer(optimizerType: Function, params?: any[], hyperParams?: any[]): Promise<string>;
    zeroGrad(): Promise<any>;
    step(batchSize: number, iteration: number): Promise<any>;
    cmd(options: {
        [key: string]: any;
        functionCall: string;
        tensorIndexParams?: any[];
    }): SocketCMD;
    static SGD: SGDConstructor;
    static RMSProp: RMSPropConstructor;
    static Adam: AdamConstructor;
}
export interface SGDConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): SGD;
    get(id: string): Promise<SGD>;
    create(args: {
        params: any[];
        lr?: number;
        momentum?: number;
        decay?: number;
    }): Promise<SGD>;
}
export interface RMSPropConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): RMSProp;
    get(id: string): Promise<RMSProp>;
    create(args: {
        params: any[];
        lr?: number;
        rho?: number;
        epsilon?: number;
        decay?: number;
    }): Promise<RMSProp>;
}
export interface AdamConstructor extends IAsyncConstructor {
    new ($caller$: any, id: string): Adam;
    get(id: string): Promise<Adam>;
    create(args: {
        params: any[];
        lr?: number;
        beta1?: number;
        beta2?: number;
        epsilon?: number;
        decay?: number;
    }): Promise<Adam>;
}
export declare class SGD extends Optimizer {
    static $: IAsyncConstructor;
    static create({params, lr, momentum, decay}: {
        params: any[];
        lr?: number;
        momentum?: number;
        decay?: number;
    }): Promise<SGD>;
    static get(id: string): Promise<SGD>;
}
export declare class RMSProp extends Optimizer {
    static $: IAsyncConstructor;
    static create({params, lr, rho, epsilon, decay}: {
        params: any[];
        lr?: number;
        rho?: number;
        epsilon?: number;
        decay?: number;
    }): Promise<RMSProp>;
    static get(id: string): Promise<RMSProp>;
}
export declare class Adam extends Optimizer {
    static $: IAsyncConstructor;
    static create({params, lr, beta1, beta2, epsilon, decay}: {
        params: any[];
        lr?: number;
        beta1?: number;
        beta2?: number;
        epsilon?: number;
        decay?: number;
    }): Promise<Adam>;
    static get(id: string): Promise<Adam>;
}
