// import * as tf from '@tensorflow/tfjs';

import {
  SOCKET_STATUS,
  GET_PLANS,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_JOIN_ROOM,
  WEBRTC_PEER_LEFT,
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_OPTIONS
} from './_constants';
import EventObserver from './events';
import Logger from './logger';
import { detail } from './serde';
import Socket from './sockets';
import WebRTCClient from './webrtc';

export default class Syft {
  /* ----- CONSTRUCTOR ----- */
  constructor({ url, verbose, workerId, scopeId, protocolId, peerConfig }) {
    // My worker ID
    this.workerId = workerId || null;

    // The assigned scope ID
    this.scopeId = scopeId || null;

    // The chosen protocol we are working on
    this.protocolId = protocolId;

    // Our role in the plans
    this.role = null;

    // The participants we will be working with (only for scope creators)
    this.participants = [];

    // The list of plans we will be executing
    this.plans = [];

    // For creating event listeners
    this.observer = new EventObserver();

    // For creating verbose logging should the user desire
    this.logger = new Logger('syft.js', verbose);

    // Create a socket connection at this.socket
    this.socket = null;
    this.createSocketConnection(url);

    // The WebRTC client used for P2P communication
    this.rtc = null;
    this.createWebRTCClient(peerConfig);
  }

  /* ----- FUNCTIONALITY ----- */

  // Get the list of plans that a participant needs to participate from grid.js
  getPlans() {
    return this.socket.send(GET_PLANS, {
      scopeId: this.scopeId,
      protocolId: this.protocolId
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
      workerId: this.workerId,
      onOpen: event => this.onOpen(event),
      onClose: event => this.onClose(event),
      onMessage: event => this.onMessage(event)
    });
  }

  // To close the socket connection with the grid
  disconnectFromGrid() {
    this.socket.stop();
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

    if (type === GET_PLANS) {
      if (data.error) {
        this.logger.log('There was an error getting your plans', data.error);

        return data;
      }

      // TODO: Need to replace all locationId params in PointerTensor with my workerId, consider storing the workerId as a prop on a class of Serde (rather than passing it as a function arg)
      // TODO: Need to put all TorchTensors and PointerTensors inside of this.objects
      // TODO: Need to convert all TorchTensors and PointerTensors to extend tf.tensor

      // New workflow: I could receive at ANY MOMENT a Plan, Protocol, or Operation...
      // 1. First I need to log in and "authenticate" myself with Grid
      // 2. Upon receiving a tensor, plan, or protocol - I will store them in this.objects, no matter what it is
      // 3. Upon receiving an Operation message, I execute what I'm told

      // Note: You can send and receive Plans and Operations via P2P or via the Grid

      // Save our workerId if we don't already have it (also for the socket connection)
      this.workerId = data.user.workerId;
      this.socket.workerId = this.workerId;

      // Save our scopeId if we don't already have it
      this.scopeId = data.user.scopeId;

      // Save our role
      this.role = data.user.role;

      // Save the other participant workerId's
      this.participants = data.participants;

      // Save those plans after having Serde detail them
      this.plans = data.plans.map(plan => detail(plan));

      return this.plans;
    } else if (type === WEBRTC_INTERNAL_MESSAGE) {
      this.rtc.receiveInternalMessage(data);
    } else if (type === WEBRTC_JOIN_ROOM) {
      this.rtc.receiveNewPeer(data);
    } else if (type === WEBRTC_PEER_LEFT) {
      this.rtc.removePeer(data.workerId);
    }
  }

  /* ----- WEBRTC ----- */

  // To create a socket connection internally and externally
  createWebRTCClient(peerConfig, peerOptions) {
    // If we don't have a socket sever, we can't create the WebRTCClient
    if (!this.socket) return;

    // The default STUN/TURN servers to use for NAT traversal
    if (!peerConfig) peerConfig = WEBRTC_PEER_CONFIG;

    // Some standard options for establishing peer connections
    if (!peerOptions) peerOptions = WEBRTC_PEER_OPTIONS;

    this.rtc = new WebRTCClient({
      peerConfig,
      peerOptions,
      logger: this.logger,
      socket: this.socket
    });
  }

  connectToParticipants() {
    this.rtc.start(this.workerId, this.scopeId);
  }

  disconnectFromParticipants() {
    this.rtc.stop();
  }

  sendToParticipants(data, to) {
    this.rtc.sendMessage(data, to);
  }
}
