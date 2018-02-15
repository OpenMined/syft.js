import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class Adam implements Optimizer {
    syft_optim?: syft.Adam;
    hyperparameters: number[];
    constructor(lr?: number, beta_1?: number, beta_2?: number, epsilon?: number, decay?: number);
    create(syft_params: syft.Tensor[]): Promise<void>;
}
