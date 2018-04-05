import * as controller from '../controller'

import {
  assertType,
  AsyncInstance,
  IAsyncConstructor
} from '../lib'

function getParamIds(
  params: any[] = [] // TODO: what type is this
) {

  let paramIds = []
  for (let p of params) {
    paramIds.push(p.id)
  }
  return paramIds
}

/**
* A base-class for Syft Optimizers to inherit from.
*/
export class Optimizer extends AsyncInstance {
  /**
  * Syft object type.
  */
  type = 'Optimizer'

  /**
  * Syft Optimizer type.
  */
  optimizerType: string = ''

  /**
  * Creates a local instance of a network connected Optimizer.
  *
  * @param optimizerType  The model constructor of which to create.
  * @param params         Parameters specific to the model constructor.
  * @param hyperParams    Hyper parameters specific to the model constructor.
  *
  * @returns  A local instance of a network connected model.
  */
  static async createOptomizer(
    optimizerType: Function,
    params: any[] = [],
    hyperParams: any[] = []
  ): Promise<string> {
    return assertType(
      await controller.sendJSON({
        objectType: 'Optimizer',
        functionCall: 'create',
        tensorIndexParams: [optimizerType.name.toLowerCase(), ...params],
        hyperParams
      }, 'string'),
      'string'
    ) as string
  }

  /**
  * TODO document this?
  */
  async zeroGrad() {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'zero_grad'
      }), 'string'),
      'string'
    )
  }

  /**
  * TODO document this?
  *
  * @param batchSize  TODO document this?
  * @param iteration  TODO document this?
  *
  * @return TODO document this?
  */
  async step(
    batchSize: number,
    iteration: number
  ) {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'step',
        tensorIndexParams: [batchSize, iteration]
      }), 'string'),
      'string'
    )
  }

  /**
  * Creates a command object for this Optimizer.
  *
  * @param options.functionCall       The function to call.
  * @param options.tensorIndexParams  The labels for the training dataset.
  * @param options[<key>]             Other options.
  *
  * @returns  A command object.
  */
  cmd(
    options: {
      [key: string]: any
      functionCall: string
      tensorIndexParams?: any[],
    }
  ): SocketCMD {

    return {
      objectType: this.type,
      objectIndex: this.id,
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
    args: {
      params: any[],
      lr?: number,
      momentum?: number,
      decay?: number
    }
  ):  Promise<SGD>
}

export interface RMSPropConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): RMSProp
  get(id: string): Promise<RMSProp>
  create(
    args: {
      params: any[],
      lr?: number,
      rho?: number,
      epsilon?: number,
      decay?: number
    }
  ): Promise<RMSProp>
}

export interface AdamConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): Adam
  get(id: string): Promise<Adam>
  create(
    args: {
      params: any[],
      lr?: number,
      beta1?: number,
      beta2?: number,
      epsilon?: number,
      decay?: number
    }
  ): Promise<Adam>
}

/**
* Stochastic Gradient Descent optimizer.
* Includes support for momentum and learning rate decay
*/
export class SGD extends Optimizer {
  static $: IAsyncConstructor = SGD

  /**
  * Creates a new SGD Optimizer.
  *
  * @param args.params    The Model parameters to optimize.
  * @param args.lr        TODO document this? (default 0.01)
  * @param args.momentum  TODO document this? (default 0)
  * @param args.decay     TODO document this? (default 0)
  *
  * @returns  A local instance of a network connected SGD Optimizer.
  */
  static async create({
    params,
    lr = 0.01,
    momentum = 0,
    decay = 0
  }: {
    params: any[],
    lr?: number,
    momentum?: number,
    decay?: number
  }) {
    let id = await Optimizer.createOptomizer(
      this,
      getParamIds(params),
      [String(lr), String(momentum), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  /**
  * Get a SGD Optimizer given its ID
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected SGD Optimizer.
  */
  static async get(
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

/**
* RMSProp Optimizer
*/
export class RMSProp extends Optimizer {
  static $: IAsyncConstructor = RMSProp

  /**
  * Creates a new RMSProp Optimizer.
  *
  * @param args.params   The Model parameters to optimize.
  * @param args.lr       TODO document this? (default 0.01)
  * @param args.rho      TODO document this? (default 0.9)
  * @param args.epsilon  TODO document this? (default 1e-6)
  * @param args.decay    TODO document this? (default 0)
  *
  * @returns  A local instance of a network connected RMSProp Optimizer.
  */
  static async create({
    params,
    lr = 0.01,
    rho = 0.9,
    epsilon = 1e-6,
    decay = 0
  }: {
    params: any[],
    lr?: number,
    rho?: number,
    epsilon?: number,
    decay?: number
  }) {
    let id = await Optimizer.createOptomizer(
      this,
      getParamIds(params),
      [String(lr), String(rho), String(epsilon), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  /**
  * Get a RMSProp Optimizer given its ID
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected RMSProp Optimizer.
  */
  static async get (
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

/**
* Adam Optimizer
*/
export class Adam extends Optimizer {
  static $: IAsyncConstructor = Adam

  /**
  * Creates a new RMSProp Optimizer.
  *
  * @param args.params   The Model parameters to optimize.
  * @param args.lr       TODO document this? (default 0.01)
  * @param args.beta1    TODO document this? (default 0.9)
  * @param args.beta2    TODO document this? (default 0.999)
  * @param args.epsilon  TODO document this? (default 1e-6)
  * @param args.decay    TODO document this? (default 0)
  *
  * @returns  A local instance of a network connected RMSProp Optimizer.
  */
  static async create({
    params,
    lr = 0.01,
    beta1 = 0.9,
    beta2 = 0.999,
    epsilon = 1e-6,
    decay = 0
  }: {
    params: any[],
    lr?: number,
    beta1?: number,
    beta2?: number,
    epsilon?: number,
    decay?: number
  }) {
    let id = await Optimizer.createOptomizer(
      this,
      getParamIds(params),
      [String(lr), String(beta1), String(beta2), String(epsilon), String(decay)]
    )
    return new this(AsyncInstance, id)
  }

  /**
  * Get a Adam Optimizer given its ID
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected Adam Optimizer.
  */
  static async get(
    id: string
  ) {
    // TODO: check to make sure the optimizer exsist and it the same type
    return new this(AsyncInstance, id)
  }
}

Optimizer.SGD = SGD
Optimizer.RMSProp = RMSProp
Optimizer.Adam = Adam
