import * as syft from '../../../syft'

import { Optimizer } from '.'

export class Adam implements Optimizer {
  syft_optim: syft.Adam
  hyperparameters: any


  constructor(
    hyperparameters: any
  ) {
    let self = this
    self.hyperparameters = hyperparameters
  }

  async create(
    syft_params: syft.Tensor
  ) {
    let self = this
    self.syft_optim = await syft.Optimizer.Adam.create(syft_params, self.hyperparameters)
  }
}
