import * as syft from '../../../syft'

import { Optimizer } from '.'

export class Adam implements Optimizer {
  syft_optim?: syft.Adam
  hyperparameters: number[]

  constructor(
    lr = 0.01,
    beta_1 = 0.9,
    beta_2 = 0.999,
    epsilon = 1e-6,
    decay = 0
  ) {
    this.hyperparameters = [lr, beta_1, beta_2, epsilon, decay]
  }

  async create(
    syft_params: syft.Tensor[]
  ) {
    let self = this
    self.syft_optim = await syft.Optimizer.Adam.create(syft_params, ...self.hyperparameters)
  }
}
