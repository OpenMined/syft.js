// TODO: make syft.Optimizer.RMSprop
import * as syft from '../../../syft'

import { Optimizer } from '.'

export class RMSprop implements Optimizer {
  syft_optim?: syft.RMSProp
  hyperparameters: number[]


  constructor(
    lr = 0.01,
    rho = 0.9,
    epsilon = 1e-6,
    decay = 0
  ) {
    this.hyperparameters = [lr, rho, epsilon, decay]
  }

  async create(
    syft_params: syft.Tensor[]
  ) {
    let self = this
    self.syft_optim = await syft.Optimizer.RMSProp.create(syft_params, ...self.hyperparameters)
  }
}
