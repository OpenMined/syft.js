import * as controller from '../controller'

import {
  assertType,
  AsyncInstance,
  IAsyncConstructor,
  FloatDimArray,
  IntDimArray
} from '../lib'

/**
* A base-class for Syft Tensor to inherit from.
*/
export class Tensor extends AsyncInstance {
  /**
  * Syft object type.
  */
  type: string = ''

  /**
  * Deletes the input tensor.
  */
  async delete(): Promise<void> {

    this.__delete__()

    this.ready()

    if (this.id) {
      await controller.sendJSON(this.cmd({
        functionCall: 'delete'
      }))
    }
  }

  /**
  * TODO document this?
  *
  * @param state  TODO document this?
  */
  async autograd(
    state: boolean
  ): Promise<void> {
    this.ready()

    // do nothing
  }

  /**
  * TODO document this?
  *
  * @param paramName         TODO document this?
  * @param responseAsTensor  TODO document this?
  *
  * @returns  TODO document this?
  */
  async get(
    paramName = 'size',
    responseAsTensor = false
  ): Promise<Tensor|string> {
    this.ready()

    if (responseAsTensor) {
      return assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'get',
          tensorIndexParams: [paramName]
        }), this.type),
        this.constructor
      )
    } else {
      return assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'get',
          tensorIndexParams: [paramName]
        }), 'string'),
        'string'
      )
    }
  }

  protected cmd(
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

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async isContiguous(): Promise<boolean> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'is_contiguous'
      }), 'bool'),
      'boolean'
    )
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async getData(): Promise<number[]|string> {
    this.ready()

    let res

    if (await this.isContiguous()) {
      res = assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'to_numpy'
        }), 'string'),
        'string'
      ) as string

      return res.split(' ').map(a => Number(a))
    } else {
      return ' - non-contiguous - '
    }
  }

  /**
  * TODO document this?
  *
  * @param verbose  TODO document this?
  *
  * @returns  TODO document this?
  */
  async __repr__(
    verbose = true
  ) {
    this.ready()

    let tensorStr = await this.getData()

    let typeStr = (await this.shape() as number[]).join('x')

    let grad = await this.get('grad')
    if (grad === '') {
      grad = 'None'
    }

    let co = String(await this.creationOp())

    let desc = `[syft.${this.type}: ${this.id} grad: ${grad} size: ${typeStr} init: ${co}]\n`

    if (verbose) {
      let children = await this.children()
      let creators = await this.creators()

      if (children.length > 0) {
        // tensorStr = '\n -------------------------------\n' + tensorStr
        desc += '\n\t-----------children-----------\n'
      }
      for (let childId of children) {
        let child = new FloatTensor(AsyncInstance, childId)
        desc += '\t' + await child.__repr__(false)
      }
      if (children.length > 0) {
        if (creators.length > 0) {

          desc += '\t------------------------------\n'
        } else {
          desc += '\t------------------------------\n\n\n'
        }
      }
      if (creators.length > 0) {
        // tensorStr = '\n -------------------------------\n' + tensorStr
        desc += '\n\t-----------creators-----------\n'
      }
      for (let parentId of creators) {
        let parent = new FloatTensor(AsyncInstance, parentId)
        desc += '\t' + await parent.__repr__(false)
      }
      if (creators.length > 0) {
        desc += '\t------------------------------\n\n\n'
      }
      return tensorStr + '\n' + desc
    }
    return desc
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  * @param batchSize  TODO document this?
  *
  * @returns  TODO document this?
  */
  async batchify(
    dim: number,
    batchSize: number
  ): Promise<this[]> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'batchify',
        tensorIndexParams: [dim, batchSize]
      }), 'FloatTensor_list'),
      Array
    )
  }

  /**
  * Clamp all elements in input into the range [min, max].
  *
  * @param min  Lower-bound of the range to be clamped to.
  * @param max  Upper-bound of the range to be clamped to.
  *
  * @returns  Output tensor
  */
  // TODO: is this inline or not?
  async clamp(
    min?: number,
    max?: number
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'clamp',
        tensorIndexParams: [min, max]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Determines whether the given tensor has the same size and elements as this instance.
  *
  * @param x  An other Tensor to compare.
  *
  * @returns  True if the given Tensor has the same size and elements as this instance. Otherwise, False.
  */
  async equal(
    x: this
  ): Promise<boolean> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'equal',
        tensorIndexParams: [x.id]
      }), 'bool'),
      'boolean'
    )
  }

  /**
  * Performs element-wise > comparison and returns 1 if the element
  * is less than a corresponding element in other Tensor, and 0 otherwise.
  *
  * @param x  An other Tensor to compare.
  *
  * @returns  A new Tensor with results of the comparison.
  */
  async lt(
    x: this
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'lt',
        tensorIndexParams: [x.id]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs inline element-wise > comparison and returns 1 if the element
  * is less than a corresponding element in other Tensor, and 0 otherwise.
  *
  * @param x  An other Tensor to compare.
  *
  * @returns  This instance.
  */
  async lt_(
    x: this
  ): Promise<this> {
    this.ready()

    assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'lt_',
        tensorIndexParams: [x.id]
      }), this.type),
      this.constructor
    )

    return this
  }

  /**
  * Returns the p-norm of each row of the input tensor in the given dimension dim.
  *
  * @param dim      The dimension to reduce
  * @param keepdim  Whether the output tensors have dim retained or not
  * @param p        The exponent value in the norm formulation
  *
  * @returns  Output tensor
  */
  // TODO: is this inline or not?
  async norm(
    dim = -1,
    keepdim = false,
    p = 2
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'norm',
        tensorIndexParams: [dim, keepdim, p]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns a tensor filled with random numbers from a uniform distribution on the interval [0,1)
  *
  * @returns  This Tensor.
  */
  async random_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'random_'
    }), this.type)

    return this
  }

  /**
  * Splits the tensor into chunks. If splitSizeOrSections is an integer type,
  * then tensor will be split into chunks of size splitSizeOrSections (if possible).
  * Last chunk will be smaller if the tensor size along a given dimension is not
  * divisible by split_size. If splitSizeOrSections is a list, then tensor will
  * be split into len(splitSizeOrSections) chunks with sizes in dim according to
  * splitSizeOrSections.
  *
  * @param  splitSizeOrSections  Size of a single chunk or of sizes for each chunk.
  * @param  dim  Dimension along which to split the tensor.
  */
  // TODO: figure this out
  async split(
    splitSizeOrSections: number,
    dim = 0
  ): Promise<this[]> {
    this.ready()

    // if (typeof splitSizeOrSections === 'number') {
      return assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'split_by_size',
          tensorIndexParams: [splitSizeOrSections, dim]
        }), 'FloatTensor_list'),
        Array
      )
    // }
    // splitSizeOrSections = list(splitSizeOrSections)
    // assert type(splitSizeOrSections) === list
    // assert type(splitSizeOrSections[0]) === int
    // return this.controller.params_func(
    //   cmd_func=this.cmd,
    //   name='split_by_sections',
    //   params=splitSizeOrSections+[dim],
    //   return_type='FloatTensor_list'
    // )
  }




  ///////////////////////////////////
  // Tensor Manipulation Functions //
  ///////////////////////////////////

  /**
  * Returns absolute value of tensor as a new tensor.
  *
  * @returns  Output tensor.
  */
  async abs(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'abs'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Replaces tensor values with its absolute value.
  *
  * @returns  This Tensor.
  */
  async abs_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'abs_'
    }))

    return this
  }

  /**
  * Returns a new Tensor with the arccosine of the elements of input.
  *
  * @returns  Output tensor.
  */
  async acos(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'acos'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs inplace arccosine operation of the elements of input.
  *
  * @returns  This Tensor.
  */
  async acos_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'acos_'
    }))

    return this
  }

  /**
  * Performs a matrix multiplication of the matrices 'x' and 'y'.
  * The caller matrix 'this' is added to the final result inplace.
  *
  * @param x  First tensor for multiplication.
  * @param y  Second tensor for multiplication.
  *
  * @returns  This Tensor.
  */
  async addmm_(
    x: Tensor,
    y: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready(),
      y.ready()
    ])

    await controller.sendJSON(this.cmd({
      functionCall: 'addmm_',
      tensorIndexParams: [x.id, y.id]
    }))

    return this
  }

  /**
  * Performs a matrix multiplication of the matrices 'x' and 'y'.
  * The caller matrix 'this' is added to the final result.
  *
  * @param x  First tensor for multiplication.
  * @param y  Second tensor for multiplication.
  *
  * @returns  Output tensor.
  */
  async addmm(
    x: Tensor,
    y: Tensor
  ): Promise<this> {

    await Promise.all([
      this.ready(),
      x.ready(),
      y.ready()
    ])

    let copy = await this.copy()
    await copy.addmm_(x, y)

    return copy
  }

  /**
  * Performs a matrix-vector product of the matrix x and the vector vec.
  * The vector tensor is added to the final result inplace.
  *
  * @param x  Tensor for multiplication.
  * @param vec  Vector for Matrix-Vector Product.
  *
  * @returns  This Tensor.
  */
  async addmv_(
    x: Tensor,
    y: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready(),
      y.ready()
    ])

    await controller.sendJSON(this.cmd({
      functionCall: 'addmv_',
      tensorIndexParams: [x.id, y.id]
    }))

    return this
  }

  /**
  * Performs a matrix-vector product of the matrix x and the vector vec.
  * The vector tensor is added to the final result.
  *
  * @param x  Tensor for multiplication.
  * @param y  Vector for Matrix-Vector Product.
  *
  * @returns  Output tensor.
  */
  async addmv(
    x: Tensor,
    y: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready(),
      y.ready()
    ])

    let copy = await this.copy()
    await copy.addmv_(x, y)

    return copy
  }

  /**
  * Returns a new Tensor with the arcsine of the elements of input.
  *
  * @returns  Output tensor.
  */
  async asin(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'asin'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs inplace arcsine operation of the elements of input.
  *
  * @returns  This Tensor.
  */
  async asin_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'asin_'
    }))

    return this
  }

  /**
  * Returns a new Tensor with the arctangent of the elements of input.
  *
  * @returns  Output tensor.
  */
  async atan(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'atan'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs inplace arctangent operation of the elements of input.
  *
  * @returns  This Tensor.
  */
  async atan_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'atan_'
    }))

    return this
  }

  /**
  * TODO document this?
  *
  * @param grad  TODO document this?
  */
  async backward(
    grad?: any // TODO: get the type of grad
  ) {
    this.ready()

    if (grad == null) {
      await controller.sendJSON(this.cmd({
        functionCall: 'backward'
      }))
    } else {
      await controller.sendJSON(this.cmd({
        functionCall: 'backward',
        tensorIndexParams: [grad.id]
      }))
    }
  }

  /**
  * Performs the ceiling of the input tensor element-wise.
  *
  * @returns  Output tensor.
  */
  async ceil(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'ceil'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs the inplace ceiling of the input tensor element-wise.
  *
  * @returns  This Tensor.
  */
  async ceil_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'ceil_'
    }))

    return this
  }

  /**
  * Returns a copy of the input.
  *
  * @returns  Output tensor.
  */
  async contiguous(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'contiguous'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns a copy of the input.
  *
  * @returns  Output tensor.
  */
  async copy(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'copy'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns a new Tensor with the cosine of the elements of input.
  *
  * @returns  Output tensor.
  */
  async cos(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'cos'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs the cosine of the input tensor inplace.
  *
  * @returns  This Tensor.
  */
  async cos_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'cos_'
    }))

    return this
  }

  /**
  * Returns a new Tensor with hyperbolic cosine of the elements of input.
  *
  * @returns  Output tensor
  */
  async cosh(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'cosh'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the hyperbolic cosine of the input inplace.
  *
  * @returns  This Tensor.
  */
  async cosh_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'cosh_'
    }))

    return this
  }

  /**
  * Returns an iterator over immediate children modules.
  *
  * @returns eturns a list of children
  */
  async children() {
    this.ready()

    let res = await this.get('children')
    if (res && typeof res === 'string') {
      // TODO: figure this out
      return [] // list(map(lambda x: Number(x), res.split(',')[0:-1]))
    }
    return []
  }

  async creationOp() {
    this.ready()

    return this.get('creation_op')
  }

  /**
  * Returns an iterator over immediate creators of input tensor.
  *
  * @returns  A list of creators.
  */
  async creators() {
    this.ready()

    let res = await this.get('creators')
    if (typeof res === 'string' && res.length > 0) {
      // TODO: figure this out
      // list(map(lambda x: Number(x), res.split(',')[0:-1]))
      return res.split(',').slice(0, -1)
    }
    return []
  }

  /**
  * Returns the sum of all elements in the input tensor.
  * TODO: Remove this???  duplicate of sum(dim, keepdim)
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async cumsum(dim = 0): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'cumsum',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Tells if this Tensor's data is on GPU memory.
  *
  * @returns  True if data is on GPU memory. False otherwise.
  */
  async dataOnGpu() {
    this.ready()

    if (await this.get('dataOnGpu') === '1') {
      return true
    }
    return false
  }

  /**
  * Computes the exponential of each element of input tensor.
  *
  * @returns  Output tensor
  */
  async exp(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'exp'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the exponential of each element of input tensor inplace.
  *
  * @returns  This Tensor.
  */
  async exp_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'exp_'
    }))

    return this
  }

  /**
  * Returns the tensor, with values repeated across one dimension
  * TODO: @justin is this inline or does it return a new tensor?
  *
  * @param args  The new, expanded size.
  *
  * @returns  The new, expanded tensor.
  */
  async expand(
    ...args: number[]
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'expand',
        tensorIndexParams: args
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param indices  TODO document this?
  * @param dim      TODO document this?
  * @param x        TODO document this?
  *
  * @returns  TODO document this?
  */
  async indexAdd(
    indices: any, // TODO: what type is this?
    dim: number,
    x: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready()
    ])

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'index_add',
        tensorIndexParams: [indices.id, dim, x.id]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param indices  TODO document this?
  * @param dim      TODO document this?
  * @param x        TODO document this?
  *
  * @returns  This Tensor.
  */
  async indexAdd_(
    indices: any, // TODO: what type is this?
    dim: number,
    x: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready()
    ])

    await controller.sendJSON(this.cmd({
      functionCall: 'index_add_',
      tensorIndexParams: [indices.id, dim, x.id]
    }), this.type)

    return this
  }

  /**
  * TODO document this?
  *
  * @param indices  TODO document this?
  * @param dim      TODO document this?
  *
  * @returns  TODO document this?
  */
  async indexSelect(
    dim: number,
    indices: any // TODO: what type is this?
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'index_select',
        tensorIndexParams: [indices.id, dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async keepgrad() {
    this.ready()

    if (await this.get('keepgrad') === '1') {
        return true
    } else {
      return false
    }
  }

  /**
  * Takes the power of each element in input ('this') with 'x' and
  * returns a tensor with the result.
  *
  * @param x  Exponent tensor.
  *
  * @returns  Output tensor.
  */
  async pow(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'pow', false)
  }

  /**
  * Takes the power of each element in input ('this') with 'x', inplace.
  *
  * @param x  Exponent tensor.
  *
  * @returns  This Tensor.
  */
  async pow_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'pow', true)
  }

  /**
  * Performs the floor of the input tensor.
  *
  * @returns  Output tensor
  */
  async floor(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'floor'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs the inplace floor of the input tensor.
  *
  * @returns  This Tensor.
  */
  async floor_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'floor_'
    }))

    return this
  }

  /**
  * Performs Round-ing to the nearest decimal.
  *
  * @returns  Output tensor.
  */
  async round(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'round'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Performs Round-ing to the nearest decimal inplace.
  *
  * @returns  This Tensor.
  */
  async round_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'round_'
    }))

    return this
  }

  /**
  * Performs a matrix multiplication of two tensors.
  *
  * @param other  Second tensor to be multiplied with.
  *
  * @returns  n x m Output tensor.
  */
  async mm(
    x: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready()
    ])

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'mm',
        tensorIndexParams: [x.id]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @returns  TODO document this?
  */
  async grad() {
    this.ready()

    return this.get('grad', true)
  }

  /**
  * Sets negative of the elements of tensor.
  *
  * @returns  Output tensor.
  */
  async neg(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'neg'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Sets negative of the elements of tensor inplace.
  *
  * @returns  This Tensor.
  */
  async neg_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'neg_'
    }))

    return this
  }

  /**
  * TODO document this?
  *
  * @returns  Output Tensor.
  */
  async relu(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'relu'
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param filename  TODO document this?
  *
  * @returns  TODO document this?
  */
  async save(
    filename: string
  ): Promise<boolean> {
    this.ready()

    return assertType(
      controller.sendJSON(this.cmd({
        functionCall: 'save',
        tensorIndexParams: [filename]
      }), 'bool'),
      'boolean'
    )
  }

  /**
  * TODO document this?
  *
  * @param paramName  TODO document this?
  * @param params     TODO document this?
  *
  * @returns  TODO document this?
  */
  async set(
    paramName = 'size',
    params: any[] = []
  ) {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'set',
      tensorIndexParams: [...paramName, params]
    }))
  }

  /**
  * Performs inplace sigmoid function on the tensor element-wise.
  *
  * @returns  This Tensor.
  */
  async sigmoid_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'sigmoid_'
    }))

    return this
  }

  /**
  * Returns a new tensor holding element wise values of Sigmoid function.
  * Sigmoid(x) = 1 / 1+exp(-x)
  *
  * @returns  Output tensor.
  */
  async sigmoid(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sigmoid'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes sign of each element of the tensor.
  *
  * @returns  Output tensor.
  */
  async sign(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sign'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the sign of each element of the tensor inplace.
  *
  * @returns  This Tensor.
  */
  async sign_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'sign_'
    }))

    return this
  }

  /**
  * Computes sin of each element of the tensor.
  *
  * @returns  Output tensor.
  */
  async sin(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sin'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the sine of each element of the tensor inplace.
  *
  * @returns  This Tensor.
  */
  async sin_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'sin_'
    }))

    return this
  }

  /**
  * Returns the size of tensor.
  *
  * Returns  Int with value of size
  */
  async size() {
    this.ready()

    return this.get('size')
  }

  /**
  * Returns the size of the this tensor as a FloatTensor (or as List).
  * Note:
  *     The returned value currently is a FloatTensor because it leverages
  *     the messaging mechanism with Unity.
  *
  * @param asList  Value retruned as list if true; else as tensor. (default true)
  *
  * @return  Output tensor (or) Output list.
  */
  async shape(
    asList = true
  ) {
    this.ready()

    let res = assertType(await this.get('shape'), 'string') as string

    return res.split(',').slice(0, -1).map(a => Number(a))
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  *
  * @returns  TODO document this?
  */
  async softmax(
    dim = -1
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'softmax',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  *
  * @returns  TODO document this?
  */
  async std(
    dim = -1
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'std',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the stride of tensor.
  *
  * @param dim  Dimension of expected return.
  *
  * @returns  Output tensor (or) NumPy Array as Long.
  */
  async stride(
    dim = -1
  ): Promise<number|number[]> {
    this.ready()

    if (dim === -1) {
      return assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'stride'
        }), 'int'),
        'number'
      )
    } else {
      // TODO: figure out this
      let strides = assertType(
        await controller.sendJSON(this.cmd({
          functionCall: 'stride',
          tensorIndexParams: [dim]
        }), 'int'),
        'number'
      )
      return (strides as string).split(' ').map(Number)
    }
  }

  /**
  * Returns a new tensor with the square-root of the elements of input.
  *
  * @returns  Output Tensor
  */
  async sqrt(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sqrt'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns this tensor with the square-root of the elements of input.
  *
  * @returns  This Tensor.
  */
  async sqrt_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'sqrt_'
    }))

    return this
  }

  /**
  * Returns a new tensor with the sum along diagonals of a 2D tensor.
  *
  * @returns  Output tensor.
  */
  async trace(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'trace'
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  *
  * @returns  TODO document this?
  */
  async trunc(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'trunc'
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  * figure this out (any)?
  *
  * @param args  TODO document this?
  *
  * @returns  TODO document this?
  */
  async view(
    ...args: any[]
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'view',
        tensorIndexParams: args
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  * figure this out (any)?
  *
  * @param args  TODO document this?
  *
  * @returns  TODO document this?
  */
  async view_(
    ...args: any[]
  ): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'view_',
      tensorIndexParams: args
    }))

    return this
  }

  /**
  * TODO document this?
  * figure this out (any)?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async viewAs(
    x: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready()
    ])

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'view_as',
        tensorIndexParams: [x.id]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  * figure this out (any)?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async viewAs_(
    x: Tensor
  ): Promise<this> {
    await Promise.all([
      this.ready(),
      x.ready()
    ])

    await controller.sendJSON(this.cmd({
      functionCall: 'view_as_',
      tensorIndexParams: [x.id]
    }))
    return this
  }

  /**
  * Returns a tensor that is a transposed version of input.
  *
  * @returns  Output tensor.
  */
  async T(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'transpose'
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param k  TODO document this?
  *
  * @returns  TODO document this?
  */
  async triu(
    k = 0
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'triu',
        tensorIndexParams: [k]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param k  TODO document this?
  *
  * @returns  TODO document this?
  */
  async triu_(
    k = 0
  ): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'triu_',
      tensorIndexParams: [k]
    }))

    return this
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  *
  * @returns  TODO document this?
  */
  async unsqueeze(
    dim: number
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'unsqueeze',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param dim  TODO document this?
  *
  * @returns  TODO document this?
  */
  async unsqueeze_(
    dim: number
  ): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'unsqueeze_',
      tensorIndexParams: [dim]
    }))

    return this
  }

  /**
  * Fills this tensor with zeros inplace.
  *
  * @returns  This Tensor.
  */
  async zero_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'zero_'
    }))

    return this
  }

  /**
  * Returns a string representation of this Tensor.
  *
  * @returns  A string representation of this Tensor.
  */
  async toString() {
    this.ready()

    let shape = await this.shape()
    let data = await this.getData()

    return `${this.type}<${shape.join('x')}>(id: ${this.id}) [${data}]`
  }

  /**
  * Returns a CPU copy of this storage if it's not already on the CPU.
  *
  * @returns  Output tensor.
  */
  async cpu(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'cpu'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns a GPU copy of this storage if it's not already on the GPU.
  *
  * @returns  Output tensor.
  */
  async gpu(): Promise<this>  {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'gpu'
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param x       TODO document this?
  * @param name    TODO document this?
  * @param inline  TODO document this?
  *
  * @returns  TODO document this?
  */
  async arithmeticOperation(
    x: number|Tensor,
    name: string,
    inline = false
  ): Promise<this> {
    this.ready()

    let operationCmd = name
    let parameter

    if (x instanceof Tensor) {
      await x.ready()
      operationCmd += '_elem'
      parameter = x.id
    } else {
      operationCmd += '_scalar'
      parameter = String(x)
    }

    if (inline) {
      operationCmd += '_'

      await controller.sendJSON(this.cmd({
        functionCall: operationCmd,
        tensorIndexParams: [parameter]
      }))

      return this
    }

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: operationCmd,
        tensorIndexParams: [parameter]
      }), this.type),
      this.constructor
    )
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async add(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'add')
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async add_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'add', true)
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async sub(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'sub')
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async sub_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'sub', true)
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async mul(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'mul')
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async mul_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'mul', true)
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async div(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'div')
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async div_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'div', true)
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async mod(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'mod')
  }

  /**
  * TODO document this?
  *
  * @param x  TODO document this?
  *
  * @returns  TODO document this?
  */
  async mod_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'mod', true)
  }

  /**
  * Returns the hyperbolic sine of the input.
  *
  * @returns  Output tensor.
  */
  async sinh(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sinh'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the hyperbolic sine of the input inplace.
  *
  * @returns  This Tensor.
  */
  async sinh_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'sinh_'
    }))

    return this
  }

  /**
  * Returns the logarithm of the input.
  *
  * @returns  Output tensor.
  */
  async log(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'log'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the logarithm of the input inplace.
  *
  * @returns  This Tensor.
  */
  async log_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'log_'
    }))

    return this
  }

  /**
  * Returns the natural logarithm of (1 + input) inplace.
  *
  * @returns  This Tensor.
  */
  async log1p_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'log1p_'
    }))

    return this
  }

  /**
  * Returns a new tensor with the natural logarithm of (1 + 'this').
  *
  * @returns  Output tensor.
  */
  async log1p(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'log1p'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the fractional portion of each element in tensor.
  *
  * @returns  Output tensor.
  */
  async frac(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'frac'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the fractional portion of each element in tensor, inplace.
  *
  * @returns  This Tensor.
  */
  async frac_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'frac_'
    }))

    return this
  }

  /**
  * Computes the reciprocal of the input tensor.
  *
  * @returns  Output tensor
  */
  async reciprocal(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'reciprocal'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes reciprocal of input tensor with values inplace.
  *
  * @returns  This Tensor.
  */
  async reciprocal_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'reciprocal_'
    }))

    return this
  }

  /**
  * Returns a new tensor with the reciprocal of the square-root of each of
  * the elements of input.
  *
  * @returns  Output tensor
  */
  async rsqrt(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'rsqrt'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Computes the reciprocal of the square-root of each of the elements of input,
  * inplace.
  *
  * @returns  This Tensor.
  */
  async rsqrt_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'rsqrt_'
    }))

    return this
  }

  /**
  * Computes the element-wise remainder of division.
  * TODO: duplicate mod(x: number|Tensor)
  *
  * @returns  Output tensor.
  */
  async remainder(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'remainder')
  }

  /**
  * Computes the element-wise remainder of division, inplace.
  * TODO: duplicate mod_(x: number|Tensor)
  *
  * @returns  This Tensor.
  */
  async remainder_(
    x: number|Tensor
  ): Promise<this> {

    return this.arithmeticOperation(x, 'remainder', true)
  }

  /**
  * Samples the current tensor uniformly assuming each value is a binary probability.
  *
  * @param dim  TODO document this.
  *
  * @returns  Output tensor.
  */
  async sample(
    dim: number
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sample',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the tangent of the input.
  *
  * @returns  Output tensor.
  */
  async tan(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'tan'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the tangent of the input inplace.
  *
  * @returns  This tensor.
  */
  async tan_(): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'tan_'
    }))

    return this
  }

  /**
  * Returns the hyperbolic tangent of the input.
  *
  * @returns  Output tensor.
  */
  async tanh(): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'tanh'
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns a tensor with all the dimensions of input of size 1 removed.
  *
  * @param dim  When dim is given, a squeeze operation is done only in the given
  *             dimension.
  *
  * @returns  Output tensor.
  */
  async squeeze(
    dim = -1
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'squeeze',
        tensorIndexParams: [dim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Removes all the dimensions of input tensor of size 1, inplace.
  *
  * @param dim  When dim is given, a squeeze operation is done only in the given
  *             dimension.
  *
  * @returns  Output tensor.
  */
  async squeeze_(
    dim = -1
  ): Promise<this> {
    this.ready()

    await controller.sendJSON(this.cmd({
      functionCall: 'squeeze_',
      tensorIndexParams: [dim]
    }))

    return this
  }

  /**
  * Returns the minimum value of all elements in the input tensor.
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async min(
    dim = -1,
    keepdim = false
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'min',
        tensorIndexParams: [dim, keepdim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the maximum value of all elements in the input tensor.
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async max(
    dim = -1,
    keepdim = false
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'max',
        tensorIndexParams: [dim, keepdim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the sum of all elements in the input tensor.
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async sum(
    dim = -1,
    keepdim = false
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'sum',
        tensorIndexParams: [dim, keepdim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the product of all elements in the input tensor.
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async prod(
    dim = -1,
    keepdim = false
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'prod',
        tensorIndexParams: [dim, keepdim]
      }), this.type),
      this.constructor
    )
  }

  /**
  * Returns the mean value of all elements in the input tensor.
  *
  * @param dim      The dimension to reduce.
  * @param keepdim  Whether the output tensors have dim retained or not.
  *
  * @returns  Output tensor.
  */
  async mean(
    dim = -1,
    keepdim = false
  ): Promise<this> {
    this.ready()

    return assertType(
      await controller.sendJSON(this.cmd({
        functionCall: 'mean',
        tensorIndexParams: [dim, keepdim]
      }), this.type),
      this.constructor
    )
  }
  static IntTensor: IntTensorConstructor
  static FloatTensor: FloatTensorConstructor

}

export interface IntTensorConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): IntTensor
  get(id: string): Promise<IntTensor>
  create(...args: any[]):  Promise<IntTensor>
}

export interface FloatTensorConstructor extends IAsyncConstructor {
  new ($caller$: any, id: string): FloatTensor
  get(id: string): Promise<FloatTensor>
  create(...args: any[]):  Promise<FloatTensor>
}

export class IntTensor extends Tensor {
  static $: IAsyncConstructor = IntTensor

  /**
  * Syft object type.
  */
  type = 'IntTensor'

  /**
  * Get a IntTensor given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected IntTensor.
  */
  static async get(id: string) {
    // check that IntTensor exists

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a local instance of a network connected IntTensor.
  *
  * @param arr       Numaric data.
  * @param autograd  TODO document this?
  *
  * @returns  A local instance of a network connected IntTensor.
  */
  static async create(
    arr: any[] | {data: ArrayLike<number>, shape:ArrayLike<number>},
    autograd = false
  ) {
    let data
    if (Array.isArray(arr)) {
      data = new IntDimArray(arr)
    } else {
      data = arr
    }

    let id = assertType(
      await controller.sendJSON({
        objectType: 'IntTensor',
        tensorIndexParams: [],
        functionCall: 'create',
        data: Array.from(data.data),
        shape: Array.from(data.shape)
      }, 'string'),
      'string'
    ) as string

    let tensor = new this(AsyncInstance, id)

    if (autograd) {
      await tensor.autograd(autograd)
    }

    return tensor
  }
}

export class FloatTensor extends Tensor {
  static $: IAsyncConstructor = FloatTensor

  /**
  * Syft object type.
  */
  type = 'FloatTensor'

  /**
  * Get a FloatTensor given its ID.
  *
  * @param id  The ID of network connected object in the Unity Project.
  *
  * @returns  A local instance of a network connected FloatTensor.
  */
  static async get(
    id: string
  ) {
    // check that FloatTensor exists

    return new this(AsyncInstance, id)
  }

  /**
  * Creates a local instance of a network connected FloatTensor.
  *
  * @param arr       Numaric data.
  * @param autograd  TODO document this?
  *
  * @returns  A local instance of a network connected FloatTensor.
  */
  static async create(
    arr: any[] | {data: ArrayLike<number>, shape:ArrayLike<number>},
    autograd = false
  ) {
    let data
    if (Array.isArray(arr)) {
      data = new FloatDimArray(arr)
    } else {
      data = arr
    }

    let id = assertType(
      await controller.sendJSON({
        objectType: 'FloatTensor',
        tensorIndexParams: [],
        functionCall: 'create',
        data: Array.from(data.data),
        shape: Array.from(data.shape)
      }, 'string'),
      'string'
    ) as string

    let tensor = new this(AsyncInstance, id)

    if (autograd) {
      await tensor.autograd(autograd)
    }

    return tensor
  }

  // TODO: figure this out
  // async autograd(setter: boolean) {
  //   let this = this
  //   this.ready()
  //   let out
  //
  //   if (setter == null) {
  //     if (await this.get('autograd') === '1') {
  //       return true
  //     } else {
  //       return false
  //     }
  //   } else {
  //     if (setter) {
  //       out = await this.set('autograd', ['1'])
  //     } else {
  //       out = await this.set('autograd', ['0'])
  //     }
  //     if ((out === '1' && setter) || (out === '0' && !setter)) {
  //       return this
  //     } else {
  //       return false
  //     }
  //   }
  // }
}

Tensor.IntTensor = IntTensor
Tensor.FloatTensor = FloatTensor
