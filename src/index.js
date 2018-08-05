import * as tf from '@tensorflow/tfjs';

import { createConnection } from './connection';

export default class Syft {
  constructor(url) {
    // Where all tensors are stored locally
    this.tensors = [];

    // A saved instance of the socket connection
    this.socket = createConnection(url);
  }

  // Gets a list of all stored tensors
  getTensors() {
    return this.tensors;
  }

  // Gets a tensor by a given id (accepts a string or object)
  getTensorById(value) {
    const id = typeof value === 'string' ? value : value.id;

    return this.tensors.find(x => x.id === id) || {};
  }

  // Adds a tensor to the list of stored tensors
  addTensor(id, tensor) {
    let createdTensor = {
      id,
      tensor: tf.tensor(tensor)
    };

    this.tensors.push(createdTensor);

    return createdTensor;
  }

  // NOTE: This is meant to be replaced... purely for demo purposes
  sampleOperation(type, a, b) {
    let foundA = this.getTensorById(a).tensor,
      foundB = this.getTensorById(b).tensor;

    if (foundA && foundB) {
      if (type === 'add') {
        return foundA.add(foundB);
      }
    }

    return null;
  }

  // Starts syft.js
  start() {
    console.log('STARTING SYFT');

    // Listen for incoming messages and dispatch them appropriately
    this.socket.onmessage = event => {
      // TODO: Either save a tensor to the list or execute a command
      console.log('NEW EVENT', event);
    };
  }
}
