import EventObserver from './events';
import Logger from './logger';

// Import our types
import Range from './types/range';
import Slice from './types/slice';
import Tuple from 'immutable-tuple';

import { NO_SIMPLIFIER } from './errors';

import * as tf from '@tensorflow/tfjs';

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
        data = data.replace(REPLACERS[i][0], REPLACERS[i][1]);
      }

      return JSON.parse(data);
    };

    /*
      TODO:
      - Consider converting slice and map to be functions with a prototype
      - Improve range and slice
      - Finish torch and pointer tensor
      - Finish plan
    */
    const SIMPLIFIERS = [
      d => new Map(d.map(i => i.map(j => recursiveParse(j)))), // 0 = dict
      d => d.map(i => recursiveParse(i)), // 1 = list
      d => new Range(...d), // 2 = range
      d => new Set(d.map(i => recursiveParse(i))), // 3 = set
      d => new Slice(...d), // 4 = slice
      d => d[0], // 5 = str
      d => Tuple(...d.map(i => recursiveParse(i))), // 6 = tuple
      null, // 7
      null, // 8
      null, // 9
      null, // 10
      null, // 11
      d => {
        // This needs to map to a TensorFlow tensors
        // Needs to have its own type
        // Add other metadata
        // Need to recursively parse all entries of 'd'
        // Create a new class called TorchTensor
        // Inside of TorchTensor have a ._data (private method) which stores the information in the tensor as a TensorFlow tensor
        // IMPORTANT: This whole class should be written as a way to translate Torch tensors and commands to TensorFlow, otherwise if we receive a TensorFlow tensor, just pass it right through... no need to translate!

        // Consider potentially renaming TorchTensor to TensorFlowTensor since we don't have access to Torch in Javascript

        return d;
      }, // 12 = torch-tensor
      null, // 13
      null, // 14
      null, // 15
      null, // 16
      d => {
        // Create a class to represent plans
        // DO THIS ONE LAST

        return d;
      }, // 17 = plan
      d => {
        // Create a class to represent pointer tensors
        // Add all the attributes that are serialized, just as for range and slice

        return d;
      } // 18 = pointer-tensor
    ];

    const recursiveParse = data => {
      if (Array.isArray(data)) {
        const simplifier = SIMPLIFIERS[data[0]];

        if (simplifier !== null) {
          return simplifier(data[1]);
        }

        throw new Error(NO_SIMPLIFIER(data));
      }

      return data;
    };

    return recursiveParse(pythonToJS(data), []);
  }

  detail(data) {
    return data;
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
