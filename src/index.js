// import * as tf from '@tensorflow/tfjs';

import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import { detail } from './serde';

import { SOCKET_STATUS, GET_PROTOCOL, CREATE_SCOPE } from './_constants';

const uuid = require('uuid/v4');

export default class syft {
  /* ----- CONSTRUCTOR ----- */
  constructor(opts = {}) {
    const { url, verbose, instanceId, scope } = opts;

    // The chosen protocol syft.js will be working on
    this.currentProtocol = null;

    // The assigned scope ID
    this.scopeId = scope || null;

    // My instance ID
    this.instanceId = instanceId || uuid();

    // The participants we will be training with
    this.participants = [];

    // For creating event listeners
    this.observer = new EventObserver();

    // For creating verbose logging should the user desire
    this.logger = new Logger(verbose);

    // Create a socket connection at this.socket
    this.createSocketConnection(url);
  }

  /* ----- FUNCTIONALITY ----- */

  // Get all the protocols from grid.js and return them to the user
  getProtocol(protocolId) {
    return this.socket.send(GET_PROTOCOL, { protocolId });
  }

  // Create a scope with grid.js, passing the instance IDs of the other participants an the ID of the protocol
  createScope() {
    const protocol = this.currentProtocol;

    // Create instance IDs for the other participants in the protocol
    // Note that if you're the creator, you already have an instance ID (this.instanceId)
    this.participants = [...Array(protocol.plans.length - 1)].map(() => uuid());

    return this.socket.send(CREATE_SCOPE, {
      protocolId: protocol.id,
      participants: this.participants
    });
  }

  /* ----- EVENT HANDLERS ----- */

  onSocketStatus(func) {
    this.observer.subscribe(SOCKET_STATUS, func);
  }

  /* ----- SOCKET COMMUNICATION ----- */

  // To create a socket connection internally and externally
  createSocketConnection(url) {
    if (!url) return;

    this.socket = new Socket({
      url,
      logger: this.logger,
      instanceId: this.instanceId,
      onOpen: event => this.onOpen(event),
      onClose: event => this.onClose(event),
      onMessage: event => this.onMessage(event)
    });
  }

  // To close the socket connection with the grid
  disconnectFromGrid() {
    this.socket.socket.close();
  }

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

  // When a socket message is received, parse the message, store it, and return it
  onMessage(event) {
    const { type, data } = event;

    if (type === GET_PROTOCOL) {
      // If we're getting returned a protocol, we need to parse all the plans
      const protocol = data.protocol
        ? {
            ...data.protocol,
            plans: data.protocol.plans.map(list =>
              list.map(plan => detail(plan))
            )
          }
        : data.protocol;

      this.currentProtocol = protocol;
      return protocol;
    } else if (type === CREATE_SCOPE) {
      // If we're getting a created scope, store the ID and return all the data
      this.scopeId = data.scopeId;
      return data;
    }
  }
}
