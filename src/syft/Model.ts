import * as controller from '../controller'

import {
  assertType,
  AsyncInstance,
  IAsyncConstructor
 } from '../lib'

import { Optimizer } from './Optimizer'

import { Tensor } from './Tensor'

/**
* A base-class for Syft Models to inherit from.
*/
export class Model extends AsyncInstance {
  /**
  * Syft object type.
  */
  type = 'model'

  /**
  * Syft model layer type.
  */
  layerType = '(unknown)'

  /**
  * Then number of outputs on this Model.
  */
  outputShape?: number|string = '(dynamic)'

  /**
  * An assert method to test if a given layer type
  * is compatible with a given model.
  *
  * @param layerType         A string representing the layer type to test for.
  * @param modelConstructor  A model constructor to test against.
  */
  protected static assertLayerType(
    layerType: string,
    modelConstructor: Function
  ) {
    if (
      layerType.toLowerCase() !== modelConstructor.name.toLowerCase()
    ) {
      throw new TypeError(
        `Connat Convert '${
          layerType
        }' to '${
          modelConstructor.name
        }'`
      )
    }
  }

  /**
  * Creates a local instance of a network connected model.
  *
  * @param $     A sercert variable to prove that the caller is authorized.
  * @param id    The ID of network connected object in the Unity Project.
  * @param type  The type of object being connected over the network.
  *
  * @returns  A local instance of a network connected model.
  */
  protected static newModel(
    $: any,
    id: string,
    type: string
  ): Model {
    AsyncInstance.assertCallable($)

    switch (type) {
      case 'policy':
        return new this.Policy(AsyncInstance, id)
      case 'sequential':
        return new this.Sequential(AsyncInstance, id)
      case 'linear':
        return new this.Linear(AsyncInstance, id)
      case 'relu':
        return new this.ReLU(AsyncInstance, id)
      case 'dropout':
        return new this.Dropout(AsyncInstance, id)
      case 'sigmoid':
        return new this.Sigmoid(AsyncInstance, id)
      case 'softmax':
        return new this.Softmax(AsyncInstance, id)
      case 'logsoftmax':
        return new this.LogSoftmax(AsyncInstance, id)
      case 'log':
        return new this.Log(AsyncInstance, id)
      case 'tanh':
        return new this.Tanh(AsyncInstance, id)
      case 'mseloss':
        return new this.MSELoss(AsyncInstance, id)
      case 'nllloss':
        return new this.NLLLoss(AsyncInstance, id)
      case 'crossentropyloss':
        return new this.CrossEntropyLoss(AsyncInstance, id)
      case 'categorical_crossentropy':
        return new this.Categorical_CrossEntropy(AsyncInstance, id)
      default:
        throw new Error(`Unkown Model Type: ${type}`)
    }
  }

  /**
  * Gets the model type of a network connected model.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  The model type with the given `id`.
  */
  static async getModelType(
    id: string
  ): Promise<string> {
    return assertType(
      await controller.sendJSON({
        functionCall: 'model_type',
        objectType: 'model',
        objectIndex: id,
        tensorIndexParams: []
      }, 'string'),
      'string'
    ) as string
  }

  /**
  * Gets a local instance of a network connected model.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected model.
  */
  static async getModel(
    id: string
  ): Promise<Model> {
    let type = await Model.getModelType(id)

    return Model.newModel(AsyncInstance, id, type)
  }

  /**
  * Creates a local instance of a network connected model.
  *
  * @param layerConstructor  The model constructor of which to create.
  * @param params            Parameters specific to the model constructor.
  *
  * @returns  A local instance of a network connected model.
  */
  static async createModel(
    layerConstructor: Function,
    ...params: any[] // TODO: what type are thses
  ) {
    let layerType = layerConstructor.name.toLowerCase()

    return assertType(
      await controller.sendJSON({
        functionCall: 'create',
        objectType: 'model',
        tensorIndexParams: [layerType, ...params]
      }, 'string'),
      'string'
    ) as string
  }

  /**
  * TODO find out args type and document this function.
  */
  async feed(
    ...args: any[]
  ) {
    this.ready()

    return this.forward(...args)
  }

  /**
  * Get the parameter Tensors of this Model.
  *
  * @returns  An array of Tensors containing the parameters of this Model.
  */
  async parameters(): Promise<Tensor[]> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'params'
      }), 'FloatTensor_list'),
      Array
    )
  }

  /**
  * Get the number of parameters in this Model.
  *
  * @returns  The number of parameters in this Model.
  */
  async numParameters() {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'param_count'
      }), 'int'),
      'number'
    )
  }

  /**
  * Get the layer Models in this Model.
  *
  * @returns  An array of Models used as layers in this Model.
  */
  async models(): Promise<Model[]> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'models'
      }), 'Model_list'),
      Array
    )
  }

  /**
  * TODO document this?
  */
  async set_id(
    new_id: string
  ) {
    this.ready()

    assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'set_id',
        tensorIndexParams: [new_id]
      }), 'string'),
      'string'
    )

    this.id = new_id
    return this
  }

  /**
  * The fit function is used to train the model.
  *
  * @param options.input        The training dataset.
  * @param options.target       The labels for the training dataset.
  * @param options.criterion    TODO document this?
  * @param options.optimizer    TODO document this?
  * @param options.batchSize    TODO document this?
  * @param options.iterations   TODO document this? (default 15)
  * @param options.logInterval  TODO document this? (default 200)
  * @param options.metrics      TODO document this? (default [])
  * @param options.verbose      TODO document this? (default false)
  *
  * @returns The final loss value.
  */
  async fit({
    input,
    target,
    criterion,
    optimizer,
    batchSize,
    iterations = 15,
    logInterval = 200,
    metrics = [],
    verbose = false
  }: {
    input: Tensor
    target: Tensor
    criterion: Model
    optimizer: Optimizer
    batchSize: number
    iterations?: number
    logInterval?: number
    metrics?: string[]
    verbose?: boolean
  }) {
    this.ready()

    if (verbose) { console.log('prepare_to_fit') }

    let numBatches = assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'prepare_to_fit',
        tensorIndexParams: [input.id, target.id, criterion.id, optimizer.id, batchSize]
      }), 'int'),
      'number'
    )
    if (verbose) { console.log('fit') }

    let loss = 100000

    for (let iter = 0; iter < iterations; iter++) {
      for (let logI = 0; logI < numBatches; logI += logInterval) {
        loss = assertType(
          await controller.sendJSON(this.cmd({
            functionCall: 'fit',
            tensorIndexParams: [logI, Math.min(logI + logInterval, numBatches), 1]
          }), 'float'),
          'number'
        ) as number

        if (verbose && logI % 10 === 0) {
          console.log(`iter ${iter}/${iterations} - ${logI}/${numBatches} -- ${loss}`)
        }

        if (Number.isNaN(loss)) {
          break
        }
      }
      if (Number.isNaN(loss)) {
        break
      }
    }
    return loss
  }
  //
  // async summary(
  //   verbose = true,
  //   returnInsteadOfPrint = false
  // ): Promise<string|undefined> {
  //   let this = this
  //   this.ready()
  //
  //   // let layerType = await this.getLayerType() + '_' + this.id + ' (' + str(type()).split('\'')[1].split('.')[-1] + ')'
  //   let layerType = `${await this.getLayerType()}_${this.id} (${this.type})`
  //   let outputShape = ''
  //   if (typeof this.outputShape === 'number') {
  //     outputShape = String(this.outputShape)
  //   } else {
  //     outputShape = String(this.outputShape)
  //   }
  //
  //   let nParam = String(await this.numParameters())
  //   let output = layerType + ' '.repeat(29 - layerType.length) + outputShape + ' '.repeat(26 - outputShape.length) + nParam + '\n'
  //   if (verbose) {
  //     let single = '_________________________________________________________________\n'
  //     let header = 'Layer (type)                 Output Shape              Param #   \n'
  //     let double = '===\n'
  //     // TODO: let totalParams = 'Total params: ' + '{:,}'.format(this.numParameters()) + '\n'
  //     // TODO: let trainableParams = 'Trainable params: ' + '{:,}'.format(this.numParameters()) + '\n'
  //     let nonTrainableParams = 'Non-trainable params: 0' + '\n'
  //     // TODO: output = single + header + double + output + double + totalParams + trainableParams + nonTrainableParams + single
  //   }
  //
  //   if (returnInsteadOfPrint) {
  //     return output
  //   }
  //   console.log(output)
  //   return
  // }

  /**
  * Get the number of models.
  *
  * @returns  The number of models.
  */
  async length() {
    this.ready()

    return (await this.models()).length
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async activation() {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'activation'
      }), 'FloatTensor', /**deleteAfterUse=false*/),
      Tensor.FloatTensor
    )
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async getLayerType() {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'model_type'
      }), 'string'),
      'string'
    )
  }

  /**
  * Creates a command object for this Model.
  *
  * @param options.functionCall       The function to call.
  * @param options.tensorIndexParams  The labels for the training dataset.
  * @param options[key]               Other options.
  *
  * @returns  A command object.
  */
  protected cmd(
    options: {
      [key: string]: any
      functionCall: string
      tensorIndexParams?: any[],
    }
  ): SocketCMD {

    return {
      objectType: this.type,
      objectIndex: this.id || '-1',
      tensorIndexParams: [],
      ...options
    }
  }

  /**
  * TODO document this?
  *
  * @param input  TODO document this?
  *
  * @returns  TODO document this?
  */
  async forward(
    ...input: Tensor[]
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'forward',
        tensorIndexParams: input.map(t => t.id)
      }), 'FloatTensor' /**, false*/),
      Tensor.FloatTensor
    )
  }

  // async __repr__(
  //   verbose = true
  // ) {
  //   let this = this
  //   this.ready()
  //
  //   if (verbose) {
  //     let output = ''
  //     output += this.__repr__(false) + '\n'
  //     for (let p of await this.parameters()) {
  //       output += '\t W:' + p.__repr__(false)
  //     }
  //     let activation = await this.activation()
  //     if (activation) {
  //       output += '\t A:' + activation + '\n'
  //     }
  //     return output
  //   } else {
  //     return `<syft.nn.${this.layerType} at ${this.id}>`
  //   }
  // }

  static Policy: PolicyConstructor
  static Sequential: SequentialConstructor
  static Linear: LinearConstructor
  static ReLU: ReLUConstructor
  static Dropout: DropoutConstructor
  static Sigmoid: SigmoidConstructor
  static Softmax: SoftmaxConstructor
  static LogSoftmax: LogSoftmaxConstructor
  static Log: LogConstructor
  static Tanh: TanhConstructor
  static MSELoss: MSELossConstructor
  static NLLLoss: NLLLossConstructor
  static CrossEntropyLoss: CrossEntropyLossConstructor
  static Categorical_CrossEntropy: Categorical_CrossEntropyConstructor
}

export interface PolicyConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Policy
  get(id: string): Promise<Policy>
  create(...args: any[]): Promise<Policy>
}

export interface SequentialConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Sequential
  get(id: string): Promise<Sequential>
  create(...args: any[]): Promise<Sequential>
}

export interface LinearConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Linear
  get(id: string): Promise<Linear>
  create(...args: any[]): Promise<Linear>
}

export interface ReLUConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): ReLU
  get(id: string): Promise<ReLU>
  create(...args: any[]): Promise<ReLU>
}

export interface DropoutConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Dropout
  get(id: string): Promise<Dropout>
  create(...args: any[]): Promise<Dropout>
}

export interface SigmoidConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Sigmoid
  get(id: string): Promise<Sigmoid>
  create(...args: any[]): Promise<Sigmoid>
}

export interface SoftmaxConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Softmax
  get(id: string): Promise<Softmax>
  create(...args: any[]): Promise<Softmax>
}

export interface LogSoftmaxConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): LogSoftmax
  get(id: string): Promise<LogSoftmax>
  create(...args: any[]): Promise<LogSoftmax>
}

export interface LogConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Log
  get(id: string): Promise<Log>
  create(...args: any[]): Promise<Log>
}

export interface TanhConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Tanh
  get(id: string): Promise<Tanh>
  create(...args: any[]): Promise<Tanh>
}

export interface MSELossConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): MSELoss
  get(id: string): Promise<MSELoss>
  create(...args: any[]): Promise<MSELoss>
}

export interface NLLLossConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): NLLLoss
  get(id: string): Promise<NLLLoss>
  create(...args: any[]): Promise<NLLLoss>
}

export interface CrossEntropyLossConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): CrossEntropyLoss
  get(id: string): Promise<CrossEntropyLoss>
  create(...args: any[]): Promise<CrossEntropyLoss>
}

export interface Categorical_CrossEntropyConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Categorical_CrossEntropy
  get(id: string): Promise<Categorical_CrossEntropy>
  create(...args: any[]): Promise<Categorical_CrossEntropy>
}

/**
* Policy Model
*/
export class Policy extends Model {
  static $: IAsyncConstructor = Policy

  /**
  * Syft Model layer type.
  */
  layerType = 'policy'

  /**
  * TODO ocument this?
  */
  stateType: string = 'discrete'

  /**
  * TODO ocument this?
  */
  optimizer?: Optimizer

  /**
  * TODO ocument this?
  */
  model?: Model

  /**
  * Get a Policy Model given its ID
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Policy Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Policy.
  *
  * @param model      The Policy's interal Model.
  * @param optimizer  TODO document this?
  * @param stateType  TODO document this?
  *
  * @returns  A local instance of a network connected Policy.
  */
  static async create(
    model: Model,
    optimizer: Optimizer,
    stateType = 'discrete'
  ) {
    let id = await Model.createModel(this, model.id, optimizer.id)

    let policy = new this(AsyncInstance, id)

    policy.stateType = stateType

    return policy
  }

  /**
  * TODO document this?
  *
  * @param input  TODO document this?
  *
  * @returns  TODO document this?
  */
  async sample(
    ...input: Tensor[]
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sample',
        tensorIndexParams: input.map(t => t.id)
      }), 'IntTensor'),
      Tensor.IntTensor
    )
  }

  /**
  * Get the parameter Tensors of this.model.
  *
  * @returns  An array of Tensors containing the parameters of this.model.
  */
  async parameters() {
    this.ready()

    if (this.model) {
      return this.model.parameters()
    }

    return []
  }

  /**
  * TODO document this?
  *
  * @param args  TODO document this?
  *
  * @returns  TODO document this?
  */
  async feed(
    ...args: any[]  // TODO: what type is this
  ) {
    this.ready()

    if (this.stateType === 'discrete') {
      return this.sample(...args)
    } else if (this.stateType === 'continuous') {
      return this.forward(...args)
    }

    throw new Error(`Unknown State Type: ${this.stateType}`)
  }

// async history() {
//     let this = this
//     this.ready()
//
//   let rawHistory = await controller.sendJSON(this.cmd({
//     functionCall: 'get_history'
//   }), 'string')
//   // TODO: let historyIdx = list(map(lambda x:list(map(lambda y:int(y),x.split(','))),rawHistory[2:-1].split('],[')))
//   let losses = []
//   let rewards = []
//
//   for (let {loss, reward} of historyIdx) {
//     if (loss !== -1) {
//       losses.push(await controller.getTensor(loss))
//     } else {
//       losses.push(void 0)
//     }
//     if (reward !== -1) {
//       rewards.push(await controller.getTensor(reward))
//     } else {
//       rewards.push(void 0)
//     }
//   }
//
//   return [losses, rewards]
// }
}

/**
* Sequential Model
*/
export class Sequential extends Model {
  static $: IAsyncConstructor = Sequential

  /**
  * Syft Model layer type.
  */
  layerType = 'sequential'

  /**
  * Get a Sequential Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Sequential Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Create a new Sequential Model.
  *
  * @param layers  An array of interal models.
  *
  * @returns  A local instance of a network connected Sequential Model.
  */
  static async create(
    layers?: Model[]
  ) {
    let id = await Model.createModel(this)

    let model = new this(AsyncInstance, id)

    if (Array.isArray(layers)) {
      for (let layer of layers) {
        await model.add(layer)
      }
    }

    return model
  }

  /**
  * Add a new interal Model layer.
  *
  * @param model  An interal Model.
  */
  async add(
    model: Model
  ) {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'add',
      tensorIndexParams: [model.id]
    }), /**deleteAfterUse=false*/)
  }

  // async summary() {
  //   let this = this
  //   this.ready()
  //
  //   let single = '_________________________________________________________________\n'
  //   let header = 'Layer (type)                 Output Shape              Param #   \n'
  //   let double = '===\n'
  //   // TODO: let totalParams = 'Total params: ' + '{:,}'.format(this.numParameters()) + '\n'
  //   // TODO: let trainableParams = 'Trainable params: ' + '{:,}'.format(this.numParameters()) + '\n'
  //   let nonTrainableParams = 'Non-trainable params: 0' + '\n'
  //
  //   let output = single + header + double
  //   Async.each
  //
  //   let mods = await Async.map(await this.models() as Model[], async (m) => {
  //     return m.summary(false, true)
  //   })
  //   output += mods.join(single)
  //   output += double
  //   // TODO: output += totalParams + trainableParams + nonTrainableParams + single
  //   console.log(output)
  //   return output
  // }
}

/**
* Linear Model
*/
export class Linear extends Model {
  static $: IAsyncConstructor = Linear

  /**
  * Syft Model layer type.
  */
  layerType = 'linear'

  /**
  * Get a Linear Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Linear Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Linear Model.
  *
  * @param inputDim     The number of inputs.
  * @param outputDim    The number of outputs.
  * @param initializer  TODO document this?
  *
  * @returns  A local instance of a network connected Linear Model.
  */
  static async create({
    inputDim = 0,
    outputDim = 0,
    initializer = 'Xavier'
  }: {
    inputDim?: number
    outputDim: number
    initializer?: string
  }) {
    let id = await Model.createModel(this, String(inputDim), String(outputDim), initializer)

    return new this(AsyncInstance, id)
  }
}

/**
* ReLU Model
*/
export class ReLU extends Model {
  static $: IAsyncConstructor = ReLU

  /**
  * Syft Model layer type.
  */
  layerType = 'relu'

  /**
  * Get a ReLU Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected ReLU Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new ReLU Model.
  *
  * @returns  A local instance of a network connected ReLU Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

/**
* Dropout Model
*/
export class Dropout extends Model {
  static $: IAsyncConstructor = Dropout

  /**
  * Syft Model layer type.
  */
  layerType = 'dropout'

  /**
  * Get a Dropout Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Dropout Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Dropout Model.
  *
  * @param rate  TODO document this?
  *
  * @returns  A local instance of a network connected Dropout Model.
  */
  static async create(
    rate = 0.5
  ) {
    let id = await Model.createModel(this, String(rate))

    return new this(AsyncInstance, id)
  }
}

/**
* Sigmoid Model
*/
export class Sigmoid extends Model {
  static $: IAsyncConstructor = Sigmoid

  /**
  * Syft Model layer type.
  */
  layerType = 'sigmoid'

  /**
  * Get a Sigmoid Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Sigmoid Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Sigmoid Model.
  *
  * @returns  A local instance of a network connected Sigmoid Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

/**
* Softmax Model
*/
export class Softmax extends Model {
  static $: IAsyncConstructor = Softmax

  /**
  * Syft Model layer type.
  */
  layerType = 'softmax'

  /**
  * Get a Softmax Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Softmax Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Softmax Model.
  *
  * @param dim  TODO document this?
  *
  * @returns  A local instance of a network connected Softmax Model.
  */
  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }
}

/**
* LogSoftmax Model
*/
export class LogSoftmax extends Model {
  static $: IAsyncConstructor = LogSoftmax

  /**
  * Syft Model layer type.
  */
  layerType = 'logsoftmax'

  /**
  * Get a LogSoftmax Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected LogSoftmax Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new LogSoftmax Model.
  *
  * @param dim  TODO document this?
  *
  * @returns  A local instance of a network connected LogSoftmax Model.
  */
  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }
}

/**
* Log Model
*/
export class Log extends Model {
  static $: IAsyncConstructor = Log

  /**
  * Syft Model layer type.
  */
  layerType = 'log'

  /**
  * Get a Log Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Log Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Log Model.
  *
  * @returns  A local instance of a network connected Log Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

/**
* Tanh Model
*/
export class Tanh extends Model {
  static $: IAsyncConstructor = Tanh

  /**
  * Syft Model layer type.
  */
  layerType = 'tanh'

  /**
  * Get a Tanh Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Tanh Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Tanh Model.
  *
  * @returns  A local instance of a network connected Tanh Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

/**
* MSELoss Model
*/
export class MSELoss extends Model {
  static $: IAsyncConstructor = MSELoss

  /**
  * Syft Model layer type.
  */
  layerType = 'mseloss'

  /**
  * Get a MSELoss Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected MSELoss Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new MSELoss Model.
  *
  * @returns  A local instance of a network connected MSELoss Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }

  /**
  * TODO document this?
  *
  * @param input   TODO document this?
  * @param target  TODO document this?
  *
  * @returns  TODO document this?
  */
  async forward(
    input: Tensor,
    target: Tensor
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /**deleteAfterUse=false*/),
      Tensor.FloatTensor
    )
  }
}

/**
* NLLLoss Model
*/
export class NLLLoss extends Model {
  static $ : IAsyncConstructor = NLLLoss

  /**
  * Syft Model layer type.
  */
  layerType = 'nllloss'

  /**
  * Get a NLLLoss Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected NLLLoss Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new NLLLoss Model.
  *
  * @returns  A local instance of a network connected NLLLoss Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }

  /**
  * TODO document this?
  *
  * @param input   TODO document this?
  * @param target  TODO document this?
  *
  * @returns  TODO document this?
  */
  async forward(
    input: Tensor,
    target: Tensor
  ) {
    this.ready()

    return assertType(
      controller.sendJSON(this.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /**deleteAfterUse=false*/),
      Tensor.FloatTensor
    )
  }
}

/**
* CrossEntropyLoss Model
*/
export class CrossEntropyLoss extends Model {
  static $ : IAsyncConstructor = CrossEntropyLoss

  /**
  * Syft Model layer type.
  */
  layerType = 'crossentropyloss'

  // TODO: backward() to be implemented: grad = target - prediction
  // TODO: backward(): until IntegerTensor is available assume a one-hot vector is passed in.

  /**
  * Get a CrossEntropyLoss Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected CrossEntropyLoss Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new CrossEntropyLoss Model.
  *
  * @param dim  TODO document this?
  *
  * @returns  A local instance of a network connected CrossEntropyLoss Model.
  */
  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }

  /**
  * TODO document this?
  *
  * @param input   TODO document this?
  * @param target  TODO document this?
  *
  * @returns  TODO document this?
  */
  async forward(
    input: Tensor,
    target: Tensor
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /**deleteAfterUse=false*/),
      Tensor.FloatTensor
    )
  }
}

/**
* Categorical_CrossEntropy Model
*/
export class Categorical_CrossEntropy extends Model {
  static $ : IAsyncConstructor = Categorical_CrossEntropy

  /**
  * Syft Model layer type.
  */
  layerType = 'categorical_crossentropy'

  /**
  * Get a Categorical_CrossEntropy Model given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Categorical_CrossEntropy Model.
  */
  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a new Categorical_CrossEntropy Model.
  *
  * @returns  A local instance of a network connected Categorical_CrossEntropy Model.
  */
  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }

  /**
  * TODO document this?
  *
  * @param input   TODO document this?
  * @param target  TODO document this?
  *
  * @returns  TODO document this?
  */
  async forward(
    input: Tensor,
    target: Tensor
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /**deleteAfterUse=false*/),
      Tensor.FloatTensor
    )
  }
}

Model.Policy = Policy
Model.Sequential = Sequential
Model.Linear = Linear
Model.ReLU = ReLU
Model.Dropout = Dropout
Model.Sigmoid = Sigmoid
Model.Softmax = Softmax
Model.LogSoftmax = LogSoftmax
Model.Log = Log
Model.Tanh = Tanh
Model.MSELoss = MSELoss
Model.NLLLoss = NLLLoss
Model.CrossEntropyLoss = CrossEntropyLoss
Model.Categorical_CrossEntropy = Categorical_CrossEntropy
