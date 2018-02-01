import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class Adam implements Optimizer {
    syft_optim: syft.Adam;
    hyperparameters: any;
    constructor(hyperparameters: any);
    create(syft_params: syft.Tensor): Promise<void>;
}
