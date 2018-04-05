import * as syft from '../../../syft'

import { Optimizer } from '.'

/**
* RMSprop Optimizer
*/
export class RMSprop implements Optimizer {
  /**
  * The underlying Syft RMSprop Optimizer.
  */
  syftOptim?: syft.RMSProp

  /**
  * Parameters used to create the underlying Syft RMSprop Optimizer.
  */
  hyperparameters: {
    lr: number
    rho: number
    epsilon: number
    decay: number
  }

  /**
  * Constructs a new RMSprop Optimizer.
  *
  * @param args.lr       TODO document this?
  * @param args.rho      TODO document this?
  * @param args.epsilon  TODO document this?
  * @param args.decay    TODO document this?
  *
  * @returns A new instance of RMSprop Optimizer.
  */
  constructor({
    lr = 0.01,
    rho = 0.9,
    epsilon = 1e-6,
    decay = 0
  }: {
    lr?:number
    rho?:number
    epsilon?:number
    decay?:number
  }) {
    this.hyperparameters = {lr, rho, epsilon, decay}
  }

  /**
  * Create and links a Syft RMSprop Optimizer.
  *
  * @param syftParams  The Syft Model parameters.
  */
  async create(
    syftParams: syft.Tensor[]
  ) {
    this.syftOptim = await syft.Optimizer.RMSProp.create({
      params: syftParams,
      ...this.hyperparameters
    })
  }
}
