import * as syft from '../../../syft'

export class _Dense {
  // sometimes keras has single layers that actually correspond
  // to multiple syft layers - so they end up getting stored in
  // an ordered list called "ordered_syft"
  ordered_syft: syft.Model[] = []

  syft_model: syft.Model
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
  static async create(
    units: number,
    input_shape?: number,
    activation?: string
  ) {
    let model = new this(units, input_shape, activation)

    model.syft_model = await syft.Model.Linear.create(
      model.input_shape,
      model.units
    )
    model.ordered_syft.push(model.syft_model)

    if (model.activation_str != null && model.activation_str != "linear") {
      if (model.activation_str == 'relu') {
        model.syft_activation = await syft.Model.ReLU.create()
      } else if (model.activation_str == 'softmax') {
        model.syft_activation = await syft.Model.Softmax.create()
      } else if (model.activation_str == 'sigmoid') {
        model.syft_activation = await syft.Model.Sigmoid.create()
      } else if (model.activation_str == 'tanh') {
        model.syft_activation = await syft.Model.Tanh.create()
      }
    }

    if (model.syft_activation) {
      model.ordered_syft.push(model.syft_activation)
    }

    return model
  }
}

export async function Dense(
  units: number,
  input_shape?: number,
  activation?: string
) {
  return _Dense.create(units, input_shape, activation)
}
