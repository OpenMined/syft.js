import * as syft from '../../../syft'

import { Optimizer } from '.'

/**
* Adam Optimizer.
*/
export class Adam implements Optimizer {
  /**
  * The underlying Syft Adam Optimizer.
  */
  syftOptim?: syft.Adam

  /**
  * Parameters used to create the underlying Syft Adam Optimizer.
  */
  hyperparameters: {
    lr: number
    beta1: number
    beta2: number
    epsilon: number
    decay: number
  }

  /**
  * Constructs a new Adam Optimizer.
  *
  * @param args.lr       TODO document this?
  * @param args.beta1    TODO document this?
  * @param args.beta2    TODO document this?
  * @param args.epsilon  TODO document this?
  * @param args.decay    TODO document this?
  *
  * @returns A new instance of Adam Optimizer.
  */
  constructor({
    lr = 0.01,
    beta1 = 0.9,
    beta2 = 0.999,
    epsilon = 1e-6,
    decay = 0
  }: {
    lr?: number
    beta1?: number
    beta2?: number
    epsilon?: number
    decay?: number
  }) {
    this.hyperparameters = {lr, beta1, beta2, epsilon, decay}
  }

  /**
  * Create and links a Syft Adam Optimizer.
  *
  * @param syftParams  The Syft Model parameters.
  */
  async create(
    syftParams: syft.Tensor[]
  ) {
    this.syftOptim = await syft.Optimizer.Adam.create({
      params: syftParams,
      ...this.hyperparameters
    })
  }
}
