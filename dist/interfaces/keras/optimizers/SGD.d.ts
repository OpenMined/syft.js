import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class SGD implements Optimizer {
    syft_optim: syft.SGD;
    hyperparameters: any;
    constructor(hyperparameters: any);
    create(syft_params: syft.Tensor): Promise<void>;
}
