import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class RMSprop implements Optimizer {
    syft_optim?: syft.RMSProp;
    hyperparameters: number[];
    constructor(lr?: number, rho?: number, epsilon?: number, decay?: number);
    create(syft_params: syft.Tensor[]): Promise<void>;
}
