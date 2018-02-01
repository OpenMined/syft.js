import * as syft from '../../../syft'

import { Optimizer } from '.'

export class SGD implements Optimizer {
  syft_optim: syft.SGD
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
    self.syft_optim = await syft.Optimizer.SGD.create(syft_params, self.hyperparameters)
  }
}
