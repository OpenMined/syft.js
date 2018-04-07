import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class RMSprop implements Optimizer {
    syftOptim?: syft.RMSProp;
    hyperparameters: {
        lr: number;
        rho: number;
        epsilon: number;
        decay: number;
    };
    constructor({lr, rho, epsilon, decay}: {
        lr?: number;
        rho?: number;
        epsilon?: number;
        decay?: number;
    });
    compile(syftParams: syft.Tensor[]): Promise<void>;
}
