import * as tf from '@tensorflow/tfjs';

export default class Syft {
  constructor(url, verbose = false) {
    // Where all tensors are stored locally
    this.tensors = [];

    // A saved instance of the socket connection
    this.socket = new WebSocket(url);

    // Set verbose logging
    this.verbose = verbose;
  }

  // A simple logging function
  log(message, data) {
    // Only log if verbose is turned on
    if (this.verbose) {
      const output = `${Date.now()}: Syft.js - ${message}`;

      // Have the passed additional data?
      if (data) {
        console.log(output, data);
      } else {
        console.log(output);
      }
    }
  }

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

  // Adds a tensor to the list of stored tensors
  addTensor(id, tensor) {
    this.log(`Adding tensor "${id}", with value:`, tensor);

    // Create a tensor in TensorFlow
    let createdTensor = {
      id,
      tensor: tf.tensor(tensor)
    };

    // Push it onto the stack
    this.tensors.push(createdTensor);

    // Return the created tensor to the user so they know it was added
    return createdTensor;
  }

  // Removes a tensor from the list of stored tensors
  removeTensor(id) {
    this.log(`Removing tensor "${id}"`);

    // Find the index of the tensor
    const index = this.getTensorIndex(id);

    // Remove it if we found it
    if (index !== null) {
      this.tensors.splice(index, 1);
    } else {
      throw new Error('We cannot find a tensor with that id');
    }

    // Return the list of stored tensors so the user knows it was removed
    return this.tensors;
  }

  // Runs any TensorFlow operation over two given tensors
  runOperation(func, tensors) {
    this.log(
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
        return firstTensor.tensor[func](secondTensor.tensor);
      }

      throw new Error('Function not found in TensorFlow');
    }

    throw new Error('Cannot find tensors');
  }

  // Starts syft.js
  start() {
    this.log('Starting up...');

    // Listen for incoming messages and dispatch them appropriately
    this.socket.onmessage = event => {
      this.log(`Received a message of type "${event.type}"`, event);

      if (event.type === 'tensor') {
        // We have a new tensor, store it...
        this.addTensor(event.id, event.values);
      } else if (event.type === 'operation') {
        // We have a request to perform an operation, run it...
        this.runOperation(event.func, event.tensors);
      }
    };
  }

  // Stops syft.js
  stop() {
    this.log('Shutting down...');

    // Kill the socket connection
    this.socket.close();

    // Destroy record of the tensors and socket connection
    this.tensors = [];
    this.socket = null;
  }
}
