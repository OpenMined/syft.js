import * as syft from '../../../syft'

import { Optimizer } from '.'

/**
* SGD Optimizer
*/
export class SGD implements Optimizer {
  /**
  * The underlying Syft SGD Optimizer.
  */
  syftOptim?: syft.SGD

  /**
  * Parameters used to create the underlying Syft SGD Optimizer.
  */
  hyperparameters: {
    lr: number
    momentum: number
    decay: number
  }

  /**
  * Constructs a new SGD Optimizer.
  *
  * @param args.lr        TODO document this?
  * @param args.momentum  TODO document this?
  * @param args.decay     TODO document this?
  *
  * @returns A new instance of SGD Optimizer.
  */
  constructor({
    lr = 0.01,
    momentum = 0,
    decay = 0
  }: {
    lr?: number
    momentum?: number
    decay?: number
  }) {
    this.hyperparameters = {lr, momentum, decay}
  }

  /**
  * Create and links a Syft SGD Optimizer.
  *
  * @param syftParams  The Syft Model parameters.
  */
  async create(
    syftParams: syft.Tensor[]
  ) {
    this.syftOptim = await syft.Optimizer.SGD.create({
      params: syftParams,
      ...this.hyperparameters
    })
  }
}
