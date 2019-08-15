/*
TODOS:
 - Maybe switch to async/await
 - Correct existing comments and write better documentation
 - Go through all TODO's in this file
 - Figure out "disconnected" in socket server
 - Ensure that starting and stopping of both the WebRTCClient and WebSocketClient are working and timed appropriately
 - TEST IT ALL OUT (including making sure things work cross-browser)
*/

// TODO: Make sure this is working!
import 'webrtc-adapter';

import { WEBRTC_JOIN_ROOM, WEBRTC_INTERNAL_MESSAGE } from './_constants';

export default class WebRTCClient {
  constructor(opts) {
    const { peerConfig, peerOptions, logger, socket } = opts;

    this.peerConfig = peerConfig;
    this.peerOptions = peerOptions;
    this.logger = logger;
    this.socket = socket;

    this.peers = {};

    this.instanceId = null;
    this.scopeId = null;
  }

  start(instanceId, scopeId) {
    this.logger.log(`WebRTC: Joining room ${scopeId}`);

    this.instanceId = instanceId;
    this.scopeId = scopeId;

    // Immediately send a request to enter the room
    this.socket.send(WEBRTC_JOIN_ROOM, { instanceId, scopeId });
  }

  // TODO: Remember to stop (clear all peer connections) when we're done
  stop() {
    this.logger.log('WebRTC: Disconnecting from peers');

    for (let peer in this.peers) {
      if (this.peers.hasOwnProperty(peer)) {
        if (this.peers[peer].channel !== undefined) {
          try {
            this.peers[peer].channel.close();
          } catch (e) {
            this.logger.log('WebRTC: Error closing connection', e);
          }
        }
      }
    }
  }

  sendMessage(message) {
    this.logger.log('WebRTC: Sending message', message);

    for (let peer in this.peers) {
      if (this.peers.hasOwnProperty(peer)) {
        if (
          this.peers[peer].channel !== undefined &&
          peer !== this.instanceId
        ) {
          try {
            this.peers[peer].channel.send(message);
          } catch (e) {
            this.logger.log('WebRTC: Error sending message', e);
          }
        }
      }
    }
  }

  initConnection(pc, instanceId, sdpType) {
    this.logger.log('WebRTC: Initializing connection');

    pc.onicecandidate = event => {
      if (event.candidate) {
        this.logger.log('WebRTC: Saving new ICE candidate');

        // If a new ICE candidate is discovered, add it to the list for further sending
        this.peers[instanceId].candidateCache.push(event.candidate);
      } else {
        this.logger.log(`WebRTC: Sending ${sdpType} and stored ICE candidates`);

        // When the candidate discovery is completed, the handler will be called again, but without the candidate
        // In this case, we first send the first SDP offer or SDP answer (depending on the sdpType)...
        this.sendInternalMessage(sdpType, pc.localDescription, instanceId);

        // ... and then all previously found ICE candidates
        for (let i = 0; i < this.peers[instanceId].candidateCache.length; i++) {
          this.sendInternalMessage(
            'candidate',
            this.peers[instanceId].candidateCache[i],
            instanceId
          );
        }
      }
    };

    pc.oniceconnectionstatechange = event => {
      if (pc.iceConnectionState == 'disconnected') {
        delete this.peers[instanceId];
      }
    };
  }

  createConnection(instanceId) {
    if (this.peers[instanceId] === undefined) {
      this.logger.log('WebRTC: Creating connection');

      this.peers[instanceId] = {
        candidateCache: []
      };

      const pc = new RTCPeerConnection(this.peerConfig, this.peerOptions);

      this.initConnection(pc, instanceId, 'answer');
      this.peers[instanceId].connection = pc;

      pc.ondatachannel = e => {
        this.logger.log('WebRTC: Calling ondatachannel');

        this.peers[instanceId].channel = e.channel;
        this.peers[instanceId].channel.owner = instanceId;

        this.addDataChannelListeners(this.peers[instanceId].channel);
      };
    }
  }

  receiveNewPeer({ instanceId }) {
    this.logger.log('WebRTC: Adding new peer');

    this.peers[instanceId] = {
      candidateCache: []
    };

    // Create a new connection
    const pc = new RTCPeerConnection(this.peerConfig, this.peerOptions);

    // Initialize it
    this.initConnection(pc, instanceId, 'offer');

    // Save the peer in the peer list
    this.peers[instanceId].connection = pc;

    // TODO: Settings: https://www.html5rocks.com/en/tutorials/webrtc/datachannels/#just-show-me-the-action
    // Create a DataChannel through which messaging will take place
    const channel = pc.createDataChannel('dataChannel');

    channel.owner = instanceId;
    this.peers[instanceId].channel = channel;

    // Install channel event handlers
    this.addDataChannelListeners(channel);

    // Create an SDP offer
    pc.createOffer()
      .then(offer => {
        this.logger.log('WebRTC: Offer created');

        if (offer) {
          pc.setLocalDescription(offer)
            .then(this.logger.log('WebRTC: Set offer as local description'))
            .catch(
              this.handleError(
                'WebRTC: Error setting offer as local description'
              )
            );
        }
      })
      .catch(this.handleError('WebRTC: Error creating offer'));
  }

  // Helper function for sending address messages related to WebRTC
  sendInternalMessage(type, message, to) {
    // Don't send to yourself, silly!
    if (this.instanceId !== to) {
      this.logger.log('WebRTC: Sending internal WebRTC message');

      this.socket.send(WEBRTC_INTERNAL_MESSAGE, {
        instanceId: this.instanceId,
        scopeId: this.scopeId,
        to,
        type,
        data: message
      });
    }
  }

  receiveInternalMessage({ type, instanceId, data }) {
    switch (type) {
      case 'candidate':
        this.remoteCandidateReceived(instanceId, data);
        break;
      case 'offer':
        this.remoteOfferReceived(instanceId, data);
        break;
      case 'answer':
        this.remoteAnswerReceived(instanceId, data);
        break;
    }
  }

  remoteCandidateReceived(instanceId, data) {
    this.logger.log('WebRTC: Remote candidate received');

    this.createConnection(instanceId);

    const pc = this.peers[instanceId].connection;

    pc.addIceCandidate(new RTCIceCandidate(data))
      .then(this.logger.log('WebRTC: Adding ICE candidate to peer connection'))
      .catch(
        this.handleError(
          'WebRTC: Error adding ICE candidate to peer connection'
        )
      );
  }

  remoteOfferReceived(instanceId, data) {
    this.createConnection(instanceId);

    const pc = this.peers[instanceId].connection;

    pc.setRemoteDescription(new RTCSessionDescription(data))
      .then(() => {
        this.logger.log('WebRTC: Setting offer as remote description');

        pc.createAnswer()
          .then(answer => {
            this.logger.log('WebRTC: Answer created');

            pc.setLocalDescription(answer)
              .then(this.logger.log('WebRTC: Set answer as local description'))
              .catch(
                this.handleError(
                  'WebRTC: Error setting answer as local description'
                )
              );
          })
          .catch(this.handleError('WebRTC: Error creating answer'));
      })
      .catch(
        this.handleError('WebRTC: Error setting offer as remote description')
      );
  }

  remoteAnswerReceived(instanceId, data) {
    this.logger.log('WebRTC: Remote answer received');

    const pc = this.peers[instanceId].connection;

    pc.setRemoteDescription(new RTCSessionDescription(data))
      .then(this.logger.log('WebRTC: Setting answer as remote description'))
      .catch(
        this.handleError('WebRTC: Error setting answer as remote description')
      );
  }

  // This is used to attach generic logging handlers for data channels.
  addDataChannelListeners(channel) {
    channel.onclose = event => {
      this.logger.log('WebRTC: Data channel close', event);
    };

    channel.onerror = err => {
      this.logger.log('WebRTC: Data channel error', err);
    };

    channel.onmessage = event => {
      this.logger.log('WebRTC: Data channel message', event);
    };

    channel.onopen = event => {
      this.logger.log('WebRTC: Data channel open', event);
    };
  }

  // Generic error handler to just log a message.
  handleError(message) {
    const self = this;

    return error => {
      self.logger.log(message, error);
    };
  }
}
