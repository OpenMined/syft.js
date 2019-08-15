// TODO: Figure out a way to share the contstants file with grid.js

// import * as tf from '@tensorflow/tfjs';

import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import WebRTCClient from './webrtc';
import { detail } from './serde';

import {
  SOCKET_STATUS,
  GET_PROTOCOL,
  GET_PLANS,
  CREATE_SCOPE,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_NEW_PEER
} from './_constants';

const uuid = require('uuid/v4');

export default class syft {
  /* ----- CONSTRUCTOR ----- */
  constructor(opts = {}) {
    const { url, verbose, instanceId, scope, peerConfig } = opts;

    // The chosen protocol syft.js will be working on (only for scope creators)
    this.currentProtocol = null;

    // The participants we will be working with (only for scope creators)
    this.participants = [];

    // The list of plans we will be executing
    this.plans = [];

    // The assigned scope ID (if passed, we're a participant)
    this.scopeId = scope || null;

    // My instance ID (if passed, we're a participant)
    this.instanceId = instanceId || uuid();

    // For creating event listeners
    this.observer = new EventObserver();

    // For creating verbose logging should the user desire
    this.logger = new Logger(verbose);

    // Create a socket connection at this.socket
    this.socket = null;
    this.createSocketConnection(url);

    // The WebRTC client used for P2P communication
    this.rtc = null;
    this.createWebRTCClient(peerConfig);
  }

  /* ----- FUNCTIONALITY ----- */

  // Get all the protocols from grid.js and return them to the user
  getProtocol(protocolId) {
    return this.socket.send(GET_PROTOCOL, { protocolId });
  }

  // Get the list of plans that a participant needs to participate from grid.js
  getPlans() {
    return this.socket.send(GET_PLANS, {
      scopeId: this.scopeId
    });
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
    this.socket.close();
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

      // Save the current protocol
      this.currentProtocol = protocol;

      return protocol;
    } else if (type === GET_PLANS) {
      // If we're getting returned a list of plans, we need to parse all of them
      const plans = data.plans.map(plan => detail(plan));

      // Save those plans
      this.plans = plans;

      return plans;
    } else if (type === CREATE_SCOPE) {
      // If we're getting a created scope store the scopeId
      this.scopeId = data.scopeId;

      // Save the plans that the creator must do
      this.plans = this.currentProtocol.plans[data.plan];

      return data;
    } else if (type === WEBRTC_INTERNAL_MESSAGE) {
      this.rtc.receiveInternalMessage(data);
    } else if (type === WEBRTC_NEW_PEER) {
      this.rtc.receiveNewPeer(data);
    }
  }

  /* ----- WEBRTC ----- */

  // To create a socket connection internally and externally
  createWebRTCClient(peerConfig, peerOptions) {
    // If we don't have a socket sever, we can't create the WebRTCClient
    if (!this.socket) return;

    // The default STUN/TURN servers to use for NAT traversal
    if (!peerConfig) {
      peerConfig = {
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun3.l.google.com:19302',
              'stun:stun4.l.google.com:19302'
            ]
          }
        ]
      };
    }

    // TODO: We should determine which of these are reall required
    // Some standard options for establishing peer connections
    if (!peerOptions) {
      peerOptions = {
        optional: [
          { DtlsSrtpKeyAgreement: true }, // Required for connection between Chrome and Firefox
          { RtpDataChannels: true } // Required in Firefox to use the DataChannels API
        ]
      };
    }

    this.rtc = new WebRTCClient({
      peerConfig,
      peerOptions,
      logger: this.logger,
      socket: this.socket
    });
  }

  connectToParticipants() {
    this.rtc.start(this.instanceId, this.scopeId);
  }

  sendToParticipants(data) {
    this.rtc.sendMessage(data);
  }
}
