import EventObserver from './events';
import Logger from './logger';

// Import our types
import Range from './custom-types/range';
import Slice from './custom-types/slice';
import Tuple from 'immutable-tuple';
import TorchTensor from './custom-types/torch-tensor';
import Plan from './custom-types/plan';
import PointerTensor from './custom-types/pointer-tensor';

import { getArgs } from './_helpers';
import { NO_SIMPLIFIER, NO_DETAILER } from './_errors';

import * as tf from '@tensorflow/tfjs';
import { get } from 'http';

const SOCKET_STATUS = 'socket-status';
const GET_TENSORS = 'get-tensors';
const GET_TENSOR = 'get-tensor';
const MESSAGE_RECEIVED = 'message-received';
const MESSAGE_SENT = 'message-sent';
const RUN_OPERATION = 'run-operation';
const TENSOR_ADDED = 'add-tensor';
const TENSOR_REMOVED = 'remove-tensor';

export default class Syft {
  /* ----- CONSTRUCTOR ----- */
  constructor(opts = {}) {
    const { url, verbose } = opts;

    // Where all tensors are stored locally
    this.tensors = [];

    // Set events to be listened to
    this.observer = new EventObserver();

    // Set logger
    this.logger = new Logger(verbose);

    // A saved instance of the socket connection
    this.socket = this.createSocketConnection(url);
  }

  /* ----- TEMPORARY ----- */

  simplify(data) {
    const REPLACERS = [
      [/null/g, 'None'], // Convert all nulls to Nones
      [/false/g, 'False'], // Convert all false to False
      [/true/g, 'True'] // Convert all true to True
    ];

    const jsToPython = data => {
      for (let i = 0; i < REPLACERS.length; i++) {
        data = data.replace(...REPLACERS[i]);
      }

      return data;
    };

    const SIMPLIFIERS = [
      d =>
        `(0, [${Array.from(d)
          .map(([key, value]) => `(${parse(key)}, ${parse(value)})`)
          .join()}])`, // 0 = dict
      d => `(1, [${d.map(i => parse(i)).join()}])`, // 1 = list
      d => `(2, (${d.start}, ${d.end}, ${d.step}))`, // 2 = range
      d => `(3, [${[...d].map(i => parse(i)).join()}])`, // 3 = set
      d => `(4, (${d.start}, ${d.end}, ${d.step}))`, // 4 = slice

      // TODO: Currently we're inserting "b" and "," because of how MsgPack does things in PySyft
      // Hopefully at some point we can remove these silly, entraneous details
      // TODO: We will also need to fix this in the REPLACERS for the detail function
      d => `(5, (b'${d}',))`, // 5 = str
      d => `(6, [${d.map(i => parse(i)).join()}])`, // 6 = tuple
      null, // 7
      null, // 8
      null, // 9
      null, // 10
      null, // 11
      d =>
        `(12, (${getArgs(TorchTensor)
          .map(i => (d[i] === null ? 'null' : parse(d[i])))
          .join()}))`, // 12 = torch-tensor
      null, // 13
      null, // 14
      null, // 15
      null, // 16
      d =>
        `(17, (${getArgs(Plan)
          .map(i => (d[i] === null ? 'null' : parse(d[i])))
          .join()}))`, // 17 = plan
      d =>
        `(18, (${getArgs(PointerTensor)
          .map(i => (d[i] === null ? 'null' : parse(d[i])))
          .join()}))` // 18 = pointer-tensor
    ];

    const parse = data => {
      let simplifierId = null;

      if (data instanceof Map) simplifierId = 0;
      else if (data instanceof Array) simplifierId = 1;
      else if (data instanceof Range) simplifierId = 2;
      else if (data instanceof Set) simplifierId = 3;
      else if (data instanceof Slice) simplifierId = 4;
      else if (typeof data === 'string') simplifierId = 5;
      else if (data instanceof Tuple) simplifierId = 6;
      else if (data instanceof TorchTensor) simplifierId = 12;
      else if (data instanceof Plan) simplifierId = 17;
      else if (data instanceof PointerTensor) simplifierId = 18;

      if (simplifierId !== null) {
        const simplifier = SIMPLIFIERS[simplifierId];

        if (simplifier) {
          return simplifier(data);
        }

        throw new Error(NO_SIMPLIFIER(simplifierId, data));
      }

      return data;
    };

    return jsToPython(parse(data));
  }

  detail(data) {
    const REPLACERS = [
      [/\(/g, '['], // Convert all Python tuples into a Javascript Array
      [/\)/g, ']'],
      [/b'/g, "'"], // Convert all undefined 'b' functions everywhere, remove them
      [/'/g, '"'], // Convert all single quotes to double quotes
      [/None/g, null], // Convert all Nones to nulls
      [/False/g, false], // Convert all False to false
      [/True/g, true], // Convert all True to true
      [/,]/g, ']'] // Trim all Arrays with an extra comma
    ];

    const pythonToJS = data => {
      for (let i = 0; i < REPLACERS.length; i++) {
        data = data.replace(...REPLACERS[i]);
      }

      return JSON.parse(data);
    };

    const DETAILERS = [
      d => new Map(d.map(i => i.map(j => parse(j)))), // 0 = dict
      d => d.map(i => parse(i)), // 1 = list
      d => new Range(...d), // 2 = range
      d => new Set(d.map(i => parse(i))), // 3 = set
      d => new Slice(...d), // 4 = slice
      d => d[0], // 5 = str
      d => Tuple(...d.map(i => parse(i))), // 6 = tuple
      null, // 7
      null, // 8
      null, // 9
      null, // 10
      null, // 11
      d => new TorchTensor(...d.map(i => parse(i))), // 12 = torch-tensor
      null, // 13
      null, // 14
      null, // 15
      null, // 16
      d => new Plan(d[0].map(j => parse(j)), ...d.slice(1).map(i => parse(i))), // 17 = plan
      d => new PointerTensor(...d.map(i => parse(i))) // 18 = pointer-tensor
    ];

    const detailable = d =>
      Array.isArray(d) &&
      d.length === 2 &&
      typeof d[0] === 'number' &&
      Array.isArray(d[1]);

    const parse = data => {
      if (detailable(data)) {
        const detailer = DETAILERS[data[0]];

        if (detailer) {
          return detailer(data[1]);
        }

        throw new Error(NO_DETAILER(data));
      }

      return data;
    };

    return parse(pythonToJS(data));
  }

  /* ----- HELPERS ----- */

  // Gets a list of all stored tensors
  getTensors() {
    const tensors = this.tensors;

    this.sendMessage(GET_TENSORS, tensors);

    return tensors;
  }

  // Gets a tensor by a given id
  getTensorById(id) {
    const tensor = this.tensors.find(x => x.id === id) || null;

    this.sendMessage(GET_TENSOR, tensor);

    return tensor;
  }

  // Gets the index of the tensor (found by id) in the stored tensor list
  getTensorIndex(passedId) {
    let returnedIndex = null;

    // Look through all tensors and find the index if it exists
    this.tensors.forEach(({ id }, index) => {
      if (id === passedId) {
        returnedIndex = index;
      }
    });

    return returnedIndex;
  }

  /* ----- FUNCTIONALITY ----- */

  // Adds a tensor to the list of stored tensors
  addTensor(id, tensor) {
    this.logger.log(`Adding tensor "${id}", with value:`, tensor);

    // Create a tensor in TensorFlow
    let createdTensor = {
      id,
      tensor: tf.tensor(tensor)
    };

    // Push it onto the stack
    this.tensors.push(createdTensor);

    this.sendMessage(TENSOR_ADDED, createdTensor);

    this.observer.broadcast(TENSOR_ADDED, {
      id,
      tensor: createdTensor.tensor,
      tensors: this.tensors
    });

    // Return the list of tensors in a Promise so the user knows it was added
    return Promise.resolve(this.tensors);
  }

  // Removes a tensor from the list of stored tensors
  removeTensor(id) {
    this.logger.log(`Removing tensor "${id}"`);

    // Find the index of the tensor
    const index = this.getTensorIndex(id);

    // Remove it if we found it
    if (index !== null) {
      this.tensors.splice(index, 1);

      this.sendMessage(TENSOR_REMOVED, id);

      this.observer.broadcast(TENSOR_REMOVED, { id, tensors: this.tensors });

      // Return the list of tensors in a Promise so the user knows it was removed
      return Promise.resolve(this.tensors);
    }

    return Promise.reject({ error: 'We cannot find a tensor with that id' });
  }

  // Runs any TensorFlow operation over two given tensors
  runOperation(func, tensors, result_id = null) {
    this.logger.log(
      `Running operation "${func}" on "${tensors[0]}" and "${tensors[1]}"`
    );

    // Find our tensors in the stored tensors list
    const firstTensor = this.getTensorById(tensors[0]);
    const secondTensor = this.getTensorById(tensors[1]);

    // Did we find both tensors?
    if (firstTensor && secondTensor) {
      // Does the first tensor have this function?
      if (typeof firstTensor.tensor[func] === 'function') {
        // We're all good - run the command
        const result = firstTensor.tensor[func](secondTensor.tensor);

        this.sendMessage(RUN_OPERATION, {
          result,
          result_id,
          tensors: [firstTensor, secondTensor]
        });

        this.observer.broadcast(RUN_OPERATION, { func, result, result_id });

        return Promise.resolve(result);
      }

      return Promise.reject({ error: 'Function not found in TensorFlow' });
    }

    return Promise.reject({ error: 'Cannot find tensors' });
  }

  /* ----- EVENT HANDLERS ----- */

  onMessageReceived(func) {
    this.observer.subscribe(MESSAGE_RECEIVED, func);
  }

  onMessageSent(func) {
    this.observer.subscribe(MESSAGE_SENT, func);
  }

  onRunOperation(func) {
    this.observer.subscribe(RUN_OPERATION, func);
  }

  onTensorAdded(func) {
    this.observer.subscribe(TENSOR_ADDED, func);
  }

  onTensorRemoved(func) {
    this.observer.subscribe(TENSOR_REMOVED, func);
  }

  /* ----- SOCKET COMMUNICATION ----- */

  // Creates a socket connection if a URL is available
  createSocketConnection(url) {
    if (url) {
      this.logger.log(`Creating socket connection at "${url}"`);

      return new WebSocket(url);
    }

    return null;
  }

  // Receives a socket message from the server
  receiveMessage(event) {
    event = JSON.parse(event);

    this.logger.log(`Received a message of type "${event.type}"`, event);

    if (event.type === TENSOR_ADDED) {
      // We have a new tensor, store it...
      this.addTensor(event.id, event.values);
    } else if (event.type === TENSOR_REMOVED) {
      // We need to remove a tensor...
      this.removeTensor(event.id);
    } else if (event.type === GET_TENSOR) {
      // We need to get a tensor...
      this.getTensorById(event.id);
    } else if (event.type === GET_TENSORS) {
      // We need to get all tensors...
      this.getTensors();
    } else if (event.type === RUN_OPERATION) {
      // We have a request to perform an operation, run it...
      this.runOperation(event.func, event.tensors, event.result_id);
    }

    this.observer.broadcast(MESSAGE_RECEIVED, event);
  }

  // Sends a socket message back to the server
  sendMessage(type, data) {
    // If we're capable of sending a message
    if (this.socket && this.socket.readyState === 1) {
      // Construct the message
      const message = { type, data };

      this.logger.log(`Sending message to "${this.socket.url}"`, message);

      // Send it via JSON
      this.socket.send(JSON.stringify(message));

      this.observer.broadcast(MESSAGE_SENT, message);

      return Promise.resolve(message);
    }
  }

  // Starts syft.js
  start(url) {
    // Tell PySyft that we're booting up
    this.sendMessage(SOCKET_STATUS, { status: 'starting' });

    this.logger.log('Starting up...');

    if (url) {
      this.socket = this.createSocketConnection(url);
    }

    // Tell PySyft that we're ready to receive instructions
    this.sendMessage(SOCKET_STATUS, { status: 'ready' });

    // Listen for incoming messages and dispatch them appropriately
    this.socket.onmessage = this.receiveMessage;
  }

  // Stops syft.js
  stop() {
    this.logger.log('Shutting down...');

    // Tell PySyft that we're stopping
    this.sendMessage(SOCKET_STATUS, { status: 'stopped' });

    // Kill the socket connection
    this.socket.close();

    // Destroy record of the tensors and socket connection
    this.tensors = [];
    this.socket = null;
  }
}
