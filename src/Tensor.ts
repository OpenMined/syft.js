import * as controller from './controller'
import {
  DimArray,
  IntDimArray,
  FloatDimArray
} from './DimArray'
import {
  AsyncInit,
  IAsyncInit
} from './AsyncInit'

const TENSOR_SUPER = {}

import {TensorSerializer} from './TensorSerializer'

const tensorSerializer = new TensorSerializer

export class Tensor extends AsyncInit implements IAsyncInit {
  static __tensor__: {[id: string]: Tensor} = {}

  id: string
  data: DimArray
  data_is_pointer: boolean
  type: string

  constructor($?: any) {
    super()

    if ($ !== TENSOR_SUPER) {
      throw new Error('Cannot Contruct Tensor')
    }
  }

  static deserialize(
    str: string
  ) {
    return tensorSerializer.deserialize(str)
  }

  serialize(
    optimizeStorage = false
  ) {
    return tensorSerializer.serialize(this, optimizeStorage)
  }

  finish(
    id: string
  ) {
    let self = this

    self.id = id
  }

  /*
  * Deletes the input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  */
  async delete() {
    let self = this

    self.__delete__()

    await self.ready()

    if (self.id) {
      await controller.sendJSON(self.cmd({
        functionCall: 'delete'
      }))
    }
  }

  async autograd(state: boolean) {
    let self = this
    await self.ready()

    // do nothing
  }

  async get(
    param_name = 'size',
    response_as_tensor = false
  ) {
    let self = this
    await self.ready()

    if (response_as_tensor) {
      return await controller.sendJSON(self.cmd({
        functionCall: 'get',
        tensorIndexParams: [param_name]
      }), self.type)
    } else {
      return await controller.sendJSON(self.cmd({
        functionCall: 'get',
        tensorIndexParams: [param_name]
      }), 'string')
    }
  }

  protected cmd(
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

  async is_contiguous() {
    let self = this
    await self.ready()

    let txt = await controller.sendJSON(self.cmd({
      functionCall: 'is_contiguous'
    }), 'bool')

    if (txt == 'true') {
      return true
    } else {
      return false
    }
  }

  //TODO: figure this out
  async to_numpy() {
    let self = this
    await self.ready()

    let res

    if (await self.is_contiguous()) {
      res = await controller.sendJSON(self.cmd({
        functionCall: 'to_numpy'
      }), 'string')
      return res // np.fromstring(res, sep=' ').astype('int').reshape(self.shape())
    } else {
      return ' - non-contiguous - '
    }
  }

  async __repr__(
    verbose = true
  ) {
    let self = this
    await self.ready()

    let tensor_str = await self.to_numpy()

    let type_str = (await self.shape() as number[]).join('x')

    let grad = await self.get('grad')
    if (grad == '') {
      grad = 'None'
    }

    let co = String(await self.creation_op())

    let desc = `[syft.${self.type}: ${self.id} grad: ${grad} size: ${type_str} init: ${co}]\n`

    if (verbose) {
      let children = await self.children()
      let creators = await self.creators()

      if (children.length > 0) {
        //tensor_str = '\n -------------------------------\n' + tensor_str
        desc += '\n\t-----------children-----------\n'
      }
      for (let child_id of children) {
        desc += '\t' + await (await controller.get_tensor(child_id)).__repr__(false)
      }
      if (children.length > 0) {
        if (creators.length > 0) {

          desc += '\t------------------------------\n'
        } else {
          desc += '\t------------------------------\n\n\n'
        }
      }
      if (creators.length > 0) {
        // tensor_str = '\n -------------------------------\n' + tensor_str
        desc += '\n\t-----------creators-----------\n'
      }
      for (let parent_id of creators) {
        desc += '\t' + await (await controller.get_tensor(parent_id)).__repr__(false)
      }
      if (creators.length > 0) {
        desc += '\t------------------------------\n\n\n'
      }
      return tensor_str + '\n' + desc
    }
    return desc
  }


  ///////////////////////////////////
  // Tensor Manipulation Functions //
  ///////////////////////////////////

  /*
  * Returns absolute value of tensor as a new tensor
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor:
  *     Output tensor
  */
  async abs() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'abs'
    }), self.type)
  }

  /*
  * Replaces tensor values with its absolute value
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async abs_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'abs_'
    }))
  }

  /*
  * Returns a new Tensor with the arccosine of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async acos() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'acos'
    }), self.type)
  }

  /*
  * Performs inplace arccosine operation of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async acos_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'acos_'
    }))
  }

  /*
  * Performs a matrix multiplication of the matrices 'x' and 'y'.
  * The caller matrix 'self' is added to the final result inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     First tensor for multiplication
  * y : FloatTensor
  *     Second tensor for multiplication
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async addmm_(
    x: Tensor,
    y: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready(),
      y.ready()
    ])

    return await controller.sendJSON(self.cmd({
      functionCall: 'addmm_',
      tensorIndexParams: [x.id, y.id]
    }))
  }

  /*
  * Performs a matrix multiplication of the matrices 'x' and 'y'.
  * The caller matrix 'self' is added to the final result.
  * Parameters
  * ----------
  * x : FloatTensor
  *     First tensor for multiplication
  * y : FloatTensor
  *     Second tensor for multiplication
  * Returns
  * -------
  * copy : FloatTensor
  *     Output tensor
  */
  async addmm(
    x: Tensor,
    y: Tensor
  ) {
    let self = this

    await Promise.all([
      self.ready(),
      x.ready(),
      y.ready()
    ])

    let copy = await self.copy()
    await copy.addmm_(x, y)

    return copy
  }

  /*
  * Performs a matrix-vector product of the matrix x and the vector vec.
  * The vector tensor is added to the final result inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     tensor for multiplication
  * vec : FloatTensor
  *     Vector for Matrix-Vector Product
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async addmv_(
    x: Tensor,
    y: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready(),
      y.ready()
    ])

    return await controller.sendJSON(self.cmd({
      functionCall: 'addmv_',
      tensorIndexParams: [x.id, y.id]
    }))
  }

  /*
  * Performs a matrix-vector product of the matrix x and the vector vec.
  * The vector tensor is added to the final result.
  * Parameters
  * ----------
  * x : FloatTensor
  * tensor for multiplication
  * y : FloatTensor
  * Vector for Matrix-Vector Product
  * Returns
  * -------
  * copy : FloatTensor
  * Output tensor
  */
  async addmv(
    x: Tensor,
    y: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready(),
      y.ready()
    ])

    let copy = await self.copy()
    await copy.addmv_(x, y)

    return copy
  }

  /*
  * Returns a new Tensor with the arcsine of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async asin() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'asin'
    }), self.type)
  }

  /*
  * Performs inplace arcsine operation of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async asin_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'asin_'
    }))
  }

  /*
  * Returns a new Tensor with the arctangent of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async atan() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'atan'
    }), self.type)
  }

  /*
  * Performs inplace arctangent operation of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async atan_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'atan_'
    }))
  }

  //TODO: get the type of grad
  async backward(grad?: any) {
    let self = this
    await self.ready()

    if (grad == void 0) {
      controller.sendJSON(self.cmd({
        functionCall: 'backward'
      }))
    } else {
      controller.sendJSON(self.cmd({
        functionCall: 'backward',
        tensorIndexParams: [grad.id]
      }))
    }
  }

  /*
  * Performs the ceiling of the input tensor element-wise.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async ceil() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'ceil'
    }), self.type)
  }

  /*
  * Performs the inplace ceiling of the input tensor element-wise.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async ceil_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'ceil_'
    }))
  }

  /*
  * Returns a copy of the input
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async contiguous() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'contiguous'
    }), self.type)
  }

  /*
  * Returns a copy of the input
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async copy(): Promise<Tensor> {
    let self = this
    await self.ready()

    let t = await controller.sendJSON(self.cmd({
      functionCall: 'copy'
    }), self.type)

    if (t instanceof Tensor) {
      return t
    }

    throw new Error('Failed To Copy Tensor')
  }

  /*
  * Returns a new Tensor with the cosine of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async cos() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cos'
    }), self.type)
  }

  /*
  * Performs the cosine of the input tensor inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async cos_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cos_'
    }))
  }

  /*
  * Returns a new Tensor with hyperbolic cosine of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async cosh() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cosh'
    }), self.type)
  }

  /*
  * Returns the hyperbolic cosine of the input inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async cosh_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cosh_'
    }))
  }

  /*
  * Returns an iterator over immediate children modules.
  * Parameters
  * ----------
  * Returns
  * -------
  * Iterable
  *     Returns a list of children
  */
  async children() {
    let self = this
    await self.ready()

    let res = await self.get('children')
    if (res && typeof res == 'string') {
      //TODO: figure this out
      return [] // list(map(lambda x: Number(x), res.split(',')[0:-1]))
    }
    return []
  }

  async creation_op() {
    let self = this
    await self.ready()

    return await self.get('creation_op')
  }

  /*
  * Returns an iterator over immediate creators of input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * Returns a list of creators
  */
  async creators() {
    let self = this
    await self.ready()

    let res = await self.get('creators')
    if (typeof res == 'string' && res.length > 0) {
      //TODO: figure this out
      // list(map(lambda x: Number(x), res.split(',')[0:-1]))
      return res.split(',').slice(0, -1)
    }
    return []
  }

  /*
  * Returns the sum of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async cumsum(dim = 0) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cumsum',
      tensorIndexParams: [dim]
    }), self.type)
  }

  async dataOnGpu() {
    let self = this
    await self.ready()

    if (await self.get('dataOnGpu') == '1') {
      return true
    }
    return false
  }

  /*
  * Computes the exponential of each element of input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async exp() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'exp'
    }), self.type)
  }

  /*
  * Computes the exponential of each element of input tensor inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async exp_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'exp_'
    }))
  }

  /*
  * Returns the tensor, with values repeated across one dimension
  * Parameters
  * ----------
  * args : list
  *        the new, expanded size
  * Returns
  * -------
  * FloatTensor
  *     the new, expanded tensor.
  */
  async expand(
    ...args: number[]
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'expand',
      tensorIndexParams: args
    }), self.type)
  }

  //TODO: figure this out
  async index_add(
    indices: any, // what type is this?
    dim: number,
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return await controller.sendJSON(self.cmd({
      functionCall: 'index_add',
      tensorIndexParams: [indices.id, dim, x.id]
    }), self.type)
  }

  //TODO: figure this out
  async index_add_(
    indices: any, // what type is this?
    dim: number,
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return await controller.sendJSON(self.cmd({
      functionCall: 'index_add_',
      tensorIndexParams: [indices.id, dim, x.id]
    }), self.type)
  }

  //TODO: figure this out
  async index_select(
    dim: number,
    indices: any // what type is this?
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'index_select',
      tensorIndexParams: [indices.id, dim]
    }), self.type)
  }

  async keepgrad() {
    let self = this
    await self.ready()

    if (await self.get('keepgrad') == '1') {
        return true
    } else {
      return false
    }
  }

  /*
  * Takes the power of each element in input ('self') with 'x' and
  * returns a tensor with the result.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Exponent tensor
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async pow(
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return await self.arithmetic_operation(x, 'pow', false)
  }

  /*
  * Takes the power of each element in input ('self') with 'x', inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Exponent tensor
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async pow_(
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return await self.arithmetic_operation(x, 'pow', true)
  }

  /*
  * Performs the floor of the input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async floor() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'floor'
    }), self.type)
  }

  /*
  * Performs the inplace floor of the input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async floor_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'floor_'
    }))
  }

  /*
  * Performs Round-ing to the nearest decimal,
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async round() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'round'
    }), self.type)
  }

  /*
  * Performs Round-ing to the nearest decimal inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async round_() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'round_'
    }))
  }

  /*
  * Performs a matrix multiplication of two tensors.
  * Parameters
  * ----------
  * other : FloatTensor
  *     Second tensor to be multiplied with
  * Returns
  * -------
  * FloatTensor
  *     n x m Output tensor
  */
  async mm(
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return controller.sendJSON(self.cmd({
      functionCall: 'mm',
      tensorIndexParams: [x.id]
    }), self.type)
  }

  async grad() {
    let self = this
    await self.ready()

    return self.get('grad', true)
  }

  /*
  * Sets negative of the elements of tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async neg() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'neg'
    }), self.type)
  }

  /*
  * Sets negative of the elements of tensor inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async neg_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'neg_'
    }))
  }

  async relu() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'relu'
    }), self.type)
  }

  async save(
    filename: string
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'save',
      tensorIndexParams: [filename]
    }), 'bool')
  }

  async set(
    param_name = 'size',
    params: any[] = []
  ) {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'set',
      tensorIndexParams: [...param_name, params]
    }))
  }

  /*
  * Performs inplace sigmoid function on the tensor element-wise.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace.
  */
  async sigmoid_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sigmoid_'
    }))
  }

  /*
  * Returns a new tensor holding element wise values of Sigmoid function.
  * Sigmoid(x) = 1 / 1+exp(-x)
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async sigmoid() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sigmoid'
    }), self.type)
  }

  /*
  * Computes sign of each element of the tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async sign() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sign'
    }), self.type)
  }

  /*
  * Computes the sign of each element of the tensor inplace
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async sign_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sign_'
    }))
  }

  /*
  * Computes sin of each element of the tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async sin() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sin'
    }), self.type)
  }

  /*
  * Computes the sine of each element of the tensor inplace
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async sin_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sin_'
    }))
  }

  /*
  * Returns the size of tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * int
  *     int with value of size
  */
  async size() {
    let self = this
    await self.ready()

    return await self.get('size')
  }

  /*
  * Returns the size of the self tensor as a FloatTensor (or as List).
  * Note:
  *     The returned value currently is a FloatTensor because it leverages
  *     the messaging mechanism with Unity.
  * Parameters
  * ----------
  * as_list : bool
  *     Value retruned as list if true; else as tensor
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  * (or)
  * Iterable
  *     Output list
  */
  async shape(
    as_list = true
  ) {
    let self = this
    await self.ready()

    if (as_list) {
      //TODO: figure this out
      return (await self.get('shape') as string || '').split(',').map(a => Number(a))
    } else {
      return await controller.sendJSON(self.cmd({
        functionCall: 'shape'
      }), self.type)
    }
  }

  async softmax(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'softmax',
      tensorIndexParams: [dim]
    }), self.type)
  }

  async std(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'std',
      tensorIndexParams: [dim]
    }), self.type)
  }

  /*
  * Returns the stride of tensor.
  * Parameters
  * ----------
  * dim : int
  *     dimension of expected return

  * Returns
  * -------
  * FloatTensor
  *     Output tensor.
  * (or)
  * numpy.ndarray
  *     NumPy Array as Long
  */
  async stride(
    dim = -1
  ) {
    let self = this
    await self.ready()

    if (dim == -1) {
      return controller.sendJSON(self.cmd({
        functionCall: 'stride'
      }), 'string')
    } else {
      //TODO: figure out this
      let strides = await controller.sendJSON(self.cmd({
        functionCall: 'stride',
        tensorIndexParams: [dim]
      }), 'string')
      return (strides as string).split(' ')
    }
  }

  /*
  * Returns a new tensor with the square-root of the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor:
  *     Output Tensor
  */
  async sqrt() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sqrt'
    }), self.type)
  }

  async sqrt_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sqrt_'
    }))
  }

  /*
  * Returns a new tensor with the sum along diagonals of a 2D tensor.
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async trace() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'trace'
    }), self.type)
  }

  async trunc() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'trunc'
    }), self.type)
  }

  //TODO: figure this out (any)?
  async view(...args: any[]) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'view',
      tensorIndexParams: args
    }), self.type)
  }

  //TODO: figure this out (any)?
  async view_(...args: any[]) {
    let self = this
    await self.ready()

    await controller.sendJSON(self.cmd({
      functionCall: 'view_',
      tensorIndexParams: args
    }))
    return self
  }

  async view_as(
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    return controller.sendJSON(self.cmd({
      functionCall: 'view_as',
      tensorIndexParams: [x.id]
    }), self.type)
  }

  async view_as_(
    x: Tensor
  ) {
    let self = this
    await Promise.all([
      self.ready(),
      x.ready()
    ])

    await controller.sendJSON(self.cmd({
      functionCall: 'view_as_',
      tensorIndexParams: [x.id]
    }))
    return self
  }

  /*
  * Returns a tensor that is a transposed version of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async T() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'transpose'
    }), self.type)
  }


  async triu(
    k = 0
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'triu',
      tensorIndexParams: [k]
    }), self.type)
  }

  async triu_(
    k = 0
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'triu_',
      tensorIndexParams: [k]
    }))
  }

  async unsqueeze(
    dim: number
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'unsqueeze',
      tensorIndexParams: [dim]
    }), self.type)
  }

  async unsqueeze_(
    dim: number
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'unsqueeze_',
      tensorIndexParams: [dim]
    }))
  }

  /*
  * Fills this tensor with zeros inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async zero_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'zero_'
    }))
  }

  async toString() {
    let self = this
    await self.ready()

    let shape = await self.shape()

    return String(await self.to_numpy()).replace(']', ' ').replace('[', ' ')
  }

  /*
  * Returns a CPU copy of this storage if it's not already on the CPU
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async cpu() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'cpu'
    }))
  }

  /*
  * Returns a GPU copy of this storage if it's not already on the GPU
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async gpu() {
    let self = this
    await self.ready()

    return await controller.sendJSON(self.cmd({
      functionCall: 'gpu'
    }))
  }

  async arithmetic_operation(
    x: number|Tensor,
    name: string,
    inline = false
  ) {
    let self = this
    await self.ready()

    let operation_cmd = name
    let parameter

    if (x instanceof Tensor) {
      operation_cmd += '_elem'
      parameter = x.id
    } else {
      operation_cmd += '_scalar'
      parameter = String(x)
    }

    if (inline) {
      operation_cmd += '_'
    }
    // sends the command
    return await controller.sendJSON(self.cmd({
      functionCall: operation_cmd,
      tensorIndexParams: [parameter]
    }), inline ? void 0 : self.type)
  }

  /*
  * Returns the hyperbolic sine of the input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async sinh() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sinh'
    }), self.type)
  }

  /*
  * Returns the hyperbolic sine of the input inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace.
  */
  async sinh_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sinh_'
    }))
  }

  /*
  * Returns the logarithm of the input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async log() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'log'
    }), self.type)
  }

  /*
  * Returns the logarithm of the input inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace.
  */
  async log_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'log_'
    }))
  }

  /*
  * Returns the natural logarithm of (1 + input) inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace.
  */
  async log1p_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'log1p_'
    }))
  }

  /*
  * Returns a new tensor with the natural logarithm of (1 + 'self').
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async log1p() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'log1p'
    }), self.type)
  }

  /*
  * Computes the fractional portion of each element in tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async frac() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'frac'
    }), self.type)
  }

  /*
  * Computes the fractional portion of each element in tensor, inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async frac_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'frac_'
    }))
  }

  /*
  * Computes the reciprocal of the input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async reciprocal() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'reciprocal'
    }), self.type)
  }

  /*
  * Computes reciprocal of input tensor with values inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async reciprocal_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'reciprocal_'
    }))
  }

  /*
  * Returns a new tensor with the reciprocal of the square-root of each of
  * the elements of input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async rsqrt() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'rsqrt'
    }), self.type)
  }

  /*
  * Computes the reciprocal of the square-root of each of the elements of input,
  * inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async rsqrt_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'rsqrt_'
    }))
  }

  /*
  * Computes the element-wise remainder of division.
  * inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async remainder(
    divisor: number
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(divisor, 'remainder')
  }

  /*
  * Computes the element-wise remainder of division, inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async remainder_(
    divisor: number
  ) {
    let self = this
    await self.ready()

    // TODO: 'FloatTensor'
    return self.arithmetic_operation(divisor, 'remainder', true)
  }

  /*
  * Samples the current tensor uniformly assuming each value is a binary probability.
  * ----------
  * Returns
  * -------
  * IntTensor
  *     Output tensor
  */
  async sample(
    dim: number
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sample',
      tensorIndexParams: [dim]
    }), self.type)
  }

  /*
  * Returns the tangent of the input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async tan() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'tan'
    }), self.type)
  }

  /*
  * Returns the tangent of the input inplace.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async tan_() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'tan_'
    }))
  }

  /*
  * Returns the hyperbolic tangent of the input.
  * Parameters
  * ----------
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async tanh() {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'tanh'
    }), self.type)
  }

  /*
  * Returns a tensor with all the dimensions of input of size 1 removed.
  * Parameters
  * ----------
  * dim : int
  *     When dim is given, a squeeze operation is done only in the given
  *     dimension.
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async squeeze(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'squeeze',
      tensorIndexParams: [dim]
    }), self.type)
  }

  /*
  * Removes all the dimensions of input tensor of size 1, inplace.
  * Parameters
  * ----------
  * dim : int
  *     When dim is given, a squeeze operation is done only in the given
  *     dimension.
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async squeeze_(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'squeeze_',
      tensorIndexParams: [dim]
    }))
  }

  /*
  * Returns the minimum value of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async min(
    dim = -1,
    keepdim = false
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'min',
      tensorIndexParams: [dim, keepdim]
    }), self.type)
  }

  /*
  * Returns the maximum value of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async max(
    dim = -1,
    keepdim = false
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'max',
      tensorIndexParams: [dim, keepdim]
    }), self.type)
  }

  /*
  * Returns the sum of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async sum(
    dim = -1,
    keepdim = false
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'sum',
      tensorIndexParams: [dim, keepdim]
    }), self.type)
  }

  /*
  * Returns the product of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async prod(
    dim = -1,
    keepdim = false
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'prod',
      tensorIndexParams: [dim, keepdim]
    }), self.type)
  }

  /*
  * Returns the mean value of all elements in the input tensor.
  * Parameters
  * ----------
  * dim : int
  *     the dimension to reduce
  * keepdim : bool
  *     whether the output tensors have dim retained or not
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async mean(
    dim = -1,
    keepdim = false
  ) {
    let self = this
    await self.ready()

    return controller.sendJSON(self.cmd({
      functionCall: 'mean',
      tensorIndexParams: [dim, keepdim]
    }), self.type)
  }
}

export class IntTensor extends Tensor {
  data: IntDimArray
  type = 'IntTensor'
  constructor(
    data: string|any[]|IntDimArray,
    data_is_pointer = false
  ) {
    super(TENSOR_SUPER)

    let self = this

    if (!data) {
      throw Error('Invalid Data')
    }

    if (data instanceof IntDimArray) {
      self.data = data

      controller.sendJSON(self.cmd({
        functionCall: 'create',
        data: Array.from(self.data.data),
        shape: Array.from(self.data.shape)
      }), 'string')
        .then(res => self.__finish__(res as string))
        .catch(err => self.__error__(err))
    } else if (Array.isArray(data)) {
      self.data = new IntDimArray(data)

      controller.sendJSON(self.cmd({
        functionCall: 'create',
        data: Array.from(self.data.data),
        shape: Array.from(self.data.shape)
      }), 'string')
        .then(res => self.__finish__(res as string))
        .catch(err => self.__error__(err))
    } else if (data_is_pointer) {
      self.id = data
      self.data_is_pointer = true
      self.__finish__(data)
    }
  }
}

export class FloatTensor extends Tensor {
  data: FloatDimArray
  type = 'FloatTensor'

  constructor(
    data: string|any[]|FloatDimArray,
    autograd = false,
    data_is_pointer = false
  ) {
    super(TENSOR_SUPER)

    let self = this

    if (!data) {
      throw Error('Invalid Data')
    }

    if (autograd) {
      self.autograd(true)
    }

    if (data instanceof FloatDimArray) {
      self.data = data

      controller.sendJSON(self.cmd({
        functionCall: 'create',
        data: Array.from(self.data.data),
        shape: Array.from(self.data.shape)
      }), 'string')
        .then(res => self.__finish__(res as string))
        .catch(err => self.__error__(err))
    } else if (Array.isArray(data)) {
      self.data = new FloatDimArray(data)

      controller.sendJSON(self.cmd({
        functionCall: 'create',
        data: Array.from(self.data.data),
        shape: Array.from(self.data.shape)
      }), 'string')
        .then(res => self.__finish__(res as string))
        .catch(err => self.__error__(err))
    } else if (data_is_pointer) {
      self.id = data
      self.data_is_pointer = true
      self.__finish__(data)
    }
  }

  // TODO: figure this out
  // async autograd(setter: boolean) {
  //   let self = this
  //   await self.ready()
  //   let out
  //
  //   if (setter == void 0) {
  //     if (await self.get('autograd') == '1') {
  //       return true
  //     } else {
  //       return false
  //     }
  //   } else {
  //     if (setter) {
  //       out = await self.set('autograd', ['1'])
  //     } else {
  //       out = await self.set('autograd', ['0'])
  //     }
  //     if ((out == '1' && setter) || (out == '0' && !setter)) {
  //       return self
  //     } else {
  //       return false
  //     }
  //   }
  // }
}
