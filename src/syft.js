import {
  GET_PROTOCOL,
  SOCKET_STATUS,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_JOIN_ROOM,
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_LEFT,
  WEBRTC_PEER_OPTIONS
} from './_constants';

import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import WebRTCClient from './webrtc';
import { protobuf, unserialize } from './protobuf';
import GridAPIClient from './grid-api-client';
import Job from './job';

export default class Syft {
  /* ----- CONSTRUCTOR ----- */
  constructor({ url, verbose, authToken, peerConfig }) {
    // For creating verbose logging should the worker desire
    this.logger = new Logger('syft.js', verbose);

    this.gridClient = new GridAPIClient({ url });

    // objects registry
    this.objects = {};

    // For creating event listeners
    this.observer = new EventObserver();

    // Forcing connection to be secure if verbose value is false.
    this.verbose = verbose;

    this.worker_id = null;
    this.peerConfig = peerConfig;
    this.authToken = authToken;
  }

  async newJob({ modelName, modelVersion }) {
    if (!this.worker_id) {
      // authenticate
      const authResponse = await this.gridClient.authenticate(this.authToken);
      this.worker_id = authResponse.worker_id;
    }

    return new Job({
      worker: this,
      modelName,
      modelVersion,
      gridClient: this.gridClient
    });
  }

  /* ----- SOCKET COMMUNICATION ----- */
  // TODO refactor into grid client class

  // To create a socket connection internally and externally
  createSocketConnection(url) {
    if (!url) return;
    if (!this.verbose) {
      url = url.replace('ws://', 'wss://');
    }
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
        this.workerId = data.worker.workerId;
        this.socket.workerId = this.workerId;

        // Save our scopeId if we don't already have it
        this.scopeId = data.worker.scopeId;

        // Save our role
        this.role = data.worker.role;

        // Save the other participant workerId's
        this.participants = data.participants;

        // Save the protocol and plan assignment after having Serde detail them
        let detailedProtocol;
        let detailedPlan;
        detailedProtocol = unserialize(
          null,
          data.protocol,
          protobuf.syft_proto.execution.v1.Protocol
        );
        detailedPlan = unserialize(
          null,
          data.plan,
          protobuf.syft_proto.execution.v1.Plan
        );

        this.protocol = detailedProtocol;
        this.plan = detailedPlan;

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
      socket: this.socket
    });

    const onDataMessage = data => {
      this.logger.log(`Data message is received from ${data.worker_id}`, data);
    };
    this.rtc.on('message', onDataMessage);
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
