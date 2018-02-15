import * as controller from '../controller'

import {
  assertType,
  AsyncInstance,
  IAsyncConstructor
} from '../lib'

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
export class Optimizer extends AsyncInstance {
  type = 'Optimizer'
  optimizer_type: string = ''

  static async createOptomizer(
    optimizer_type: Function,
    params: any[] = [],
    hyperParams: any[] = []
  ): Promise<string> {
    return assertType(
      await controller.sendJSON({
        objectType: 'Optimizer',
        functionCall: 'create',
        tensorIndexParams: [optimizer_type.name.toLowerCase(), ...params],
        hyperParams
      }, 'string'),
      'string'
    ) as string
  }

  finish(
    id: string
  ) {
    let self = this

    self.id = id
  }

  async zero_grad() {
    let self = this
    self.ready()

    return assertType(
      await controller.sendJSON(self.cmd({
        functionCall: 'zero_grad'
      }), 'string'),
      'string'
    )
  }

  async step(
    batch_size: number,
    iteration: number
  ) {
    let self = this
    self.ready()

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

  static SGD: SGDConstructor
  static RMSProp: RMSPropConstructor
  static Adam: AdamConstructor
}

export interface SGDConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): SGD
  get(id: string): Promise<SGD>
  create(
    params: any[],
    lr?: number,
    momentum?: number,
    decay?: number
  ):  Promise<SGD>
}

export interface RMSPropConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): RMSProp
  get(id: string): Promise<RMSProp>
  create(
    params: any[],
    lr?: number,
    rho?: number,
    epsilon?: number,
    decay?: number
  ): Promise<RMSProp>
}

export interface AdamConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Adam
  get(id: string): Promise<Adam>
  create(
    params: any[],
    lr?: number,
    beta_1?: number,
    beta_2?: number,
    epsilon?: number,
    decay?: number
  ): Promise<Adam>
}

/*
* Stochastic Gradient Descent optimizer.
* Includes support for momentum and learning rate decay
*/
export class SGD extends Optimizer {
  static $: IAsyncConstructor = SGD

  static async create (
    params: any[],
    lr = 0.01,
    momentum = 0,
    decay = 0
  ) {
    let id = await Optimizer.createOptomizer(
      this,
      get_param_ids(params),
      [String(lr), String(momentum), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  static async get (
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

/*
* RMSProp Optimizer
*/
export class RMSProp extends Optimizer {
  static $: IAsyncConstructor = RMSProp

  static async create (
    params: any[],
    lr = 0.01,
    rho = 0.9,
    epsilon = 1e-6,
    decay = 0
  ) {
    let id = await Optimizer.createOptomizer(
      this,
      get_param_ids(params),
      [String(lr), String(rho), String(epsilon), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  static async get (
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

/*
* Adam Optimizer
*/
export class Adam extends Optimizer {
  static $: IAsyncConstructor = Adam

  static async create (
    params: any[],
    lr = 0.01,
    beta_1 = 0.9,
    beta_2 = 0.999,
    epsilon = 1e-6,
    decay = 0
  ) {
    let id = await Optimizer.createOptomizer(
      this,
      get_param_ids(params),
      [String(lr), String(beta_1), String(beta_2), String(epsilon), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  static async get (
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

Optimizer.SGD = SGD
Optimizer.RMSProp = RMSProp
Optimizer.Adam = Adam
