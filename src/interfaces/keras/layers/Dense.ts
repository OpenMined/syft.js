import * as syft from '../../../syft'

import { Layer } from './Layer'

export class Dense implements Layer {
  // sometimes keras has single layers that actually correspond
  // to multiple syft layers - so they end up getting stored in
  // an ordered list called 'ordered_syft'
  ordered_syft: syft.Model[] = []

  syft_layer: syft.Model
  units: number
  input_shape?: number
  output_shape?: number
  activation?: syft.Tensor
  activation_str?: string
  syft_activation?: syft.Model

  constructor(
    units: number,
    input_shape?: number,
    activation?: string
  ) {
    let self = this

    self.units = units
    self.input_shape = input_shape
    self.output_shape = self.units
    self.activation_str = activation
  }

  async create() {
    let self = this

    self.syft_layer = await syft.Model.Linear.create(
      self.input_shape,
      self.units
    )
    self.ordered_syft.push(self.syft_layer)

    if (self.activation_str != null && self.activation_str !== 'linear') {
      if (self.activation_str === 'relu') {
        self.syft_activation = await syft.Model.ReLU.create()
      } else if (self.activation_str === 'softmax') {
        self.syft_activation = await syft.Model.Softmax.create()
      } else if (self.activation_str === 'sigmoid') {
        self.syft_activation = await syft.Model.Sigmoid.create()
      } else if (self.activation_str === 'tanh') {
        self.syft_activation = await syft.Model.Tanh.create()
      }
    }

    if (self.syft_activation) {
      self.ordered_syft.push(self.syft_activation)
    }

    return self
  }
}
