import * as syft from '../../../syft'

/**
* A base-interface for Keras Optimizers to comply to.
*/
export interface Optimizer {
  syftOptim?: syft.Optimizer
  create(params: syft.Tensor[]): Promise<void>
}
