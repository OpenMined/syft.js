import * as uuid from 'uuid'
import * as zmq from 'zmq'
import { Tensor } from './Tensor'
import { WorkQueue } from './WorkQueue'

const verbose = true

const identity = uuid.v4()
const socket = zmq.socket(zmq.types.dealer)

socket.identity = identity
socket.connect('tcp://localhost:5555')

export function log(
  message: any
): void {
  if (verbose) {
    console.log(message)
  }
}

// Network Convenience Functions
export function cmd(
  functionCall: string,
  params: any[] = []
): SocketCMD {
  return {
    functionCall: functionCall,
    objectType: 'controller',
    objectIndex: '-1',
    tensorIndexParams: params
  }
}

const wq = new WorkQueue<string, string>(job => {
  // send the command
  socket.send(job.id + JSON.stringify(job.data))
}, 256)

socket.on('message', (res) => {
  let str = res.toString()
  let id = str.slice(0, wq.idLength)
  let result = str.slice(wq.idLength)
  let job = wq.working[id]

  if (job) {
    job.resolve(result)
  }
})

// Introspection
export function num_models() {
  return no_params_func(cmd, 'num_models','int')
}

export function get_model(
  id: number
) {
  // return nn.Model(id).discover()
}

export function load(
  filename: string
) {
  return params_func(cmd,'load_floattensor', [filename], 'FloatTensor')
}

export function save(
  x,
  filename: string
) {
  return x.save(filename)
}

export function concatenate(
  tensors: Tensor[],
  axis = 0
) {

  let ids = tensors.map(t => t.id)

  ids.unshift(axis)

  return params_func(cmd, 'concatenate', ids, 'FloatTensor')
}

export function num_tensors() {
  return no_params_func(cmd, 'num_tensors', 'int')
}

export function new_tensors_allowed(
  allowed?: boolean
) {
    if(allowed == void 0) {
      return no_params_func(cmd, 'new_tensors_allowed', 'bool')
    } else if(allowed) {
      return params_func(cmd, 'new_tensors_allowed', ['True'], 'bool')
    } else {
      return params_func(cmd, 'new_tensors_allowed', ['False'], 'bool')
    }
}

export function get_tensor(
  id: number
): Tensor {
  return new Tensor(id, true)
}

export function __getitem__(
  id: number
) {
  return get_tensor(id)
}

export async function params_func(
  cmd: (name: string, params: any[]) => SocketCMD,
  name: string,
  params: any[],
  return_type?: string
) {
  // send the command
  let res = await wq.queue(JSON.stringify(cmd(name, params)))

  if (res.startsWith('Unity Error:')) {
    // throw new Error(res)
    console.error(new Error(res))
  }

  if (verbose) {
    console.log(res)
  }

  if (return_type == void 0) {
    return
  } else if(return_type == 'FloatTensor') {
      if(res != '-1' && res != '') {
        if(verbose) {
          console.log('FloatTensor.__init__: ' +  res)
        }
        return new FloatTensor(Number(res), true)
      }
      return
  } else if (return_type == 'IntTensor') {
    if(res != '-1' && res != '') {
      if(verbose) {
        console.log('IntTensor.__init__: ' +  res)
      }
      return new IntTensor(Number(res), true)
    }
    return
  } else if (return_type == 'FloatTensor_list') {
    let tensors: Tensor[] = []

    if(res != '') {
      let ids = res.split(',')
      for (let str_id in ids) {
        if (str_id) {
          tensors.push(get_tensor(Number(str_id)))
        }
      }
    }

    return tensors
  } else if (return_type == 'Model_list') {
    let models: any[] = []

    if(res != '') {
      let ids = res.split(',')
      for (let str_id in ids) {
        if (str_id) {
          models.push(get_model(Number(str_id)))
        }
      }
    }

    return models
  } else if (return_type == 'int') {
    return Number(res)
  } else if (return_type == 'string') {
    return String(res)
  } else if (return_type == 'bool') {
    if (res == 'True') {
      return true
    } else if (res == 'False') {
      return false
    }
  }

  return res
}

export function no_params_func(
  cmd: (name: string, params: any[]) => SocketCMD,
  name: string,
  return_type: string
) {
  return params_func(cmd, name, [], return_type)
}

export async function send_json(
  message: string,
  response = true
) {

  // send the command
  let res = await wq.queue(JSON.stringify(message))

  if (res.startsWith('Unity Error:')) {
    // throw new Error(res)
    console.error(new Error(res))
  }
  return res
}
