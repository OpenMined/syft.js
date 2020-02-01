import {
  GET_PROTOCOL,
  SOCKET_STATUS,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_JOIN_ROOM,
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_LEFT,
  WEBRTC_PEER_OPTIONS
} from './_constants';
import { NOT_ENOUGH_ARGS, NO_PLAN, PLAN_ALREADY_COMPLETED } from './_errors';

import EventObserver from './events';
import Logger from './logger';
import Socket from './sockets';
import WebRTCClient from './webrtc';
import { detail } from './serde';
import { unserialize } from './protobuf';
import { protobuf } from './proto';
import { pickTensors } from './_helpers';

export default class Syft {
  /* ----- CONSTRUCTOR ----- */
  constructor({ url, verbose, workerId, scopeId, protocolId, peerConfig }) {
    // My worker ID
    this.workerId = workerId || null;

    // The assigned scope ID
    this.scopeId = scopeId || null;

    // The chosen protocol we are working on
    this.protocolId = protocolId || null;

    // Our role in the protocol
    this.role = null;

    // The participants we will be working with (only for scope creators)
    this.participants = [];

    // The protocol we will are participating in
    this.protocol = null;

    // The plan we have been assigned
    this.plan = null;

    // The index of the last plan operation we weren't able to complete (this defaults to 0 until we've started to execute)
    this.lastUnfinishedOperation = 0;

    // All the tensors we've either computed ourselves or captured from Grid or other peers
    this.objects = {};

    // For creating event listeners
    this.observer = new EventObserver();

    // For creating verbose logging should the worker desire
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
    if (!protocol && !this.protocolId) return null;
    if (protocol && !this.protocolId) this.protocolId = protocol;

    return this.socket.send(GET_PROTOCOL, {
      scopeId: this.scopeId,
      protocolId: this.protocolId
    });
  }

  // Execute the current plan given data the worker passes
  executePlan(...data) {
    return new Promise((resolve, reject) => {
      // If we don't have a plan yet, calling this function is premature
      if (!this.plan) throw new Error(NO_PLAN);

      const argsLength = this.plan.procedure.argIds.length,
        opsLength = this.plan.procedure.operations.length;

      // If the number of arguments supplied does not match the number of arguments required...
      if (data.length !== argsLength)
        throw new Error(NOT_ENOUGH_ARGS(data.length, argsLength));

      // If we have already completed the plan, there's no need to execute
      if (this.lastUnfinishedOperation === opsLength)
        throw new Error(PLAN_ALREADY_COMPLETED(this.plan.name, this.plan.id));

      // For each argument supplied, store them in this.objects
      data.forEach((datum, i) => {
        this.objects[this.plan.procedure.argIds[i]] = datum;
      });

      let finished = true;

      // Execute the plan
      for (let i = this.lastUnfinishedOperation; i < opsLength; i++) {
        // The current operation
        const currentOp = this.plan.procedure.operations[i];

        // The result of the current operation
        const result = currentOp.execute(this.objects, this.logger);

        // Place the result of the current operation into this.objects at the 0th item in returnIds
        if (result) {
          this.objects[currentOp.returnIds[0]] = result;
        } else {
          finished = false;
          this.lastUnfinishedOperation = i;

          break;
        }
      }

      if (finished) {
        // Set the lastUnfinishedOperation as the number of operations (meaning, we've already executed the plan successfully)
        this.lastUnfinishedOperation = opsLength;

        // Resolve all of the requested resultId's as specific by the plan
        const resolvedResultingTensors = [];

        this.plan.procedure.resultIds.forEach(resultId => {
          resolvedResultingTensors.push({
            id: resultId,
            value: this.objects[resultId]
          });
        });

        // Return them to the worker
        resolve(resolvedResultingTensors);
      } else {
        // If the plan wasn't finished, notify the worker that they may try again once they have the appropriate information
        reject(
          'There is not enough information to execute this plan, but we have saved your progress!'
        );
      }
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
        try {
          detailedProtocol = detail(data.protocol);
          detailedPlan = detail(data.plan);
        } catch (e) {
          // fallback to protobuf
          detailedProtocol = unserialize(
            null,
            data.protocol,
            protobuf.syft_proto.messaging.v1.Protocol
          );
          detailedPlan = unserialize(
            null,
            data.plan,
            protobuf.syft_proto.messaging.v1.ObjectMessage
          );
        }

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
