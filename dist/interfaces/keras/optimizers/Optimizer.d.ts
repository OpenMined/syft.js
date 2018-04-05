import * as syft from '../../../syft';
export interface Optimizer {
    syftOptim?: syft.Optimizer;
    create(params: syft.Tensor[]): Promise<void>;
}
