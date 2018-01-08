import * as controller from './controller'

export class Tensor {
  __error__: Error
  __ready__: boolean
  __waits__: {res: ()=>void, rej: ()=>void}[]

  id: string
  data: Float64Array|Int32Array
  data_is_pointer: boolean
  type: string

  constructor(
    data: string|any[],
    data_is_pointer = false
  ) {
    let self = this

    if (data != void 0 && !data_is_pointer) {

    }

    if (Array.isArray(data)) {
      self.data = new Float64Array(np.array(data))
      self.__ready__ = false

      controller.send_json({
        'objectType': 'IntTensor',
        'functionCall': 'create',
        'data': list(data.flatten()),
        'shape': self.data.shape
      }).then(res => self.__finish__(res))
    } else if (data_is_pointer) {
      self.id = data
      self.data_is_pointer = true
      self.__ready__ = true
    }
  }

  __finish__(res: string) {
    let self = this
    if (/*res*/ true) {
      self.__waits__.forEach(wait => wait.res());
    } else {
      let err = new Error(res)
      self.__error__ = err
      self.__waits__.forEach(wait => wait.rej(err));

    }

    self.__waits__ = []
  }

  async ready() {
    let self = this

    if (self.__error__) {
      throw self.__error__
    } else if (self.__ready__) {
      return
    }

    await new Promise((res, rej) => {
      self.__waits__.push({res, rej})
    })
  }

  async autograd(state: boolean) {
    let self = this
    await self.ready()

    // do nothing
  }

  /*
  * Returns the size of the self tensor as a List.
  *
  * Returns
  * -------
  * Iterable
  * Output list
  */
  async shape() {
    let self = this
    await self.ready()

    return [1,2,3] //list(np.fromstring(self.get('shape')[:-1], sep=',').astype('int'))
  }

  async params_func(
    name: string,
    params: any[],
    return_response = false,
    return_type = 'IntTensor'
  ) {
    let self = this
    await self.ready()

    // send the command
    let res = await controller.send_json(
      self.cmd(name, params)
    )

    controller.log(res)

    if (return_response) {
      if (return_type == 'IntTensor') {
        controller.log('IntTensor.__init__: {}'.format(res))
        return new IntTensor(Number(res), true)
      } else if (return_type == 'FloatTensor') {
        controller.log('IntTensor.__init__: {}'.format(res))
        return new FloatTensor(Number(res), true)
      }
    }

    return res
  }

  async no_params_func(
    name: string,
    return_response = false,
    return_type = 'IntTensor'
  ) {
    let self = this
    await self.ready()

    return await self.params_func(name, [], return_response, return_type)
  }

  async get(
    param_name = 'size',
    response_as_tensor = false,
    return_type = 'IntTensor'
  ) {
    let self = this
    await self.ready()

    return await self.params_func(
      'get',
      [param_name],
      true,
      'string'
    )
  }

  protected cmd(
    functionCall: string,
    tensorIndexParams: any[] = []
  ) {
    let self = this

    return {
      'functionCall': functionCall,
      'objectType': self.type,
      'objectIndex': self.id,
      'tensorIndexParams': tensorIndexParams
    }
  }

  async is_contiguous() {
    let self = this
    await self.ready()

    return true
  }

  async to_numpy() {
    let self = this
    await self.ready()

    let res

    if (self.is_contiguous()) {
      res = await controller.send_json({
        'functionCall': 'to_numpy',
        'objectType': self.type,
        'objectIndex': self.id
      })
      return '' // np.fromstring(res, sep=' ').astype('int').reshape(self.shape())
    } else {
      return ' - non-contiguous - '
    }
  }

  async __repr__(
    verbose = true
  ) {
    let self = this
    await self.ready()

    let tensor_str = String(self.to_numpy())

    let type_str = (await self.shape()).join('x')

    return `${tensor_str}\n[syft.IntTensor: ${self.id} size: ${type_str}]`
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

    return await self.no_params_func('abs', true)
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

    return await self.no_params_func('abs_')
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

    return await self.no_params_func('acos', true)
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

    return await self.no_params_func('acos_')
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
    await self.ready()

    return await self.params_func('addmm_', [x.id, y.id])
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
    await self.ready()

    let copy = await self.copy()
    await copy.params_func('addmm_', [x.id, y.id])

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
    await self.ready()

    return await self.params_func('addmv_', [x.id, y.id])
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
    await self.ready()

    let copy = await self.copy()
    await copy.params_func('addmv_', [x.id, y.id])

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

    return await self.no_params_func('asin', true)
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

    return await self.no_params_func('asin_')
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

    return await self.no_params_func('atan', true)
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

    return await self.no_params_func('atan_')
  }


  /*
  * Performs element-wise addition arithmetic between two tensors
  * Parameters
  * ----------
  * x : FloatTensor
  *     The Second tensor to perform addition with.
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async __add__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(x, 'add', false)
  }

  /*
  * Performs in place element-wise addition arithmetic between two tensors
  * Parameters
  * ----------
  * x : FloatTensor
  *     The Second tensor to perform addition with.
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __iadd__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(x, 'add', true)
  }

  //TODO: get the type of grad
  async backward(grad?: any) {
    let self = this
    await self.ready()

    if (grad == void 0) {
      self.no_params_func('backward')
    } else {
      self.params_func('backward', [grad.id])
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

    return await self.no_params_func('ceil', true)
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

    return await self.no_params_func('ceil_')
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

    return await self.no_params_func('contiguous', true)
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
  async copy() {
    let self = this
    await self.ready()

    return await self.no_params_func('copy', true)
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

    return await self.no_params_func('cos', true)
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

    return await self.no_params_func('cos_')
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

    return await self.no_params_func('cosh', true)
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

    return await self.no_params_func('cosh_')
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
    if (res.length > 0) {
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
    if (res.length > 0) {
      //TODO: figure this out
      return [] // list(map(lambda x: Number(x), res.split(',')[0:-1]))
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

    return await self.params_func('cumsum', [dim], true)
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

    return await self.no_params_func('exp', true)
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

    return self.no_params_func('exp_')
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

    return await self.params_func('expand', args, true)
  }

  //TODO: figure this out
  async index_add(
    indices: ?,
    dim: number,
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.params_func('index_add', [indices.id, dim, x.id], true)
  }

  //TODO: figure this out
  async index_add_(
    indices: ?,
    dim: number,
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.params_func('index_add_', [indices.id, dim, x.id], true)
  }

  //TODO: figure this out
  async index_select(
    dim: number,
    indices: ?
  ) {
    let self = this
    await self.ready()

    return await self.params_func('index_select', [indices.id, dim], true)
  }

  /*
  * Performs division arithmetic between two tensors
  * Parameters
  * ----------
  * x : FloatTensor
  *     Second divident tensor
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async __truediv__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'div', false)
  }

  /*
  * Performs division arithmetic between two tensors inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Second divident tensor
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __itruediv__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'div', true)
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
  async __pow__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'pow', false)
  }

  /*
  * Takes the power of each element in input ('self') with 'x' and
  * returns a tensor with the result inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Exponent tensor
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __ipow__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'pow', true)
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
    await self.ready()

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
    await self.ready()

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

    return await self.no_params_func('floor', true)
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

    return await self.no_params_func('floor_')
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

    return await self.no_params_func('round', true)
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

    return await self.no_params_func('round_')
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
    other: Tensor
  ) {
    let self = this
    await self.ready()

    return self.params_func('mm', [other.id], true)
  }

  async grad() {
    let self = this
    await self.ready()

    return self.get('grad', true)
  }

  /*
  * Performs Modulus arithmetic operation between two tensors.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Dividend tensor
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async __mod__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'remainder', false)
  }

  /*
  * Performs Modulus arithmetic operation between two tensors inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Dividend tensor
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __imod__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(x, 'remainder', true)
  }

  /*
  * Performs Multiplication arithmetic operation between two tensors.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Second tensor to be multiplied with.
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async __mul__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'mul', false)
  }

  /*
  * Performs Multiplication arithmetic operation between two tensors inplace.
  * Parameters
  * ----------
  * x : FloatTensor
  *     Second tensor to be multiplied with.
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __imul__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return await self.arithmetic_operation(x, 'mul', true)
  }

  async __neg__() {
    let self = this
    await self.ready()

    return await self.neg()
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

    return self.no_params_func('neg', true)
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

    return self.no_params_func('neg_')
  }

  async relu() {
    let self = this
    await self.ready()

    return self.no_params_func('relu', true)
  }

  /*
  * Returns reciprocal of square root of tensor element wise.
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

    return self.no_params_func('rsqrt', true)
  }

  async save(
    filename: string
  ) {
    let self = this
    await self.ready()

    return self.params_func('save', [filename], true, 'bool')
  }

  async set(
    param_name = 'size',
    params: any[] = []
  ) {
    let self = this
    await self.ready()

    return await self.params_func('set', [...param_name, params], true, 'none')
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

    return self.no_params_func('sigmoid_')
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

    return self.no_params_func('sigmoid', true)
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

    return self.no_params_func('sign', true)
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

    return self.no_params_func('sign_')
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

    return self.no_params_func('sin', true)
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

    return self.no_params_func('sin_')
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
      return [] //list(np.fromstring(self.get('shape')[:-1], sep=',').astype('int'))
    } else {
      return await self.no_params_func('shape', true)
    }
  }

  async softmax(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return self.params_func('softmax', [dim], true)
  }

  async std(
    dim = -1
  ) {
    let self = this
    await self.ready()

    return self.params_func('std', [dim], true)
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
      return self.no_params_func('stride', true, 'none')
    } else {
      //TODO: figure out this
      let strides = self.params_func('stride', [dim], true, 'none')
      return np.fromstring(strides, sep=' ').astype('long')
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

    return self.no_params_func('sqrt', true)
  }

  async sqrt_() {
    let self = this
    await self.ready()

    return self.no_params_func('sqrt_')
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

    return self.no_params_func('trace', true)
  }

  async trunc() {
    let self = this
    await self.ready()

    return self.no_params_func('trunc', true)
  }

  async to_numpy() {
    let self = this
    await self.ready()

    if (self.is_contiguous()) {
      let res = await controller.send_json({
        'functionCall': 'to_numpy',
        'objectType': 'FloatTensor',
        'objectIndex': self.id
      })

      return np.fromstring(res, ' ').astype('float').reshape(self.shape())
    } else {
      return '--- non-contiguous tensor ---'
    }
  }

  /*
  * Performs element-wise substraction arithmetic between two tensors
  * Parameters
  * ----------
  * x : FloatTensor
  *     The Second tensor to perform addition with.
  * Returns
  * -------
  * FloatTensor
  *     Output tensor
  */
  async __sub__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(x, 'sub', false)
  }

  /*
  * Performs element-wise substraction arithmetic between two tensors
  * Parameters
  * ----------
  * x : FloatTensor
  *     The Second tensor to perform addition with.
  * Returns
  * -------
  * FloatTensor
  *     Caller with values inplace
  */
  async __isub__(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.arithmetic_operation(x, 'sub', true)
  }

  //TODO: figure this out (any)?
  async view(...args: any[]) {
    let self = this
    await self.ready()

    return self.params_func('view', args, true)
  }

  //TODO: figure this out (any)?
  async view_(...args: any[]) {
    let self = this
    await self.ready()

    await self.params_func('view_', args, false)
    return self
  }

  async view_as(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    return self.params_func('view_as', [x.id], true)
  }

  async view_as_(
    x: Tensor
  ) {
    let self = this
    await self.ready()

    self.params_func('view_as_', [x.id], false)
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

    return self.no_params_func('transpose', true)
  }


  async triu(k=0) {
    let self = this
    await self.ready()

    return self.params_func('triu', [k], true)
  }

  async triu_(k=0) {
    let self = this
    await self.ready()

    return self.params_func('triu_', [k])
  }

  async unsqueeze(
    dim: number
  ) {
    let self = this
    await self.ready()

    return self.params_func('unsqueeze', [dim], true)
  }

  async unsqueeze_(
    dim: number
  ) {
    let self = this
    await self.ready()

    return self.params_func('unsqueeze_', [dim], true)
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

    return self.no_params_func('zero_')
  }

  async __repr__(
    verbose = true
  ) {
    let self = this
    await self.ready()

    let tensor_str = String(self.to_numpy())

    let type_str = ''
    for (let dim of await self.shape()) {

      type_str += String(
        dim
      ) + 'x'
    }

    type_str = type_str[:-1]
    let grad = await self.get('grad')
    if (grad == '') {
      grad = 'None'
    }

    let co = String(self.creation_op())

    let desc = '[syft.FloatTensor:'+String(self.id)+' grad:' + grad + ' size:' + type_str + ' c:' + String(self.children()) + ' p:' + String(self.creators()) + ' init:' + co + ']' + '\n'

    if (verbose) {
      let children = await self.children()
      let creators = await self.creators()

      if(children.length > 0) {
        //tensor_str = '\n -------------------------------\n' + tensor_str
        desc += '\n\t-----------children-----------\n'
      }
      for (let child_id of children) {
        desc += '\t' + await (await controller.get_tensor(child_id)).__repr__(false)
      }
      if(children.length > 0){
        if(creators.length > 0){

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

  async __str__() {
    let self = this
    await self.ready()

    return String(await self.to_numpy()).replace(']', ' ').replace('[', ' ')
  }

  async get(
    param_name = 'size',
    response_as_tensor = false
  ) {
    let self = this
    await self.ready()

    if (response_as_tensor) {
      return await self.params_func(
        'get',
        [param_name],
        true,
        'FloatTensor',
        true
      )
    } else {
      return await self.params_func(
        'get',
        [param_name],
        true,
        'string',
        false
      )
    }
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

    return await self.no_params_func('cpu')
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

    return await self.no_params_func('gpu')
  }

  cmd(
    functionCall: string,
    tensorIndexParams: any[] = []
  ) {
    let self = this

    let cmd = {
      'functionCall': functionCall,
      'objectType': 'FloatTensor',
      'objectIndex': self.id,
      'tensorIndexParams': tensorIndexParams}
      return cmd
  }

  async params_func(
    name: string,
    params: any[],
    return_response = false,
    return_type = 'FloatTensor',
    data_is_pointer = true
  ) {
    let self = this
    await self.ready()

    // send the command
    let res = await controller.send_json(
    self.cmd(name, params))

    controller.log(res)

    if (return_response) {
      if (return_type == 'IntTensor'){
        controller.log('IntTensor.__init__: {}'.format(res))
        return new IntTensor(Number(res), data_is_pointer)
      } else if(return_type == 'FloatTensor') {
        controller.log('FloatTensor.__init__: {}'.format(res))
        if(res == '') {
          return null
        }
        return new FloatTensor(Number(res), data_is_pointer)
      } else {
        return res
      }
    }
    return self
  }

  async no_params_func(
    name: string,
    return_response = false,
    return_type = 'FloatTensor'
  ) {
    let self = this
    await self.ready()

    return (self.params_func(name, [], return_response, return_type))
  }

  async arithmetic_operation(
    x: number|Tensor,
    name: string,
    inline=false
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
    let response = await controller.send_json(
      self.cmd(operation_cmd, [parameter])
    )
    return FloatTensor(Number(response), true)
  }

  /*
  * Deletes the input tensor.
  * Parameters
  * ----------
  * Returns
  * -------
  */
  async delete_tensor() {
    let self = this
    await self.ready()

    if (self.id) {
      self.no_params_func('delete')
    }

    delete self.id
  }

  async is_contiguous() {
    let self = this
    await self.ready()

    let txt = (await self.no_params_func('is_contiguous', true))

    if(txt == 'true') {
      return true
    } else {
      return false
    }
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

    return self.no_params_func('sinh', true)
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

    return self.no_params_func('sinh_')
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

    return self.no_params_func('log', true)
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

    return self.no_params_func('log_')
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

    return self.no_params_func('log1p_')
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

    return self.no_params_func('log1p', true)
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

    return self.no_params_func('frac', true)
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

    return self.no_params_func('frac_')
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

    return self.no_params_func('reciprocal', true)
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

    return self.no_params_func('reciprocal_')
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

    return self.no_params_func('rsqrt', true)
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

    return self.no_params_func('rsqrt_')
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

    return self.arithmetic_operation(divisor, 'remainder', 'FloatTensor')
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

    return self.params_func('sample', [dim], true, 'IntTensor')
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

    return self.no_params_func('tan', true)
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

    return self.no_params_func('tan_')
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

    return self.no_params_func('tanh', true)
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

    return self.params_func('squeeze', [dim], true)
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

    return self.params_func('squeeze_', [dim])
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

    return self.params_func('min', [dim, keepdim], true)
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
    await self.dyeay()
    return self.params_func('max', [dim, keepdim], true)
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
    return self.params_func('sum', [dim, keepdim], true)
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
    return self.params_func('prod', [dim, keepdim], true)
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
    return self.params_func('mean', [dim, keepdim], true)
  }
}

export class IntTensor extends Tensor {
  constructor(
    data: string|any[],
    data_is_pointer = false
  ) {
    super(data, data_is_pointer)
  }
}

export class FloatTensor extends Tensor {
  constructor(
    data: string|any[],
    autograd = false,
    data_is_pointer = false
  ) {
    super(data, data_is_pointer)

    let self = this

    if (autograd) {
      self.autograd(true)
    }
  }

  async autograd(setter: boolean) {
    let self = this
    await self.ready()
    let out

    if (setter == void 0) {
      if (await self.get('autograd') == '1') {
        return true
      } else {
        return false
      }
    } else {
      if (setter) {
        out = await self.set('autograd', ['1'])
      } else {
        out = await self.set('autograd', ['0'])
      }
      if ((out == '1' && setter) || (out == '0' && !setter)) {
        return self
      } else {
        return false
      }
    }
  }
}
