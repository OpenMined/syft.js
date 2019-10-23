// import * as tf from '@tensorflow/tfjs';

import {
  SOCKET_STATUS,
  GET_PROTOCOL,
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
import { pickTensors } from './_helpers';

export default class Syft {
  /* ----- CONSTRUCTOR ----- */
  constructor({ url, verbose, workerId, scopeId, protocolId, peerConfig }) {
    // My worker ID
    this.workerId = workerId || null;

    // The assigned scope ID
    this.scopeId = scopeId || null;

    // The chosen protocol we are working on
    this.protocolId = protocolId;

    // Our role in the protocol
    this.role = null;

    // The participants we will be working with (only for scope creators)
    this.participants = [];

    // The protocol we will are participating in
    this.protocol = null;

    // The plan we have been assigned
    this.plan = null;

    // All the tensors we've either computed ourselves or captured from Grid or other peers
    this.objects = {};

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

  // Get the protocol and plan assignment from the Grid
  getProtocol(protocol) {
    this.protocolId = protocol;

    return this.socket.send(GET_PROTOCOL, {
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

    // When a socket connection is opened...
    const onOpen = event => {
      this.observer.broadcast(SOCKET_STATUS, {
        connected: true,
        event
      });
    };

    // When a socket connection is closed...
    const onClose = event => {
      this.observer.broadcast(SOCKET_STATUS, {
        connected: false,
        event
      });
    };

    // When a socket message is received...
    const onMessage = event => {
      const { type, data } = event;

      if (type === GET_PROTOCOL) {
        if (data.error) {
          this.logger.log(
            'There was an error getting the protocol you requested',
            data.error
          );

          return data;
        }

        // Save our workerId if we don't already have it (also for the socket connection)
        this.workerId = data.user.workerId;
        this.socket.workerId = this.workerId;

        // Save our scopeId if we don't already have it
        this.scopeId = data.user.scopeId;

        // Save our role
        this.role = data.user.role;

        // Save the other participant workerId's
        this.participants = data.participants;

        // Save the protocol and plan assignment after having Serde detail them
        const detailedProtocol = detail(data.protocol);
        const detailedPlan = detail(data.plan);

        this.protocol = detailedProtocol;
        this.plan = detailedPlan;

        // Pick all the tensors from the plan we just received
        this.objects = { ...this.objects, ...pickTensors(detailedPlan) };

        return this.plan;
      } else if (type === WEBRTC_INTERNAL_MESSAGE) {
        this.rtc.receiveInternalMessage(data);
      } else if (type === WEBRTC_JOIN_ROOM) {
        this.rtc.receiveNewPeer(data);
      } else if (type === WEBRTC_PEER_LEFT) {
        this.rtc.removePeer(data.workerId);
      }
    };

    this.socket = new Socket({
      url,
      logger: this.logger,
      workerId: this.workerId,
      onOpen,
      onClose,
      onMessage
    });
  }

  // To close the socket connection with the grid
  disconnectFromGrid() {
    this.socket.stop();
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
