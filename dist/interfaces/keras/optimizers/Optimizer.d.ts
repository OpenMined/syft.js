import * as syft from '../../../syft';
export interface Optimizer {
    hyperparameters: any[];
    syft_optim: syft.Optimizer;
}
