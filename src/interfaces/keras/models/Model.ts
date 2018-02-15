import * as syft from '../../../syft'

import { Layer } from '../layers'
import { Optimizer } from '../optimizers'

export interface Model {
  syft_model?: syft.Model
  loss?: syft.Model
  optimizer?: Optimizer
  input_shape?: number
  output_shape?: number
  layers: Layer[]
  metrics: string[]
  compiled: boolean

  compile(
    loss: string,
    optimizer: any,
    metrics: string[]
  ): Promise<this>
}
