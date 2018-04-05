import * as syft from '../../../syft'

/**
* A base-interface for Keras Layers to comply to.
*/
export interface Layer {
  syftLayer?: syft.Model
  inputShape?: number
  outputShape?: number
  orderedSyft: syft.Model[]

  create(): Promise<this>
}
