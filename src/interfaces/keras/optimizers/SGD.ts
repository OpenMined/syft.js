import * as syft from '../../../syft'

import { Optimizer } from '.'

export class SGD implements Optimizer {
  syft_optim?: syft.SGD
  hyperparameters: number[]


  constructor(
    lr = 0.01,
    momentum = 0,
    decay = 0
  ) {
    this.hyperparameters = [lr, momentum, decay]
  }

  async create(
    syft_params: syft.Tensor[]
  ) {
    let self = this
    self.syft_optim = await syft.Optimizer.SGD.create(syft_params, ...self.hyperparameters)
  }
}
