import EventObserver from './events';
import Logger from './logger';

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
    return data;
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
