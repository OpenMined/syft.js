import * as syft from '../../../syft'

import { Layer } from './Layer'

/**
* Dense Layer
*/
export class Dense implements Layer {
  /**
  * sometimes keras has single layers that actually correspond
  * to multiple syft layers - so they end up getting stored in
  * an ordered list called 'orderedSyft'
  */
  orderedSyft: syft.Model[] = []

  /**
  * The underlying Syft Model.
  */
  syftLayer?: syft.Model

  /**
  * The number of inputs.
  */
  inputShape?: number

  /**
  * The number of outputs.
  */
  outputShape: number

  /**
  * The name of the activation function for the Layer.
  */
  activationStr?: string

  /**
  * The underlying Syft Model used for activation.
  */
  syftActivation?: syft.Model

  /**
  * Constructs a new Dense Layer.
  *
  * @param args.activation   The name of the activation function for the Layer.
  * @param args.inputShape   The number of inputs.
  * @param args.outputShape  The number of outputs.
  *
  * @returns A new instance of Dense Layer.
  */
  constructor({
      activation,
      inputShape,
      outputShape
    }: {
      activation: string
      inputShape?: number
      outputShape: number
    }) {
    this.activationStr = activation
    this.inputShape = inputShape
    this.outputShape = outputShape
  }

  /**
  * Compile and links a Syft Models.
  */
  async compile() {
    console.log(this)
    this.syftLayer = await syft.Model.Linear.create({
      inputDim: this.inputShape,
      outputDim: this.outputShape
    })

    this.orderedSyft.push(this.syftLayer)

    if (this.activationStr != null && this.activationStr !== 'linear') {
      if (this.activationStr === 'relu') {
        this.syftActivation = await syft.Model.ReLU.create()
      } else if (this.activationStr === 'softmax') {
        this.syftActivation = await syft.Model.Softmax.create()
      } else if (this.activationStr === 'sigmoid') {
        this.syftActivation = await syft.Model.Sigmoid.create()
      } else if (this.activationStr === 'tanh') {
        this.syftActivation = await syft.Model.Tanh.create()
      }

      if (this.syftActivation) {
        this.orderedSyft.push(this.syftActivation)
      }
    }

    return this
  }
}
