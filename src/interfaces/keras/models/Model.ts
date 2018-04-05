import * as syft from '../../../syft'

import { Layer } from '../layers'
import { Optimizer } from '../optimizers'

/**
* A base-interface for Keras Models to comply to.
*/
export interface Model {
  syftModel?: syft.Model
  loss?: syft.Model
  optimizer?: Optimizer
  inputShape?: number
  outputShape?: number
  layers: Layer[]
  metrics: string[]
  compiled: boolean

  compile(
    args: {
      loss: string,
      optimizer: Optimizer,
      metrics?: string[]
    }
  ): Promise<this>
}
