import * as controller from '../controller'

import {
  assertType,
  AsyncInstance,
  IAsyncConstructor
 } from '../lib'

import { Optimizer } from './Optimizer'

import { Tensor } from './Tensor'


export class Model extends AsyncInstance {
  type = 'model'
  layerType = '(unknown)'
  params: boolean
  outputShape?: number|string = '(dynamic)'

  protected static assertLayerType(
    a: string,
    b: Function
  ) {
    if (a.toLowerCase() !== b.name.toLowerCase()) {
      throw new TypeError(`Connat Convert '${a}' to '${b.name}'`)
    }
  }

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

  static async getModel(
    id: string
  ): Promise<Model> {
    let type = await Model.getModelType(id)

    return Model.newModel(AsyncInstance, id, type)
  }

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

  async feed(...args: any[]) {
    let self = this
    self.ready()

    return self.forward(...args)
  }

  async parameters(): Promise<Tensor[]> {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'params'
      }), 'FloatTensor_list'),
      Array
    )
  }

  async num_parameters() {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'param_count'
      }), 'int'),
      'number'
    )
  }

  async models(): Promise<Model[]> {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'models'
      }), 'Model_list'),
      Array
    )
  }

  async set_id(
    new_id: string
  ) {
    let self = this
    self.ready()

    assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'set_id',
        tensorIndexParams: [new_id]
      }), 'string'),
      'string'
    )

    self.id = new_id
    return self
  }

  async fit(
    input: Tensor,
    target: Tensor,
    criterion: Model,
    optim: Optimizer,
    batch_size: number,
    iters = 15,
    log_interval = 200,
    metrics: string[] = [],
    verbose = true
  ) {
    let self = this
    self.ready()

    console.log('fit')

    let num_batches = assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'prepare_to_fit',
        tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
      }), 'int'),
      'number'
    )

    let loss = 100000
    for (let iter = 0; iter < iters; iter++) {
      for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
        let prev_loss = loss

        let _loss = assertType(
          await controller.sendJSON(self.cmd({
            functionCall: 'fit',
            tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
          }), 'float'),
          'number'
        ) as number

        if (log_i % 10 === 0) {
          console.log(`iter ${iter}/${iters} - ${log_i}/${num_batches} -- ${_loss}`)
        }

        if (_loss) {
          loss = _loss
        } else {
          console.log(_loss)
        }
        if (Number.isNaN(loss) || Number.isNaN(prev_loss)) {
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
  //   return_instead_of_print = false
  // ): Promise<string|undefined> {
  //   let self = this
  //   self.ready()
  //
  //   // let layerType = await self.getLayerType() + '_' + self.id + ' (' + str(type()).split('\'')[1].split('.')[-1] + ')'
  //   let layerType = `${await self.getLayerType()}_${self.id} (${self.type})`
  //   let outputShape = ''
  //   if (typeof self.outputShape === 'number') {
  //     outputShape = String(self.outputShape)
  //   } else {
  //     outputShape = String(self.outputShape)
  //   }
  //
  //   let n_param = String(await self.num_parameters())
  //   let output = layerType + ' '.repeat(29 - layerType.length) + outputShape + ' '.repeat(26 - outputShape.length) + n_param + '\n'
  //   if (verbose) {
  //     let single = '_________________________________________________________________\n'
  //     let header = 'Layer (type)                 Output Shape              Param #   \n'
  //     let double = '===\n'
  //     // TODO: let total_params = 'Total params: ' + '{:,}'.format(self.num_parameters()) + '\n'
  //     // TODO: let trainable_params = 'Trainable params: ' + '{:,}'.format(self.num_parameters()) + '\n'
  //     let non_trainable_params = 'Non-trainable params: 0' + '\n'
  //     // TODO: output = single + header + double + output + double + total_params + trainable_params + non_trainable_params + single
  //   }
  //
  //   if (return_instead_of_print) {
  //     return output
  //   }
  //   console.log(output)
  //   return
  // }

  async length() {
    let self = this
    self.ready()

    return (await self.models()).length
  }


  async activation() {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'activation'
      }), 'FloatTensor', /*delete_after_use=false*/),
      Tensor.FloatTensor
    )
  }

  async getLayerType() {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'model_type'
      }), 'string'),
      'string'
    )
  }

  cmd(
    options: {
      [key: string]: any
      functionCall: string
      tensorIndexParams?: any[],
    }
  ): SocketCMD {
    let self = this

    return {
      objectType: self.type,
      objectIndex: self.id || '-1',
      tensorIndexParams: [],
      ...options
    }
  }

  async forward(
    ...input: Tensor[]
  ) {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'forward',
        tensorIndexParams: input.map(t => t.id)
      }), 'FloatTensor' /*, false*/),
      Tensor.FloatTensor
    )
  }

  // async __repr__(
  //   verbose = true
  // ) {
  //   let self = this
  //   self.ready()
  //
  //   if (verbose) {
  //     let output = ''
  //     output += self.__repr__(false) + '\n'
  //     for (let p of await self.parameters()) {
  //       output += '\t W:' + p.__repr__(false)
  //     }
  //     let activation = await self.activation()
  //     if (activation) {
  //       output += '\t A:' + activation + '\n'
  //     }
  //     return output
  //   } else {
  //     return `<syft.nn.${self.layerType} at ${self.id}>`
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

export class Policy extends Model {
  static $: IAsyncConstructor = Policy
  layerType = 'policy'
  stateType: string
  optimizer?: Optimizer
  model?: Model

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

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

  async sample(
    ...input: Tensor[]
  ) {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'sample',
        tensorIndexParams: input.map(t => t.id)
      }), 'IntTensor'),
      Tensor.IntTensor
    )
  }

  async parameters() {
    let self = this
    self.ready()

    if (self.model) {
      return self.model.parameters()
    }

    return []
  }

  async feed(
    ...args: any[]  // TODO: what type is this
  ) {
  let self = this
  self.ready()

  if (self.stateType === 'discrete') {
    return self.sample(...args)
  } else if (self.stateType === 'continuous') {
    return self.forward(...args)
  }

  throw new Error(`Unknown State Type: ${self.stateType}`)
}

// async history() {
//     let self = this
//     self.ready()
//
//   let raw_history = await controller.sendJSON(self.cmd({
//     functionCall: 'get_history'
//   }), 'string')
//   // TODO: let history_idx = list(map(lambda x:list(map(lambda y:int(y),x.split(','))),raw_history[2:-1].split('],[')))
//   let losses = []
//   let rewards = []
//
//   for (let {loss, reward} of history_idx) {
//     if (loss !== -1) {
//       losses.push(await controller.get_tensor(loss))
//     } else {
//       losses.push(void 0)
//     }
//     if (reward !== -1) {
//       rewards.push(await controller.get_tensor(reward))
//     } else {
//       rewards.push(void 0)
//     }
//   }
//
//   return [losses, rewards]
// }
}

export class Sequential extends Model {
  static $: IAsyncConstructor = Sequential
  layerType = 'sequential'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

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

  async add(
    model: Model
  ) {
    let self = this
    self.ready()

    await controller.sendJSON(self.cmd({
      functionCall: 'add',
      tensorIndexParams: [model.id]
    }), /*delete_after_use=false*/)
  }

  // async summary() {
  //   let self = this
  //   self.ready()
  //
  //   let single = '_________________________________________________________________\n'
  //   let header = 'Layer (type)                 Output Shape              Param #   \n'
  //   let double = '===\n'
  //   // TODO: let total_params = 'Total params: ' + '{:,}'.format(self.num_parameters()) + '\n'
  //   // TODO: let trainable_params = 'Trainable params: ' + '{:,}'.format(self.num_parameters()) + '\n'
  //   let non_trainable_params = 'Non-trainable params: 0' + '\n'
  //
  //   let output = single + header + double
  //   Async.each
  //
  //   let mods = await Async.map(await self.models() as Model[], async (m) => {
  //     return m.summary(false, true)
  //   })
  //   output += mods.join(single)
  //   output += double
  //   // TODO: output += total_params + trainable_params + non_trainable_params + single
  //   console.log(output)
  //   return output
  // }
}

export class Linear extends Model {
  static $: IAsyncConstructor = Linear
  layerType = 'linear'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create(
    input_dim = 0,
    output_dim = 0,
    initializer = 'Xavier'
  ) {
    let id = await Model.createModel(this, String(input_dim), String(output_dim), initializer)

    return new this(AsyncInstance, id)
  }

  async finish(
    id: string
  ) {
    let self = this

    self.id = id

    // let params = await self.parameters()

    // TODO: self.outputShape = Number(params[0].shape()[-1])
    // TODO: self.input_shape = Number(params[0].shape()[0])
  }

}

export class ReLU extends Model {
  static $: IAsyncConstructor = ReLU
  layerType = 'relu'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

export class Dropout extends Model {
  static $: IAsyncConstructor = Dropout
  layerType = 'dropout'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create(
    rate = 0.5
  ) {
    let id = await Model.createModel(this, String(rate))

    return new this(AsyncInstance, id)
  }
}

export class Sigmoid extends Model {
  static $: IAsyncConstructor = Sigmoid
  layerType = 'sigmoid'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

export class Softmax extends Model {
  static $: IAsyncConstructor = Softmax
  layerType = 'softmax'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }
}

export class LogSoftmax extends Model {
  static $: IAsyncConstructor = LogSoftmax
  layerType = 'logsoftmax'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }
}

export class Log extends Model {
  static $: IAsyncConstructor = Log
  layerType = 'log'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

export class Tanh extends Model {
  static $: IAsyncConstructor = Tanh
  layerType = 'tanh'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }
}

export class MSELoss extends Model {
  static $: IAsyncConstructor = MSELoss
  layerType = 'mseloss'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }

  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /*delete_after_use=false*/),
      Tensor.FloatTensor
    )
  }
}

export class NLLLoss extends Model {
  static $ : IAsyncConstructor = NLLLoss
  layerType = 'nllloss'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }


  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    self.ready()

    return assertType(
      controller.sendJSON(self.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /*delete_after_use=false*/),
      Tensor.FloatTensor
    )
  }
}

export class CrossEntropyLoss extends Model {
  static $ : IAsyncConstructor = CrossEntropyLoss
  layerType: 'crossentropyloss'

  // TODO: backward() to be implemented: grad = target - prediction
  // TODO: backward(): until IntegerTensor is available assume a one-hot vector is passed in.

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create(
    dim = 1
  ) {
    let id = await Model.createModel(this, String(dim))

    return new this(AsyncInstance, id)
  }

  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /*delete_after_use=false*/),
      Tensor.FloatTensor
    )
  }
}

export class Categorical_CrossEntropy extends Model {
  static $ : IAsyncConstructor = Categorical_CrossEntropy
  layerType: 'categorical_crossentropy'

  static async get(
    id: string
  ) {
    let type = await Model.getModelType(id)

    Model.assertLayerType(type, this)

    return new this(AsyncInstance, id)
  }

  static async create() {
    let id = await Model.createModel(this)

    return new this(AsyncInstance, id)
  }

  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'forward',
        tensorIndexParams: [input.id, target.id]
      }), 'FloatTensor' /*delete_after_use=false*/),
      Tensor.FloatTensor
    )
  }
}
