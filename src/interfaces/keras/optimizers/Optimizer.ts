import * as syft from '../../../syft'

export interface Optimizer {
  hyperparameters?: number[]
  syft_optim?: syft.Optimizer
  create(params: syft.Tensor[]): Promise<void>
}
