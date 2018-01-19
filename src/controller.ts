import * as uuid from 'uuid'
import * as zmq from 'zmq'
import {
  Tensor,
  FloatTensor,
  IntTensor
} from './Tensor'
import { WorkQueue } from './WorkQueue'
import { Model } from './Model'

const verbose = false


const identity = uuid.v4()
const socket = zmq.socket('dealer')

socket.identity = identity
socket.connect('tcp://localhost:5555')

export function log(
  ...args: any[]
): void {
  if (verbose) {
    console.log(...args)
  }
}

// Network Convenience Functions
export function cmd(
  options: {
    [key: string]: any
    functionCall: string
    tensorIndexParams?: any[],
  }
): SocketCMD {
  return {
    objectType: 'controller',
    objectIndex: '-1',
    tensorIndexParams: [],
    ...options
  }
}

const wq = new WorkQueue<string, string>(job => {
  // send the command
  log('sending:', job.data)
  socket.send(/*job.id + */job.data)
}, 1)

socket.on('message', (res) => {

  //TODO: allow for mutiple request at once
  // let str = res.toString()
  // let id = str.slice(0, wq.idLength)
  // let result = str.slice(wq.idLength)

  let job;
  for (let id in wq.working) {
    job = wq.working[id]
  }

  if (job) {
    let r = res.toString()

    log('receiving:', r)

    if (r.startsWith('Unity Error:')) {
      job.reject(new Error(r))
    } else {
      job.resolve(r)
    }
  }
})

// Introspection
export async function num_models() {
  return sendJSON(cmd({
    functionCall: 'num_models'
  }), 'int')
}

export async function load(
  filename: string
) {
  return sendJSON(cmd({
    functionCall: 'load_floattensor',
    tensorIndexParams: [filename]
  }), 'FloatTensor')
}

export function save(
  x: Tensor,
  filename: string
) {
  return x.save(filename)
}

export function concatenate(
  tensors: Tensor[],
  axis = 0
) {

  let ids = tensors.map(t => t.id)

  return sendJSON(cmd({
    functionCall: 'concatenate',
    tensorIndexParams: [axis, ...ids]
  }), 'FloatTensor')
}

export function num_tensors() {
  return sendJSON(cmd({
    functionCall: 'num_tensors'
  }), 'int')
}

export function new_tensors_allowed(
  allowed?: boolean
) {
    if (allowed == void 0) {
      return sendJSON(cmd({
        functionCall:'new_tensors_allowed'
      }), 'bool')
    } else if (allowed) {
      return sendJSON(cmd({
        functionCall:'new_tensors_allowed',
        tensorIndexParams: ['True']
      }), 'bool')
    } else {
      return sendJSON(cmd({
        functionCall:'new_tensors_allowed',
        tensorIndexParams: ['False']
      }), 'bool')
    }
}

export function get_tensor(
  id: string
): Tensor {
  return new FloatTensor(id, true)
}

export function __getitem__(
  id: string
) {
  return get_tensor(id)
}

export async function sendJSON(
  message: SocketCMD,
  return_type?: string
) {
  let data = JSON.stringify(message)

  // send the command
  let res = await wq.queue(data)

  if (return_type == void 0) {
    return
  } else if (return_type == 'FloatTensor') {
      if (res != '-1' && res != '') {
        return new FloatTensor(res)
      }
      return
  } else if (return_type == 'IntTensor') {
    if (res != '-1' && res != '') {
      return new IntTensor(res)
    }
    return
  } else if (return_type == 'FloatTensor_list') {
    let tensors: Tensor[] = []

    if (res != '') {
      let ids = res.split(',')
      for (let str_id in ids) {
        if (str_id) {
          tensors.push(new FloatTensor(str_id))
        }
      }
    }

    return tensors
  } else if (return_type == 'Model_list') {
    let models: any[] = []

    if (res != '') {
      let ids = res.split(',')
      for (let str_id in ids) {
        if (str_id) {
          models.push(await Model.getModel(str_id))
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
