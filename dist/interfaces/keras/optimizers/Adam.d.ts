import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class Adam implements Optimizer {
    syftOptim?: syft.Adam;
    hyperparameters: {
        lr: number;
        beta1: number;
        beta2: number;
        epsilon: number;
        decay: number;
    };
    constructor({lr, beta1, beta2, epsilon, decay}: {
        lr?: number;
        beta1?: number;
        beta2?: number;
        epsilon?: number;
        decay?: number;
    });
    create(syftParams: syft.Tensor[]): Promise<void>;
}
