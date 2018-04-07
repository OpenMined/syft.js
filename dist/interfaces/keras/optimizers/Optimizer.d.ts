import * as syft from '../../../syft';
export interface Optimizer {
    syftOptim?: syft.Optimizer;
    compile(params: syft.Tensor[]): Promise<void>;
}
