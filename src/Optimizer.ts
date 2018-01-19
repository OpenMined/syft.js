import * as controller from './controller'
import {
  AsyncInit,
  IAsyncInit
} from './AsyncInit'

import { assertType } from './asserts'

function get_param_ids(
  params: any[] = [] // TODO: what type is this
) {

  let param_ids = []
  for (let p of params) {
    param_ids.push(p.id)
  }
  return param_ids
}

/*
* Base class for all Optimizers to inherit from
*/
export class Optimizer extends AsyncInit implements IAsyncInit {
  id: string
  type: string
  optimizer_type: string

  constructor(
    id?: string,
    optimizer_type = '',
    params: any[] = [],
    h_params: any[] = []
  ) {
    super()
    let self = this

    self.optimizer_type = optimizer_type
    self.type = 'Optimizer'

    controller.sendJSON(self.cmd({
      functionCall: 'create',
      tensorIndexParams: [self.optimizer_type, ...params], h_params
    }), 'string')
      .then(res => self.__finish__(res as string))
      .catch(err => self.__error__(err))
  }

  finish(
    id: string
  ) {
    let self = this

    self.id = id
  }

  async zero_grad() {
    let self = this
    await self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'zero_grad'
      }), 'string'),
      'string'
    )
  }

  async step(
    batch_size: number,
    iteration: number // TODO: what type is this
  ) {
    let self = this
    await self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'step',
        tensorIndexParams: [batch_size, iteration]
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
      objectIndex: self.id,
      tensorIndexParams: [],
      hyperParams: [],
      ...options
    }
  }
}

/*
* Stochastic Gradient Descent optimizer.
* Includes support for momentum and learning rate decay
*/
export class SGD extends Optimizer {
  constructor(
    params: any[],
    lr = 0.01,
    momentum = 0,
    decay = 0
  ){
    super(void 0,'sgd', get_param_ids(params), [String(lr), String(momentum), String(decay)])
  }
}

/*
* RMSProp Optimizer
*/
export class RMSProp extends Optimizer {
  constructor(
    params: any[],
    lr = 0.01,
    rho = 0.9,
    epsilon = 1e-6,
    decay = 0
  ) {
    super(void 0,'rmsprop', get_param_ids(params), [String(lr), String(rho), String(epsilon), String(decay)])
  }
}

/*
* Adam Optimizer
*/
export class Adam extends Optimizer {
  constructor(
    params: any[],
    lr = 0.01,
    beta_1 = 0.9,
    beta_2 = 0.999,
    epsilon = 1e-6,
    decay = 0
  ){
    super(void 0, 'adam', get_param_ids(params), [String(lr), String(beta_1), String(beta_2), String(epsilon), String(decay)])
  }
}
