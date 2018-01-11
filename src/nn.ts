import Async from 'promasync'
import * as controller from './controller'
// from syft.utils import Progress
import {
  Tensor,
  FloatTensor
} from './Tensor'

import {
  DimArray,
  FloatDimArray
} from './DimArray'
// import sys, time
// import numpy as np

import {
  AsyncInit,
  IAsyncInit
} from './AsyncInit'

export class Model extends AsyncInit implements IAsyncInit {
  id?: string
  params: boolean
  type: string
  output_shape?: string // TODO: what type is this
  _layer_type: string

  constructor(
    id?: string,
    layer_type: string,
    params: any[] = []
  ) {
    super()

    let self = this
    self.params = false
    self._layer_type = layer_type
    self.type = 'model'
    self.output_shape = '(dynamic)'

    if (id) {
      self.__finish__(id)
    } else {
      controller.send_json(self.cmd('create', [self._layer_type, ...params]))
        .then(res => self.__finish__(res))
        .catch(err => self.__error__(err))
    }
  }

  finish(
    id: string
  ) {
    let self = this

    self.id = id
  }

  async discover() {
    let self = this
    await self.ready()

    self._layer_type = await self.layer_type()

    if (self._layer_type == 'linear') {
      return new Linear(self.id)
    } else if (self._layer_type == 'sigmoid') {
      return new Sigmoid(self.id)
    } else if (self._layer_type == 'crossentropyloss') {
      return new CrossEntropyLoss(self.id)
    } else if (self._layer_type == 'tanh') {
      return new Tanh(self.id)
    } else if (self._layer_type == 'dropout') {
      return new Dropout(self.id)
    } else if (self._layer_type == 'softmax') {
      return new Softmax(self.id)
    } else if (self._layer_type == 'logsoftmax') {
      return new LogSoftmax(self.id)
    } else if (self._layer_type == 'relu') {
      return new ReLU(self.id)
    } else if (self._layer_type == 'log') {
      return new Log(self.id)
    } else if (self._layer_type == 'policy') {
      return new Policy(self.id)
    } else {
      console.log(
        'Attempted to discover the type - but it wasn\'t supported. Has the layer type '
        + self._layer_type + ' been added to the discover() method in nn.js?'
      )
    }
  }

  async __call__(...args: any[]) {
    let self = this
    await self.ready()

    if (args.length == 1) {
      return await self.forward(args[0])
    } else if (args.length == 2) {
      return await self.forward(args[0], args[1])
    } else if (args.length == 3) {
      return await self.forward(args[0], args[1], args[2])
    }
  }
  async parameters() {
    let self = this
    await self.ready()

    return controller.no_params_func(self.cmd, 'params', 'FloatTensor_list', false)
  }

  async num_parameters() {
    let self = this
    await self.ready()

    return controller.no_params_func(self.cmd, 'param_count', 'int')
  }

  async models() {
    let self = this
    await self.ready()

    return controller.no_params_func(self.cmd, 'models', 'Model_list')
  }

  async set_id(
    new_id: string
  ) {
    let self = this
    await self.ready()

    await controller.params_func(self.cmd, 'set_id', [new_id], 'string')

    self.id = new_id
    return self
  }

  async fit(
    input: number[]|Tensor,
    target: number[]|Tensor,
    criterion,
    optim,
    batch_size: number,
    iters = 15,
    log_interval = 200,
    metrics=[],
    verbose = true
  ) {
    let self = this
    await self.ready()

    if (Array.isArray(input)) {
      input = new FloatTensor(input, autograd=true, delete_after_use=false)
    }
    if (Array.isArray(target)) {
      target = new FloatTensor(target, autograd=true, delete_after_use=false)
    }

    let num_batches = await controller.params_func(self.cmd,'prepare_to_fit',[input.id, target.id, criterion.id, optim.id, batch_size], return_type='int')

    console.log(`Number of Batches:${num_batches}`)

    let progress_bars = []
    if (verbose) {
      // TODO: progress_bars.push(Progress(0,iters-1))
    }

    let start = time.time()
    let loss = 100000
    for (let iter = 0; iter < iters; iter++) {
      if (verbose) {
        // TODO: progress_bars.push(Progress(0,num_batches))
      }

      let iter_start = time.time()

      for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
        let prev_loss = loss
        let _loss = await controller.params_func(self.cmd,'fit',[log_i, Math.min(log_i + log_interval, num_batches), 1], return_type='float')
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

        let elapsed = time.time() - iter_start
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
        // TODO: progress_bars[-1].update(num_batches,[('',str(time.time() - iter_start)),('loss',str(loss)),('batch',str(log_i)+'-'+str(min(log_i+log_interval,num_batches)))])
      }

      let elapsed = time.time() - start
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

    // let layer_type = await self.layer_type() + '_' + self.id + ' (' + str(type()).split('\'')[1].split('.')[-1] + ')'
    let layer_type = `${await self.layer_type()}_${self.id} (${self.type})`
    let output_shape = ''
    if (typeof self.output_shape == 'number') {
      output_shape = String(self.output_shape)
    } else {
      output_shape = String(self.output_shape)
    }

    let n_param = String(await self.num_parameters())
    let output = layer_type + ' '.repeat(29 - layer_type.length) + output_shape + ' '.repeat(26 - output_shape.length) + n_param + '\n'
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

  async __len__() {
    let self = this
    await self.ready()

    return (await self.models()).length
  }

  async __getitem__(
    idx: number
  ) {
    let self = this
    await self.ready()

    return (await self.parameters())[idx]
  }

  async activation()  {
    let self = this
    await self.ready()

    return controller.no_params_func(self.cmd, 'activation', 'FloatTensor', delete_after_use=false)
  }

  async layer_type() {
    let self = this
    await self.ready()

    return controller.no_params_func(self.cmd, 'model_type', 'string')
  }

  cmd(
    function_call: string,
    params: any[] = []
  ) {
    let self = this

    return {
      functionCall: function_call,
      objectType: self.type,
      objectIndex: self.id,
      tensorIndexParams: params
    }
  }

  async forward(
    input: Tensor
  ) {
    let self = this
    await self.ready()

    return controller.params_func(self.cmd, 'forward', [input.id], 'FloatTensor', false)
  }

  async __repr__(
    verbose = true
  ) {
    let self = this
    await self.ready()

    if (verbose) {
      let output = ''
      output += self.__repr__(false) + '\n'
      for (let p of await self.parameters()) {
        output += '\t W:' + p.__repr__(false)
      }
      let activation = await self.activation()
      if (activation) {
        output += '\t A:' + activation.__repr__(verbose=false) + '\n'
      }
      return output
    } else {
      return `<syft.nn.${self._layer_type} at ${self.id}>`
    }
  }
}

export class Policy extends Model {
  state_type: any // TODO: what type is this
  optimizer: any  // TODO: what type is this
  constructor(
    model: any, // TODO: what type is this
    optimizer: any,
    state_type='discrete'
  ) {
    super(, 'policy', [model.id, optimizer.id])
    let self = this

    self.state_type = state_type
    self.optimizer = optimizer
  }

  async sample(
    input: Tensor
  ) {
    let self = this
    await self.ready()

    return controller.params_func(self.cmd,'sample',[input.id],return_type='IntTensor')
  }

  async parameters() {
      let self = this
      await self.ready()

    return self.model.parameters()
  }

  async __call__(
    ...args: any[]  //TODO: what type is this
  ) {
      let self = this
      await self.ready()

    if (self.state_type == 'discrete'){
      if (args.length == 1){
        return self.sample(args[0])
      } else if (args.length == 2) {
        return self.sample(args[0], args[1])
      } else if (args.length == 3) {
        return self.sample(args[0], args[1], args[2])
      }

    } else if (self.state_type == 'continuous'){
      if (args.length == 1){
        return self.forward(args[0])
      } else if (args.length == 2) {
        return self.forward(args[0], args[1])
      } else if (args.length == 3) {
        return self.forward(args[0], args[1], args[2])
      }

    }else{
      console.log(`Error: State type ${self.state_type} unknown`)
    }
  }

  async history() {
      let self = this
      await self.ready()

    let raw_history = await controller.params_func(self.cmd,'get_history',[],return_type='string')
    let history_idx = list(map(lambda x:list(map(lambda y:int(y),x.split(','))),raw_history[2:-1].split('],[')))
    let losses = []
    let rewards = []

    for (let loss, reward of history_idx) {
      if (loss != -1) {
        losses.push(await controller.get_tensor(loss))
      }else{
        losses.push(void 0)
      }
      if (reward != -1){
        rewards.push(await controller.get_tensor(reward))
      }else{
        rewards.push(void 0)
      }
    }

    return [losses, rewards]
  }
}

export class Sequential extends Model {

  constructor(
    layers?: Model[] //TODO: what type is this
  ) {
    super(, 'sequential')

    if (Array.isArray(layers)) {
      for (let layer of layers){
        self.add(layer)
      }
    }
  }

  async add(
    model: Model
  ) {
    let self = this
    await self.ready()

    await controller.params_func(self.cmd, 'add', [model.id], delete_after_use=false)
  }

  async summary(){
    let self = this
    await self.ready()

    let single = '_________________________________________________________________\n'
    let header = 'Layer (type)                 Output Shape              Param #   \n'
    let double = '=================================================================\n'
    //TODO: let total_params = 'Total params: ' + '{:,}'.format(self.num_parameters()) + '\n'
    //TODO: let trainable_params = 'Trainable params: ' + '{:,}'.format(self.num_parameters()) + '\n'
    let non_trainable_params = 'Non-trainable params: 0' + '\n'

    let output = single + header + double

    let mods = Async.forEach(await self.models(), async (m) => {
      return await m.summary(false, true)
    })
    output += mods.join(single)
    output += double
    //TODO: output += total_params + trainable_params + non_trainable_params + single
    console.log(output)
}

  async __repr__(){
    let self = this
    await self.ready()

    let output = ''
    for (let m of await self.models()):
      output += m.__repr__()
    return output
  }

  async __getitem__(
    idx: number
  ){
    let self = this
    await self.ready()

    return (await self.models())[idx]
  }
}

export class Linear extends Model {

  constructor(
    input_dim = 0,
    output_dim = 0,
    id?: string,
    initializer = 'Xavier'
  ) {

    super(, 'linear',[input_dim, output_dim, initializer])
  }

  async finish(
    id: string
  ) {
    let self = this

    self.id = id

    await self.ready()

    let params = await self.parameters()

    // TODO: self.output_shape = Number(params[0].shape()[-1])
    // TODO: self.input_shape = Number(params[0].shape()[0])
  }

}

export class ReLU extends Model {
  constructor(
    id?: string
  ){
    super(id,'relu')
  }
}

export class Dropout extends Model {
  constructor(
    id?: string,
    rate = 0.5
  ){
    super(id, 'dropout', [rate])
  }
}

export class Sigmoid extends Model {
  constructor(
    id?: string
  ) {
    super(id, 'sigmoid')
  }
}

export class Softmax extends Model {
  constructor(
    id?: string,
    dim=1
  ) {
    super(id, 'softmax', [dim])
  }
}

export class LogSoftmax extends Model {
  constructor(
    id?: string,
    dim=1
  ) {
    super(id, 'logsoftmax', [dim])
  }

}

export class Log extends Model {
  constructor(id?: string) {
    super(id, 'log')
  }
}

export class Tanh extends Model {
  constructor(id?: string){
    super(id, 'tanh')
  }
}

export class MSELoss extends Model {
  constructor(id?: string){
    super(id, 'mseloss')
  }

  async forward(
    input: Tensor,
    target: Tensor
  ){
    let self = this
    await self.ready()

    return await controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type='FloatTensor', delete_after_use=false)
  }

}

export class NLLLoss extends Model {
  constructor(id?: string) {
    super(id, 'nllloss')
  }


  async forward(
    input: Tensor,
    target: Tensor
  ){
    let self = this
    await self.ready()

    return await controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type='FloatTensor', delete_after_use=false)
  }
}

export class CrossEntropyLoss extends Model {

  // TODO: backward() to be implemented: grad = target - prediction
  // TODO: backward(): until IntegerTensor is available assume a one-hot vector is passed in.

  constructor(
    id?: string,
    dim=1
  ){
    super(id, 'crossentropyloss', [dim])
  }

  async forward(
    input: Tensor,
    target: Tensor
  ){
    let self = this
    await self.ready()

    return await controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type='FloatTensor', delete_after_use=false)
  }
}
