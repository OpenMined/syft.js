import EventObserver from './events';
import Logger from './logger';

import * as tf from '@tensorflow/tfjs';

const MESSAGE_RECEIVED = 'message-received';
const MESSAGE_SENT = 'message-sent';
const RAN_OPERATION = 'operation';
const TENSOR_ADDED = 'tensor-added';
const TENSOR_REMOVED = 'tensor-removed';

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

  /* ----- HELPERS ----- */

  // Gets a list of all stored tensors
  getTensors() {
    return this.tensors;
  }

  // Gets a tensor by a given id
  getTensorById(id) {
    return this.tensors.find(x => x.id === id) || null;
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

  // Gets the values of a tensor spread in a 1D array
  getValues(tensor) {
    return tensor.dataSync();
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

    // TODO: Patrick, commit this to master!!!
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

      this.observer.broadcast(TENSOR_REMOVED, { id, tensors: this.tensors });

      // Return the list of tensors in a Promise so the user knows it was removed
      return Promise.resolve(this.tensors);
    }

    return Promise.reject({ error: 'We cannot find a tensor with that id' });
  }

  // Runs any TensorFlow operation over two given tensors
  runOperation(func, tensors) {
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

        this.sendMessage({
          result,
          tensors: [firstTensor, secondTensor]
        });

        this.observer.broadcast(RAN_OPERATION, { func, result });

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
    this.observer.subscribe(RAN_OPERATION, func);
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

  // Sends a socket message back to the server
  sendMessage(data) {
    // If we're capable of sending a message
    if (this.socket.readyState === 1) {
      // Construct the message
      const message = {
        type: 'result',
        ...data
      };

      this.logger.log(`Sending message to "${this.socket.url}"`, message);

      // Send it via JSON
      this.socket.send(JSON.stringify(message));

      this.observer.broadcast(MESSAGE_SENT, { message });

      return Promise.resolve(message);
    }

    return Promise.reject({ error: 'Cannot connect to server' });
  }

  // Starts syft.js
  start(url) {
    this.logger.log('Starting up...');

    if (url) {
      this.socket = this.createSocketConnection(url);
    }

    // Listen for incoming messages and dispatch them appropriately
    this.socket.onmessage = event => {
      event = JSON.parse(event);

      this.logger.log(`Received a message of type "${event.type}"`, event);

      if (event.type === 'tensor') {
        // We have a new tensor, store it...
        this.addTensor(event.id, event.values);
      } else if (event.type === 'operation') {
        // We have a request to perform an operation, run it...
        this.runOperation(event.func, event.tensors);
      }

      this.observer.broadcast(MESSAGE_RECEIVED, { event });
    };
  }

  // Stops syft.js
  stop() {
    this.logger.log('Shutting down...');

    // Kill the socket connection
    this.socket.close();

    // Destroy record of the tensors and socket connection
    this.tensors = [];
    this.socket = null;
  }
}
