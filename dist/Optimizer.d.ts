import { AsyncInit, IAsyncInit } from './AsyncInit';
export declare class Optimizer extends AsyncInit implements IAsyncInit {
    id: string;
    type: string;
    optimizer_type: string;
    constructor(id?: string, optimizer_type?: string, params?: any[], h_params?: any[]);
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
    constructor(params: any[], lr?: number, momentum?: number, decay?: number);
}
export declare class RMSProp extends Optimizer {
    constructor(params: any[], lr?: number, rho?: number, epsilon?: number, decay?: number);
}
export declare class Adam extends Optimizer {
    constructor(params: any[], lr?: number, beta_1?: number, beta_2?: number, epsilon?: number, decay?: number);
}
