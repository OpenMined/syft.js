import * as syft from '../../../syft';
import { Optimizer } from '.';
export declare class SGD implements Optimizer {
    syft_optim?: syft.SGD;
    hyperparameters: number[];
    constructor(lr?: number, momentum?: number, decay?: number);
    create(syft_params: syft.Tensor[]): Promise<void>;
}
