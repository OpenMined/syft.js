import * as Async from 'promasync'
import * as controller from './controller'
import {Optimizer} from './Optimizer'
import {assertType} from './asserts'
import {
  Tensor,
  IntTensor,
  FloatTensor
} from './Tensor'

import {
  AsyncInit,
  IAsyncInit
} from './AsyncInit'

export class Model extends AsyncInit implements IAsyncInit {
  type = 'model'
  layerType = '(unknown)'
  id?: string
  params: boolean
  outputShape?: string = '(dynamic)'

  static async getModel(
    id: string
  ) {
    let layerType = await controller.sendJSON({
      functionCall: 'model_type',
      objectType: 'model',
      objectIndex: id,
      tensorIndexParams: []
    })

    switch (layerType) {
    case 'linear':
      return new Linear(id)
    case 'sigmoid':
      return new Sigmoid(id)
    case 'crossentropyloss':
      return new CrossEntropyLoss(id)
    case 'tanh':
      return new Tanh(id)
    case 'dropout':
      return new Dropout(id)
    case 'softmax':
      return new Softmax(id)
    case 'logsoftmax':
      return new LogSoftmax(id)
    case 'relu':
      return new ReLU(id)
    case 'log':
      return new Log(id)
    case 'policy':
      return new Policy(id)
    default:
      throw new Error(`Unsupported Layer Type: '${layerType}'.`)
    }
  }

  constructor(
    id?: string,
    params: any[] = []
  ) {
    super()

    let self = this

    if (id) {
      self.__finish__(id)
    } else {
      controller.sendJSON(self.cmd({
        functionCall: 'create',
        tensorIndexParams: [self.layerType, ...params]
      }), 'string')
        .then(res => self.__finish__(res as string))
        .catch(err => self.__error__(err))
    }
  }

  finish(
    id: string
  ) {
    let self = this

    self.id = id
  }

  async feed(...args: any[]) {
    let self = this
    await self.ready()

    return await self.forward(...args)
  }

  async parameters(): Promise<Tensor[]> {
    let self = this
    await self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'params'
      }), 'FloatTensor_list'),
      Array
    )
  }

  async num_parameters() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'param_count'
    }), 'int')
  }

  async models(): Promise<Model[]> {
    let self = this
    await self.ready()

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
    await self.ready()

    await controller.sendJSON(self.cmd({
      functionCall: 'set_id',
      tensorIndexParams: [new_id]
    }), 'string')

    self.id = new_id
    return self
  }

  async fit(
    input: number[]|Tensor,
    target: number[]|Tensor,
    criterion, // TODO: what type is this
    optim, // TODO: what type is this
    batch_size: number,
    iters = 15,
    log_interval = 200,
    metrics = [],
    verbose = true
  ) {
    let self = this
    await self.ready()

    if (Array.isArray(input)) {
      input = new FloatTensor(input, /*autograd=true, /*delete_after_use=false*/)
    }
    if (Array.isArray(target)) {
      target = new FloatTensor(target, /*autograd=true, /*delete_after_use=false*/)
    }

    let num_batches = assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'prepare_to_fit',
        tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
      }), 'int'),
      'number'
    )

    console.log(`Number of Batches:${num_batches}`)

    let progress_bars = []
    if (verbose) {
      // TODO: progress_bars.push(Progress(0,iters-1))
    }

    let start = Date.now()
    let loss = 100000
    for (let iter = 0; iter < iters; iter++) {
      if (verbose) {
        // TODO: progress_bars.push(Progress(0,num_batches))
      }

      let iter_start = Date.now()

      for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
        let prev_loss = loss
        let _loss = assertType(
          await controller.sendJSON(self.cmd({
            functionCall: 'fit',
            tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
          }), 'float'),
          'number'
        )
        if (_loss != '0') {
          loss = _loss
        }
        if (Number.isNaN(loss) || Number.isNaN(prev_loss)) {
          if (verbose) {
            // TODO: progress_bars[0].danger()
            // TODO: progress_bars[-1].danger()
          }
          break
        } else if (loss > prev_loss) {
          if (verbose) {
            // TODO: progress_bars[0].info()
            // TODO: progress_bars[-1].info()
          }
        } else {
          if (verbose) {
            // TODO: progress_bars[0].normal()
            // TODO: progress_bars[-1].normal()
          }
        }

        let elapsed = Date.now() - iter_start
        let pace = elapsed / (log_i+1)
        let remaining = Math.floor((num_batches - log_i - 1) * pace)
        let remainingStr = ''

        if (remaining > 60) {
          remainingStr += Math.floor(remaining / 60) + 'm' + (remaining % 60) + 's'
        } else {
          remainingStr += remaining + 's'
        }
        if (verbose) {
          // TODO: progress_bars[-1].update(log_i+1,[('',remaining),('loss',str(loss)),('batch',str(log_i)+'-'+str(min(log_i+log_interval,num_batches)))])
        }
      }
      if (verbose) {
        // TODO: progress_bars[-1].success()
        // TODO: progress_bars[-1].update(num_batches,[('',str(Date.now() - iter_start)),('loss',str(loss)),('batch',str(log_i)+'-'+str(min(log_i+log_interval,num_batches)))])
      }

      let elapsed = Date.now() - start
      let pace = elapsed / (iter+1)
      let remaining = Math.floor((iters - iter - 1) * pace)
      let remainingStr = ''
      if (remaining > 60) {
        remainingStr += Math.floor(remaining / 60) + 'm' + (remaining % 60) + 's'
      } else {
        remainingStr += remaining + 's'
      }
      if (verbose) {
        // TODO: progress_bars[0].update(iter,[('',remaining),('loss',loss)])
      }
      if (Number.isNaN(loss)) {
        break
      }
    }
    if (verbose) {
      // TODO: progress_bars[0].success()
    }
    return loss
  }

  async summary(
    verbose = true,
    return_instead_of_print = false
  ): Promise<string|undefined> {
    let self = this
    await self.ready()

    // let layerType = await self.getLayerType() + '_' + self.id + ' (' + str(type()).split('\'')[1].split('.')[-1] + ')'
    let layerType = `${await self.getLayerType()}_${self.id} (${self.type})`
    let outputShape = ''
    if (typeof self.outputShape == 'number') {
      outputShape = String(self.outputShape)
    } else {
      outputShape = String(self.outputShape)
    }

    let n_param = String(await self.num_parameters())
    let output = layerType + ' '.repeat(29 - layerType.length) + outputShape + ' '.repeat(26 - outputShape.length) + n_param + '\n'
    if (verbose) {
      let single = '_________________________________________________________________\n'
      let header = 'Layer (type)                 Output Shape              Param #   \n'
      let double = '=================================================================\n'
      // TODO: let total_params = 'Total params: ' + '{:,}'.format(self.num_parameters()) + '\n'
      // TODO: let trainable_params = 'Trainable params: ' + '{:,}'.format(self.num_parameters()) + '\n'
      let non_trainable_params = 'Non-trainable params: 0' + '\n'
      // TODO: output = single + header + double + output + double + total_params + trainable_params + non_trainable_params + single
    }

    if (return_instead_of_print) {
      return output
    }
    console.log(output)
    return
  }

  async length() {
    let self = this
    await self.ready()

    return (await self.models()).length
  }


  async activation() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'activation'
    }), 'FloatTensor', /*delete_after_use=false*/)
  }

  async getLayerType() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'model_type'
    }), 'string')
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
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'forward',
      tensorIndexParams: input.map(t => t.id)
    }), 'FloatTensor' /*, false*/)
  }

  // async __repr__(
  //   verbose = true
  // ) {
  //   let self = this
  //   await self.ready()
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
}

export class Policy extends Model {
  layerType: string
  stateType: string
  optimizer?: Optimizer
  model?: Model

  constructor(
    id: string|undefined,
    model?: Model,
    optimizer?: Optimizer,
    stateType = 'discrete'
  ) {
    if (model && optimizer) {
      super(void 0, [model.id, optimizer.id])
    } else {
      super(id, [])
    }

    let self = this

    self.layerType = 'policy'
    self.stateType = stateType
    self.model = model
    self.optimizer = optimizer
  }

  async sample(
    ...input: Tensor[]
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sample',
      tensorIndexParams: input.map(t => t.id)
    }), 'IntTensor')
  }

  async parameters() {
      let self = this
      await self.ready()

    if (self.model) {
      return self.model.parameters()
    }

    return []
  }

  async feed(
    ...args: any[]  //TODO: what type is this
  ) {
    let self = this
    await self.ready()

    if (self.stateType == 'discrete') {
      return await self.sample(...args)
    } else if (self.stateType == 'continuous') {
      return await self.forward(...args)
    }

    throw new Error(`Unknown State Type: ${self.stateType}`)
  }

  // async history() {
  //     let self = this
  //     await self.ready()
  //
  //   let raw_history = await controller.sendJSON(self.cmd({
  //     functionCall: 'get_history'
  //   }), 'string')
  //   // TODO: let history_idx = list(map(lambda x:list(map(lambda y:int(y),x.split(','))),raw_history[2:-1].split('],[')))
  //   let losses = []
  //   let rewards = []
  //
  //   for (let {loss, reward} of history_idx) {
  //     if (loss != -1) {
  //       losses.push(await controller.get_tensor(loss))
  //     } else {
  //       losses.push(void 0)
  //     }
  //     if (reward != -1) {
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
  layerType = 'sequential'

  constructor(
    layers?: Model[] //TODO: what type is this
  ) {
    super(void 0)
    let self = this

    if (Array.isArray(layers)) {
      for (let layer of layers) {
        self.add(layer)
      }
    }
  }

  async add(
    model: Model
  ) {
    let self = this
    await self.ready()

    await controller.sendJSON(self.cmd({
      functionCall: 'add',
      tensorIndexParams: [model.id]
    }), /*delete_after_use=false*/)
  }

  async summary() {
    let self = this
    await self.ready()

    let single = '_________________________________________________________________\n'
    let header = 'Layer (type)                 Output Shape              Param #   \n'
    let double = '=================================================================\n'
    //TODO: let total_params = 'Total params: ' + '{:,}'.format(self.num_parameters()) + '\n'
    //TODO: let trainable_params = 'Trainable params: ' + '{:,}'.format(self.num_parameters()) + '\n'
    let non_trainable_params = 'Non-trainable params: 0' + '\n'

    let output = single + header + double
    Async.each

    let mods = await Async.map(await self.models() as Model[], async (m) => {
      return await m.summary(false, true)
    })
    output += mods.join(single)
    output += double
    //TODO: output += total_params + trainable_params + non_trainable_params + single
    console.log(output)
    return output
  }
}

export class Linear extends Model {
  layerType = 'linear'

  constructor(
    id?: string,
    input_dim = 0,
    output_dim = 0,
    initializer = 'Xavier'
  ) {

    super(void 0,[input_dim, output_dim, initializer])
  }

  async finish(
    id: string
  ) {
    let self = this

    self.id = id

    let params = await self.parameters()

    // TODO: self.outputShape = Number(params[0].shape()[-1])
    // TODO: self.input_shape = Number(params[0].shape()[0])
  }

}

export class ReLU extends Model {
  layerType = 'relu'

  constructor(
    id?: string
  ) {
    super(id)
  }
}

export class Dropout extends Model {
  layerType = 'dropout'

  constructor(
    id?: string,
    rate = 0.5
  ) {
    super(id, [rate])
  }
}

export class Sigmoid extends Model {
  layerType = 'sigmoid'
  constructor(
    id?: string
  ) {
    super(id)
  }
}

export class Softmax extends Model {
  layerType = 'softmax'

  constructor(
    id?: string,
    dim = 1
  ) {
    super(id, [dim])
  }
}

export class LogSoftmax extends Model {
  layerType = 'logsoftmax'

  constructor(
    id?: string,
    dim = 1
  ) {
    super(id, [dim])
  }

}

export class Log extends Model {
  layerType = 'log'

  constructor(
    id?: string
  ) {
    super(id)
  }
}

export class Tanh extends Model {
  layerType = 'tanh'

  constructor(
    id?: string
  ) {
    super(id)
  }
}

export class MSELoss extends Model {
  layerType = 'mseloss'

  constructor(
    id?: string
  ) {
    super(id)
  }

  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'forward',
      tensorIndexParams: [input.id, target.id]
    }), 'FloatTensor' /*delete_after_use=false*/)
  }

}

export class NLLLoss extends Model {
  layerType = 'nllloss'

  constructor(
    id?: string
  ) {
    super(id)
  }


  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'forward',
      tensorIndexParams: [input.id, target.id]
    }), 'FloatTensor' /*delete_after_use=false*/)
  }
}

export class CrossEntropyLoss extends Model {
  layerType: 'crossentropyloss'

  // TODO: backward() to be implemented: grad = target - prediction
  // TODO: backward(): until IntegerTensor is available assume a one-hot vector is passed in.

  constructor(
    id?: string,
    dim = 1
  ) {
    super(id, [dim])
  }

  async forward(
    input: Tensor,
    target: Tensor
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'forward',
      tensorIndexParams: [input.id, target.id]
    }), 'FloatTensor' /*delete_after_use=false*/)
  }
}
