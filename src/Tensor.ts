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
}
/*








class FloatTensor():
  # async __del__(self):
  #     self.delete_tensor()







    async autograd(self, setter=None):
        if (setter is None):
            if (self.get('autograd') == '1'):
                return true
            else:
                return false
        else:
            if (setter):
                out = self.set('autograd', ['1'])
            else:
                out = self.set('autograd', ['0'])

            if (out == '1' and setter) or (out == '0' and not setter):
                return self
            else:
                return false

    async __add__(self, x):
        ///
        Performs element-wise addition arithmetic between two tensors
        Parameters
        ----------
        x : FloatTensor
            The Second tensor to perform addition with.
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'add', false)

    async __iadd__(self, x):
        ///
        Performs in place element-wise addition arithmetic between two tensors
        Parameters
        ----------
        x : FloatTensor
            The Second tensor to perform addition with.
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'add', true)

    async backward(self, grad=None):
        if (grad is None):
            self.no_params_func('backward')
        else:
            self.params_func(name='backward', params=[grad.id])

    async ceil(self):
        ///
        Performs the ceiling of the input tensor element-wise.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('ceil', return_response=true)

    async ceil_(self):
        ///
        Performs the inplace ceiling of the input tensor element-wise.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('ceil_')

    async contiguous(self):
        ///
        Returns a copy of the input
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('contiguous', return_response=true)

    async copy(self):
        ///
        Returns a copy of the input
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('copy', return_response=true)

    async cos(self):
        ///
        Returns a new Tensor with the cosine of the elements of input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('cos', return_response=true)

    async cos_(self):
        ///
        Performs the cosine of the input tensor inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('cos_')

    async cosh(self):
        ///
        Returns a new Tensor with hyperbolic cosine of the elements of input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('cosh', return_response=true)

    async cosh_(self):
        ///
        Returns the hyperbolic cosine of the input inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('cosh_')

    async children(self):
        ///
        Returns an iterator over immediate children modules.
        Parameters
        ----------
        Returns
        -------
        Iterable
            Returns a list of children
        ///
        res = self.get('children')
        if (len(res) > 0):
            return list(map(lambda x: int(x), res.split(',')[0:-1]))
        return []

    async creation_op(self):
        return self.get('creation_op')

    async creators(self):
        ///
        Returns an iterator over immediate creators of input tensor.
        Parameters
        ----------
        Returns
        -------
        Returns a list of creators
        ///
        res = self.get('creators')
        if (len(res) > 0):
            return list(map(lambda x: int(x), res.split(',')[0:-1]))
        return []

    async cumsum(self, dim=0):
        ///
        Returns the sum of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('cumsum', [dim], return_response=true)

    async dataOnGpu(self):
        if (self.get('dataOnGpu') == '1'):
            return true
        return false

    async exp(self):
        ///
        Computes the exponential of each element of input tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('exp', return_response=true)

    async exp_(self):
        ///
        Computes the exponential of each element of input tensor inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('exp_')

    async expand(self,*args):
        ///
        Returns the tensor, with values repeated across one dimension
        Parameters
        ----------
        args : list
               the new, expanded size
        Returns
        -------
        FloatTensor
            the new, expanded tensor.
        ///
        new_dim = list(args)
        assert type(new_dim[0]) == int
        return self.params_func('expand', new_dim, return_response=true)

    async index_add(self, indices, dim, x):
        return self.params_func('index_add', [indices.id, dim, x.id], return_response=true)

    async index_add_(self, indices, dim, x):
        return self.params_func('index_add_', [indices.id, dim, x.id], return_response=true)

    async index_select(self, dim, indices):
        return self.params_func('index_select', [indices.id, dim], return_response=true)

    async __truediv__(self, x):
        ///
        Performs division arithmetic between two tensors
        Parameters
        ----------
        x : FloatTensor
            Second divident tensor
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'div', false)

    async __itruediv__(self, x):
        ///
        Performs division arithmetic between two tensors inplace.
        Parameters
        ----------
        x : FloatTensor
            Second divident tensor
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'div', true)

    async keepgrad(self):
        if (self.get('keepgrad') == '1'):
            return true
        else:
            return false

    async __pow__(self, x):
        ///
        Takes the power of each element in input ('self') with 'x' and
        returns a tensor with the result.
        Parameters
        ----------
        x : FloatTensor
            Exponent tensor
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'pow', false)

    async __ipow__(self, x):
        ///
        Takes the power of each element in input ('self') with 'x' and
        returns a tensor with the result inplace.
        Parameters
        ----------
        x : FloatTensor
            Exponent tensor
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'pow', true)

    async pow(self, x):
        ///
        Takes the power of each element in input ('self') with 'x' and
        returns a tensor with the result.
        Parameters
        ----------
        x : FloatTensor
            Exponent tensor
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'pow', false)

    async pow_(self, x):
        ///
        Takes the power of each element in input ('self') with 'x', inplace.
        Parameters
        ----------
        x : FloatTensor
            Exponent tensor
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'pow', true)

    async floor(self):
        ///
        Performs the floor of the input tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('floor', true)

    async floor_(self):
        ///
        Performs the inplace floor of the input tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('floor_')

    async round(self):
        ///
        Performs Round-ing to the nearest decimal,
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('round', return_response=true)

    async round_(self):
        ///
        Performs Round-ing to the nearest decimal inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('round_')

    async mm(self, other):
        ///
        Performs a matrix multiplication of two tensors.
        Parameters
        ----------
        other : FloatTensor
            Second tensor to be multiplied with
        Returns
        -------
        FloatTensor
            n x m Output tensor
        ///
        return self.params_func('mm', [other.id], true)

    async grad(self):
        return self.get('grad', response_as_tensor=true)

    async __mod__(self, x):
        ///
        Performs Modulus arithmetic operation between two tensors.
        Parameters
        ----------
        x : FloatTensor
            Dividend tensor
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'remainder', false)

    async __imod__(self, x):
        ///
        Performs Modulus arithmetic operation between two tensors inplace.
        Parameters
        ----------
        x : FloatTensor
            Dividend tensor
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'remainder', true)

    async __mul__(self, x):
        ///
        Performs Multiplication arithmetic operation between two tensors.
        Parameters
        ----------
        x : FloatTensor
            Second tensor to be multiplied with.
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'mul', false)

    async __imul__(self, x):
        ///
        Performs Multiplication arithmetic operation between two tensors inplace.
        Parameters
        ----------
        x : FloatTensor
            Second tensor to be multiplied with.
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'mul', true)

    async __neg__(self):
        return self.neg()

    async neg(self):
        ///
        Sets negative of the elements of tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('neg', return_response=true)

    async neg_(self):
        ///
        Sets negative of the elements of tensor inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('neg_')

    async relu(self):

        return self.no_params_func('relu', return_response=true)

    async rsqrt(self):
        ///
        Returns reciprocal of square root of tensor element wise.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('rsqrt', return_response=true)

    async save(self, filename):
        return self.params_func(name='save', params=[filename], return_response=true, return_type=bool)

    async set(self, param_name='size', params=[]):
        return self.params_func(name='set', params=[param_name] + params, return_response=true, return_type=None)

    async sigmoid_(self):
        ///
        Performs inplace sigmoid function on the tensor element-wise.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace.
        ///
        return self.no_params_func('sigmoid_')

    async sigmoid(self):
        ///
        Returns a new tensor holding element wise values of Sigmoid function.
        Sigmoid(x) = 1 / 1+exp(-x)
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('sigmoid', return_response=true)

    async sign(self):
        ///
        Computes sign of each element of the tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('sign', return_response=true)

    async sign_(self):
        ///
        Computes the sign of each element of the tensor inplace
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('sign_')

    async sin(self):
        ///
        Computes sin of each element of the tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('sin', return_response=true)

    async sin_(self):
        ///
        Computes the sine of each element of the tensor inplace
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('sin_')

    async size(self):
        ///
        Returns the size of tensor.
        Parameters
        ----------
        Returns
        -------
        int
            int with value of size
        ///
        return int(self.get('size'))

    async shape(self, as_list=true):
        ///
        Returns the size of the self tensor as a FloatTensor (or as List).
        Note:
            The returned value currently is a FloatTensor because it leverages
            the messaging mechanism with Unity.
        Parameters
        ----------
        as_list : bool
            Value retruned as list if true; else as tensor
        Returns
        -------
        FloatTensor
            Output tensor
        (or)
        Iterable
            Output list
        ///
        if (as_list):
            return list(np.fromstring(self.get('shape')[:-1], sep=',').astype('int'))
        else:
            shape_tensor = self.no_params_func('shape', return_response=true)
            return shape_tensor

    async softmax(self, dim=-1):
        return self.params_func('softmax', [dim], return_response=true)

    async std(self, dim=-1):
        return self.params_func('std', [dim], return_response=true)

    async stride(self, dim=-1):
        ///
        Returns the stride of tensor.
        Parameters
        ----------
        dim : int
            dimension of expected return

        Returns
        -------
        FloatTensor
            Output tensor.
        (or)
        numpy.ndarray
            NumPy Array as Long
        ///
        if dim == -1:
            return self.no_params_func('stride', return_response=true, return_type=None)
        else:
            strides = self.params_func('stride', [dim], return_response=true, return_type=None)
            return np.fromstring(strides, sep=' ').astype('long')

    async sqrt(self):
        ///
        Returns a new tensor with the square-root of the elements of input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor:
            Output Tensor
        ///
        return self.no_params_func('sqrt', return_response=true)

    async sqrt_(self):
        return self.no_params_func('sqrt_')

    async trace(self):
        ///
        Returns a new tensor with the sum along diagonals of a 2D tensor.
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('trace', return_response=true)

    async trunc(self):
        return self.no_params_func('trunc', return_response=true)

    async to_numpy(self):
        if(self.is_contiguous()):
            res = controller.send_json({
                'functionCall': 'to_numpy',
                'objectType': 'FloatTensor',
                'objectIndex': self.id
            })

            return np.fromstring(res, sep=' ').astype('float').reshape(self.shape())
        else:
            return '--- non-contiguous tensor ---'

    async __sub__(self, x):
        ///
        Performs element-wise substraction arithmetic between two tensors
        Parameters
        ----------
        x : FloatTensor
            The Second tensor to perform addition with.
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(x, 'sub', false)

    async __isub__(self, x):
        ///
        Performs element-wise substraction arithmetic between two tensors
        Parameters
        ----------
        x : FloatTensor
            The Second tensor to perform addition with.
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(x, 'sub', true)

    async view(self, *args):
        new_dim = list(args)
        assert type(new_dim) == list
        assert type(new_dim[0]) == int
        return self.params_func('view', new_dim, return_response=true)

    async view_(self, *args):
        new_dim = list(args)
        assert type(new_dim) == list
        assert type(new_dim[0]) == int
        self.params_func('view_', new_dim, return_response=false)
        return self

    async view_as(self, x):
        assert type(x) == FloatTensor
        return self.params_func('view_as', [x.id], return_response=true)

    async view_as_(self, x):
        assert type(x) == FloatTensor
        self.params_func('view_as_', [x.id], return_response=false)
        return self

    async T(self):
        ///
        Returns a tensor that is a transposed version of input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('transpose', return_response=true)

    async triu(self, k=0):
        return self.params_func('triu', [k], return_response=true)

    async triu_(self, k=0):
        return self.params_func('triu_', [k])

    async unsqueeze(self,dim):
        return self.params_func('unsqueeze', [dim], return_response=true)

    async unsqueeze_(self,dim):
        return self.params_func('unsqueeze_', [dim], return_response=true)

    async zero_(self):
        ///
        Fills this tensor with zeros inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('zero_')

    async __repr__(self, verbose=true):

        tensor_str = str(self.to_numpy())

        type_str = ''
        for dim in self.shape():
            type_str += str(dim) + 'x'

        type_str = type_str[:-1]
        grad = self.get('grad')
        if (grad == ''):
            grad = 'None'

        co = str(self.creation_op())

        desc = '[syft.FloatTensor:'+str(self.id)+' grad:' + grad + ' size:' + type_str + ' c:' + str(self.children()) + ' p:' + str(self.creators()) + ' init:' + co + ']' + '\n'

        if (verbose):
            children = self.children()
            creators = self.creators()

            if(len(children) > 0):
                #tensor_str = '\n -------------------------------\n' + tensor_str
                desc += '\n\t-----------children-----------\n'
            for child_id in children:
                desc += '\t' + syft.controller.get_tensor(child_id).__repr__(false)
            if(len(children) > 0):
                if(len(creators) > 0):

                    desc += '\t------------------------------\n'
                else:
                    desc += '\t------------------------------\n\n\n'

            if (len(creators) > 0):
                # tensor_str = '\n -------------------------------\n' + tensor_str
                desc += '\n\t-----------creators-----------\n'
            for parent_id in creators:
                desc += '\t' + syft.controller.get_tensor(parent_id).__repr__(false)
            if (len(creators) > 0):
                desc += '\t------------------------------\n\n\n'

            return tensor_str + '\n' + desc
        return desc

    async __str__(self):
        tensor_str = str(self.to_numpy()).replace(']', ' ').replace('[', ' ')

        return tensor_str

    async get(self, param_name='size', response_as_tensor=false):
        if(response_as_tensor):
            return self.params_func(name='get', params=[param_name], return_response=true,
                                return_type='FloatTensor', data_is_pointer=true)
        else:
            return self.params_func(name='get', params=[param_name], return_response=true,
                                return_type='string', data_is_pointer=false)

    async cpu(self):
        ///
        Returns a CPU copy of this storage if it's not already on the CPU
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('cpu')

    async gpu(self):
        ///
        Returns a GPU copy of this storage if it's not already on the GPU
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('gpu')

    async cmd(self, functionCall, tensorIndexParams=[]):
        cmd = {
            'functionCall': functionCall,
            'objectType': 'FloatTensor',
            'objectIndex': self.id,
            'tensorIndexParams': tensorIndexParams}
        return cmd

    async params_func(self, name, params, return_response=false, return_type='FloatTensor', data_is_pointer=true,):
        # send the command
        res = controller.send_json(
            self.cmd(name, tensorIndexParams=params))

        controller.log(res)

        if (return_response):
            if (return_type == 'IntTensor'):
                controller.log('IntTensor.__init__: {}'.format(res))
                return IntTensor(data=int(res), data_is_pointer=data_is_pointer)
            elif(return_type == 'FloatTensor'):
                controller.log('FloatTensor.__init__: {}'.format(res))
                if(res == ''):
                    return None
                return FloatTensor(data=int(res), data_is_pointer=data_is_pointer)
            else:
                return res
        return self

    async no_params_func(self, name, return_response=false, return_type='FloatTensor'):
        return (self.params_func(name, [], return_response, return_type))

    async arithmetic_operation(self, x, name, inline=false):

        operation_cmd = name

        if (type(x) == FloatTensor):
            operation_cmd += '_elem'
            parameter = x.id
        else:
            operation_cmd += '_scalar'
            parameter = str(x)

        if (inline):
            operation_cmd += '_'

        response = controller.send_json(
            self.cmd(operation_cmd, [parameter]))  # sends the command
        return FloatTensor(data=int(response), data_is_pointer=true)

    async delete_tensor(self):
        ///
        Deletes the input tensor.
        Parameters
        ----------
        Returns
        -------
        ///
        if (self.id is not None):
            self.no_params_func('delete')
        controller = None
        self.id = None


    async is_contiguous(self):
        txt = (self.no_params_func('is_contiguous', return_response=true, return_type=None))
        if(txt == 'true'):
            return true

        else:
            return false

    async sinh(self):
        ///
        Returns the hyperbolic sine of the input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('sinh', return_response=true)

    async sinh_(self):
        ///
        Returns the hyperbolic sine of the input inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace.
        ///
        return self.no_params_func('sinh_')

    async log(self):
        ///
        Returns the logarithm of the input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('log', return_response=true)

    async log_(self):
        ///
        Returns the logarithm of the input inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace.
        ///
        return self.no_params_func('log_')

    async log1p_(self):
        ///
        Returns the natural logarithm of (1 + input) inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace.
        ///
        return self.no_params_func('log1p_')

    async log1p(self):
        ///
        Returns a new tensor with the natural logarithm of (1 + 'self').
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('log1p', return_response=true)

    async frac(self):
        ///
        Computes the fractional portion of each element in tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('frac', return_response=true)

    async frac_(self):
        ///
        Computes the fractional portion of each element in tensor, inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('frac_')

    async reciprocal(self):
        ///
        Computes the reciprocal of the input tensor.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('reciprocal', return_response=true)

    async reciprocal_(self):
        ///
        Computes reciprocal of input tensor with values inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('reciprocal_')

    async rsqrt(self):
        ///
        Returns a new tensor with the reciprocal of the square-root of each of
        the elements of input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('rsqrt', return_response=true)

    async rsqrt_(self):
        ///
        Computes the reciprocal of the square-root of each of the elements of input,
        inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('rsqrt_')

    async remainder(self, divisor):
        ///
        Computes the element-wise remainder of division.
        inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.arithmetic_operation(divisor, 'remainder')

    async remainder_(self, divisor):
        ///
        Computes the element-wise remainder of division, inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.arithmetic_operation(divisor, 'remainder', 'FloatTensor')

    async sample(self,dim):
        ///
        Samples the current tensor uniformly assuming each value is a binary probability.
        ----------
        Returns
        -------
        IntTensor
            Output tensor
        ///
        return self.params_func('sample', [dim], return_response=true, return_type='IntTensor')

    async tan(self):
        ///
        Returns the tangent of the input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('tan', return_response=true)

    async tan_(self):
        ///
        Returns the tangent of the input inplace.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.no_params_func('tan_')

    async tanh(self):
        ///
        Returns the hyperbolic tangent of the input.
        Parameters
        ----------
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.no_params_func('tanh', return_response=true)

    async squeeze(self, dim=-1):
        ///
        Returns a tensor with all the dimensions of input of size 1 removed.
        Parameters
        ----------
        dim : int
            When dim is given, a squeeze operation is done only in the given
            dimension.
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('squeeze', [dim], return_response=true)

    async squeeze_(self, dim=-1):
        ///
        Removes all the dimensions of input tensor of size 1, inplace.
        Parameters
        ----------
        dim : int
            When dim is given, a squeeze operation is done only in the given
            dimension.
        Returns
        -------
        FloatTensor
            Caller with values inplace
        ///
        return self.params_func('squeeze_', [dim])

    async min(self, dim=-1, keepdim=false):
        ///
        Returns the minimum value of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('min', [dim, keepdim], return_response=true)

    async max(self, dim=-1, keepdim=false):
        ///
        Returns the maximum value of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('max', [dim, keepdim], return_response=true)

    async sum(self, dim=-1, keepdim=false):
        ///
        Returns the sum of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('sum', [dim, keepdim], return_response=true)

    async prod(self, dim=-1, keepdim=false):
        ///
        Returns the product of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('prod', [dim, keepdim], return_response=true)

    async mean(self, dim=-1, keepdim=false):
        ///
        Returns the mean value of all elements in the input tensor.
        Parameters
        ----------
        dim : int
            the dimension to reduce
        keepdim : bool
            whether the output tensors have dim retained or not
        Returns
        -------
        FloatTensor
            Output tensor
        ///
        return self.params_func('mean', [dim, keepdim], return_response=true)
*/
