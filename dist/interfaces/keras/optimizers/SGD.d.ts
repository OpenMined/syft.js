import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class SGD implements Optimizer {
    syftOptim?: syft.SGD;
    hyperparameters: {
        lr: number;
        momentum: number;
        decay: number;
    };
    constructor({lr, momentum, decay}: {
        lr?: number;
        momentum?: number;
        decay?: number;
    });
    create(syftParams: syft.Tensor[]): Promise<void>;
}
