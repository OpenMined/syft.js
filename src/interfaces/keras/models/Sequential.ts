import * as syft from '../../../syft'
import { Layer } from '../layers'
import { Optimizer } from '../optimizers'
import { Model } from '.'

/**
* Sequential Model.
*/
export class Sequential implements Model {
  /**
  * The underlying Syft Sequential Model.
  */
  syftModel?: syft.Sequential

  /**
  * The underlying Syft Model used for loss.
  */
  loss?: syft.Model

  /**
  * The Optimizer for fitting/training.
  */
  optimizer?: Optimizer

  /**
  * An array of sub-Layers in this model.
  */
  layers: Layer[] = []

  /**
  * TODO document this?
  */
  metrics: string[] = []

  /**
  * Boolean tells whether the Model has been compiled.
  */
  compiled = false

  /**
  * Constructs a new Sequential Model.
  *
  * @param layers  An array of Layers.
  *
  * @returns A new instance of Sequential Model.
  */
  constructor(
    layers: Layer[] = []
  ) {
    for (let layer of layers) {
      this.add(layer)
    }
  }

  /**
  * Adds a Layer to this Sequential Model.
  *
  * @param layer  A Layers.
  *
  * @returns  This Sequential Model.
  */
  async add(
    layer: Layer
  ) {
    if (this.compiled) {
      throw new Error('CANNOT add layers after model has been compiled.')
    }

    if (this.layers.length > 0) {
      // look to the previous layer to get the input shape for this layer
      layer.inputShape = this.layers[ this.layers.length - 1 ].outputShape

      // if layer doesn't know its output shape - it's probably dynamic
      if (layer.outputShape == null) {
        layer.outputShape = layer.inputShape
      }
    }

    this.layers.push(layer)

    return this
  }

  /**
  * Compiles this Sequential Model.
  *
  * @param args.loss       TODO document this?
  * @param args.optimizer  TODO document this?
  * @param args.metrics    TODO document this?
  *
  * @returns  This Sequential Model.
  */
  async compile({
    loss,
    optimizer,
    metrics = []
  }: {
    loss: string,
    optimizer: Optimizer,
    metrics?: string[]
  }) {
    if (!this.compiled) {
      this.compiled = true
      this.syftModel = await syft.Model.Sequential.create()

      // sometimes keras has single layers that actually correspond
      // to multiple syft layers - so they end up getting stored in
      // an ordered list called 'orderedSyft'
      for (let layer of this.layers) {
        for (let l of layer.orderedSyft) {
          await layer.create()
          this.syftModel.add(l)
        }
      }

      if (loss === 'categorical_crossentropy') {
        this.loss = await syft.Model.Categorical_CrossEntropy.create()
      } else if (loss === 'meanSquared_error') {
        this.loss = await syft.Model.MSELoss.create()
      }
      await optimizer.create(await this.syftModel.parameters())

      this.optimizer = optimizer
      this.metrics = metrics
    } else {
      console.warn('Warning: Model already compiled... please rebuild from scratch if you need to change things')
    }

    return this
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async summary() {
    // TODO: this.syftModel.summary()
  }

  /**
  * Fits/Trains this Sequential Model.
  *
  * @param args.input           Input dataset for training.
  * @param args.target          Labels for input dataset.
  * @param args.batchSize       Number of samples to use per training batch.
  * @param args.epochs          Number of times to go over the entire training dataset.
  * @param args.validationData  TODO document this?
  * @param args.logInterval     How often to log status updates while training.
  * @param args.verbose         Whether to log status updates while training.
  *
  * @returns  The final loss after fitting/training.
  */
  async fit({
    input,
    target,
    batchSize,
    epochs = 1,
    validationData,
    logInterval = 1,
    verbose = false
  }: {
    input: syft.Tensor
    target: syft.Tensor
    batchSize: number
    epochs?: number
    validationData?: any
    logInterval?: number
    verbose?: boolean
  }) {
    if (
      this.syftModel == null ||
      this.loss == null ||
      this.optimizer == null ||
      this.optimizer.syftOptim == null
    ) {
      throw new Error('Not Compiled')
    }

    return this.syftModel.fit({
      input,
      target,
      criterion: this.loss,
      optimizer: this.optimizer.syftOptim,
      batchSize,
      iterations: epochs,
      logInterval,
      metrics: this.metrics,
      verbose
    })
  }

  /**
  * TODO document this?
  *
  * @param args.testInput   TODO document this?
  * @param args.testTarget  TODO document this?
  * @param args.batchSize   TODO document this?
  * @param args.metrics     TODO document this?
  * @param args.verbose     TODO document this?
  *
  * @returns  TODO document this?
  */
  async evaluate({
    testInput,
    testTarget,
    batchSize,
    metrics = [],
    verbose = false
  }: {
    testInput: syft.Tensor
    testTarget: syft.Tensor
    batchSize: number
    metrics?: string[]
    verbose?: boolean
  }) {
    // TODO:
    // return this.syftModel.evaluate(
    //   testInput,
    //   testTarget,
    //   this.loss,
    //   metrics=metrics,
    //   verbose=verbose,
    //   batchSize=batchSize
    // )
  }

  /**
  * TODO document this?
  *
  * @param x   TODO document this?
  *
  * @returns  TODO document this?
  */
  async predict(
    x: syft.Tensor
  ) {
    // if (type(x) === list):
    // x = np.array(x).astype('float')
    // if (type(x) === np.array or type(x) === np.ndarray):
    // x = FloatTensor(x, autograd=true, deleteAfterUse=false)

    if (
      this.syftModel == null ||
      this.loss == null ||
      this.optimizer == null
    ) {
      throw new Error('Not Compiled')
    }

    return (await this.syftModel.forward(x))
  }

  /**
  * TODO document this?
  *
  * @param x   TODO document this?
  *
  * @returns  TODO document this?
  */
  async getWeights(): Promise<syft.Tensor[]> {
    if (
      this.syftModel == null ||
      this.loss == null ||
      this.optimizer == null
    ) {
      throw new Error('Not Compiled')
    }

    return this.syftModel.parameters()
  }

  /**
  * TODO document this?
  *
  * @param x   TODO document this?
  *
  * @returns  TODO document this?
  */
  async getJSON() {
    // TODO: let this = this
    // let jsonStr = this.syftModel.getJSON()
    //
    // let o = JSON.parse(jsonStr)
    //
    // o['config'][0]['config']['batchInputShape'] = [null, this.layers[0].inputShape]
    //
    // let newConfig: any [] = []
    // for (let layer of o['config']) {
    //   if (layer['class_name'] === 'Linear') {
    //     layer['class_name'] = 'Sequential'
    //     layer['config']['name'] = 'dense_' + layer['config']['name'].split('_')[-1]
    //   } else if (layer['class_name'] === 'Softmax') {
    //     newConfig[-1]['config']['activation'] = 'softmax'
    //     continue
    //   } else if (layer['class_name'] === 'ReLU') {
    //     newConfig[-1]['config']['activation'] = 'relu'
    //     continue
    //   }
    //   newConfig.push(layer)
    // }
    // o['config'] = newConfig
    //
    // return JSON.stringify(o)
  }
}
