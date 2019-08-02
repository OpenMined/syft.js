import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import { simplify, detail } from './serde';

import {
  SOCKET_STATUS,
  SOCKET_MESSAGE_RECEIVED,
  SOCKET_MESSAGE_SENT,
  GET_TENSORS,
  GET_TENSOR,
  RUN_OPERATION,
  TENSOR_ADDED,
  TENSOR_REMOVED
} from './_constants';

import * as tf from '@tensorflow/tfjs';

export default class syft {
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
    this.socket = new Socket({
      url,
      logger: this.logger,
      onMessage: event => this.onSocketMessage(event),
      onOpen: event => this.onOpen(event),
      onClose: event => this.onClose(event)
    }).socket;
  }

  /* ----- SERDE ----- */

  simplify(data) {
    return simplify(data);
  }

  detail(data) {
    return detail(data);
  }

  // /* ----- HELPERS ----- */

  // // Gets a list of all stored tensors
  // getTensors() {
  //   const tensors = this.tensors;

  //   this.sendMessage(GET_TENSORS, tensors);

  //   return tensors;
  // }

  // // Gets a tensor by a given id
  // getTensorById(id) {
  //   const tensor = this.tensors.find(x => x.id === id) || null;

  //   this.sendMessage(GET_TENSOR, tensor);

  //   return tensor;
  // }

  // // Gets the index of the tensor (found by id) in the stored tensor list
  // getTensorIndex(passedId) {
  //   let returnedIndex = null;

  //   // Look through all tensors and find the index if it exists
  //   this.tensors.forEach(({ id }, index) => {
  //     if (id === passedId) {
  //       returnedIndex = index;
  //     }
  //   });

  //   return returnedIndex;
  // }

  // /* ----- FUNCTIONALITY ----- */

  // // Adds a tensor to the list of stored tensors
  // addTensor(id, tensor) {
  //   this.logger.log(`Adding tensor "${id}", with value:`, tensor);

  //   // Create a tensor in TensorFlow
  //   let createdTensor = {
  //     id,
  //     tensor: tf.tensor(tensor)
  //   };

  //   // Push it onto the stack
  //   this.tensors.push(createdTensor);

  //   this.sendMessage(TENSOR_ADDED, createdTensor);

  //   this.observer.broadcast(TENSOR_ADDED, {
  //     id,
  //     tensor: createdTensor.tensor,
  //     tensors: this.tensors
  //   });

  //   // Return the list of tensors in a Promise so the user knows it was added
  //   return Promise.resolve(this.tensors);
  // }

  // // Removes a tensor from the list of stored tensors
  // removeTensor(id) {
  //   this.logger.log(`Removing tensor "${id}"`);

  //   // Find the index of the tensor
  //   const index = this.getTensorIndex(id);

  //   // Remove it if we found it
  //   if (index !== null) {
  //     this.tensors.splice(index, 1);

  //     this.sendMessage(TENSOR_REMOVED, id);

  //     this.observer.broadcast(TENSOR_REMOVED, {
  //       id,
  //       tensors: this.tensors
  //     });

  //     // Return the list of tensors in a Promise so the user knows it was removed
  //     return Promise.resolve(this.tensors);
  //   }

  //   return Promise.reject({
  //     error: 'We cannot find a tensor with that id'
  //   });
  // }

  // // Runs any TensorFlow operation over two given tensors
  // runOperation(func, tensors, result_id = null) {
  //   this.logger.log(
  //     `Running operation "${func}" on "${tensors[0]}" and "${tensors[1]}"`
  //   );

  //   // Find our tensors in the stored tensors list
  //   const firstTensor = this.getTensorById(tensors[0]);
  //   const secondTensor = this.getTensorById(tensors[1]);

  //   // Did we find both tensors?
  //   if (firstTensor && secondTensor) {
  //     // Does the first tensor have this function?
  //     if (typeof firstTensor.tensor[func] === 'function') {
  //       // We're all good - run the command
  //       const result = firstTensor.tensor[func](secondTensor.tensor);

  //       this.sendMessage(RUN_OPERATION, {
  //         result,
  //         result_id,
  //         tensors: [firstTensor, secondTensor]
  //       });

  //       this.observer.broadcast(RUN_OPERATION, {
  //         func,
  //         result,
  //         result_id
  //       });

  //       return Promise.resolve(result);
  //     }

  //     return Promise.reject({
  //       error: 'Function not found in TensorFlow'
  //     });
  //   }

  //   return Promise.reject({ error: 'Cannot find tensors' });
  // }

  // /* ----- EVENT HANDLERS ----- */

  onSocketStatus(func) {
    this.observer.subscribe(SOCKET_STATUS, func);
  }

  onMessageReceived(func) {
    this.observer.subscribe(SOCKET_MESSAGE_RECEIVED, func);
  }

  onMessageSent(func) {
    this.observer.subscribe(SOCKET_MESSAGE_SENT, func);
  }

  // onRunOperation(func) {
  //   this.observer.subscribe(RUN_OPERATION, func);
  // }

  // onTensorAdded(func) {
  //   this.observer.subscribe(TENSOR_ADDED, func);
  // }

  // onTensorRemoved(func) {
  //   this.observer.subscribe(TENSOR_REMOVED, func);
  // }

  /* ----- SOCKET COMMUNICATION ----- */

  // When the socket connection is opened
  // This is the internal event listener, the external method to subscribe to is "onSocketStatus => ({ connected: true })"
  onOpen(event) {
    this.observer.broadcast(SOCKET_STATUS, {
      connected: true,
      event
    });
  }

  // When the socket connection is closed
  // This is the internal event listener, the external method to subscribe to is "onSocketStatus => ({ connected: false })"
  onClose(event) {
    this.observer.broadcast(SOCKET_STATUS, {
      connected: false,
      event
    });
  }

  // When we receive a message from the server
  // This is the internal event listener, the external method to subscribe to is "onMessageReceived => (event)"
  onSocketMessage(event) {
    this.observer.broadcast(SOCKET_MESSAGE_RECEIVED, event);

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
  }

  // Sends a socket message to the server
  // This fires the external event listener method "onMessageSent => (event)"
  sendMessage(type, data) {
    // Construct the message
    const message = { type, data };

    this.logger.log('Sending message', message);

    // Send it via JSON
    this.socket.send(JSON.stringify(message));

    this.observer.broadcast(SOCKET_MESSAGE_SENT, message);

    return Promise.resolve(message);
  }
}
