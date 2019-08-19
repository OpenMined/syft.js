/*
  TODO:
   - Figure out Redis on grid.js
   - Figure out a way to share the constants file with grid.js
*/

// import * as tf from '@tensorflow/tfjs';

import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import WebRTCClient from './webrtc';
import { detail } from './serde';

import {
  SOCKET_STATUS,
  GET_PLANS,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_NEW_PEER,
  WEBRTC_PEER_LEFT
} from './_constants';

export default class syft {
  /* ----- CONSTRUCTOR ----- */
  constructor(opts = {}) {
    const { url, verbose, instanceId, scopeId, protocolId, peerConfig } = opts;

    // My instance ID
    this.instanceId = instanceId || null;

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
    this.logger = new Logger(verbose);

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
      instanceId: this.instanceId,
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

      // Save those plans after having Serde detail them
      this.plans = data.plans.map(plan => detail(plan));

      // Save our instanceId if we don't already have it (also for the socket connection)
      this.instanceId = data.user.instanceId;
      this.socket.instanceId = this.instanceId;

      // Save our scopeId if we don't already have it
      this.scopeId = data.user.scopeId;

      // Save our role
      this.role = data.user.role;

      // Save the other participant instanceId's
      this.participants = data.participants;

      return this.plans;
    } else if (type === WEBRTC_INTERNAL_MESSAGE) {
      this.rtc.receiveInternalMessage(data);
    } else if (type === WEBRTC_NEW_PEER) {
      this.rtc.receiveNewPeer(data);
    } else if (type === WEBRTC_PEER_LEFT) {
      this.rtc.removePeer(data.instanceId);
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

  disconnectFromParticipants() {
    this.rtc.stop();
  }

  sendToParticipants(data, to) {
    this.rtc.sendMessage(data, to);
  }
}
