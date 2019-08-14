/*
TODOS:
 - Change all socket message types to be prefixed constants (index.js, webrtc.js, and grid.js)
 - Do then/catch (with logging) on all promise methods:
   - addIceCandidate
   - createAnswer
   - createOffer
   - setLocalDescription
   - setRemoteDescription
 - Maybe switch to async/await
 - Go through all TODO's in this file
 - Correct existing comments and write better documentation
 - Figure out "disconnected" in socket server
 - Ensure that starting and stopping of both the WebRTCClient and WebSocketClient are working and timed appropriately
 - TEST IT ALL OUT
*/

// TODO: Make sure this is working!
import 'webrtc-adapter';

export default class WebRTCClient {
  constructor(opts) {
    const { peerConfig, logger, socket } = opts;

    // TODO: Set this?
    const options = {
      optional: [
        { DtlsSrtpKeyAgreement: true }, // Required for connection between Chrome and Firefox
        { RtpDataChannels: true } // Required in Firefox to use the DataChannels API
      ]
    };

    this.peerConfig = peerConfig;
    this.peerOptions = options;
    this.logger = logger;
    this.socket = socket;

    this.peers = {};

    this.instanceId = null;
    this.scopeId = null;
  }

  start(instanceId, scopeId) {
    this.instanceId = instanceId;
    this.scopeId = scopeId;

    this.logger.log(`WebRTC: Joining room ${scopeId}`);

    // Immediately send a request to enter the room
    this.socket.send('room', { instanceId, scopeId });
  }

  // TODO: Remember to stop (clear all peer connections) when we're done
  stop() {
    this.logger.log('WebRTC: Disconnecting from peers');

    for (let peer in this.peers) {
      if (this.peers.hasOwnProperty(peer)) {
        if (this.peers[peer].channel !== undefined) {
          try {
            this.peers[peer].channel.close();
          } catch (e) {}
        }
      }
    }
  }

  // Helper function for sending address messages related to WebRTC
  sendViaSocket(type, message, to) {
    // Don't send to yourself, silly!
    if (this.instanceId !== to) {
      this.logger.log('WebRTC: Sending internal WebRTC message');

      this.socket.send('webrtc', {
        instanceId: this.instanceId,
        scopeId: this.scopeId,
        to,
        type,
        data: message
      });
    }
  }

  socketNewPeer({ instanceId }) {
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
          this.logger.log('WebRTC: Setting offer as local description');

          pc.setLocalDescription(offer);
        }
      })
      .catch(this.handleError('WebRTC: Error creating offer'));
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
        this.sendViaSocket(sdpType, pc.localDescription, instanceId);

        // ... and then all previously found ICE candidates
        for (let i = 0; i < this.peers[instanceId].candidateCache.length; i++) {
          this.sendViaSocket(
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

  socketReceived({ type, instanceId, data }) {
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

  remoteOfferReceived(instanceId, data) {
    this.createConnection(instanceId);

    const pc = this.peers[instanceId].connection;

    pc.setRemoteDescription(new RTCSessionDescription(data))
      .then(() => {
        this.logger.log('WebRTC: Setting data as remote description');

        pc.createAnswer()
          .then(answer => {
            this.logger.log('WebRTC: Answer created');

            pc.setLocalDescription(answer);

            this.logger.log('WebRTC: Setting answer as local description');
          })
          .catch(this.handleError('WebRTC: Error creating answer'));
      })
      .catch(this.handleError('WebRTC: Error setting remote description'));
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

  remoteAnswerReceived(instanceId, data) {
    const pc = this.peers[instanceId].connection;

    this.logger.log('WebRTC: Remote answer received');

    pc.setRemoteDescription(new RTCSessionDescription(data));
  }

  remoteCandidateReceived(instanceId, data) {
    this.createConnection(instanceId);

    this.logger.log('WebRTC: Remote candidate received');

    const pc = this.peers[instanceId].connection;

    pc.addIceCandidate(new RTCIceCandidate(data));
  }

  sendMessage(message) {
    this.logger.log('WebRTC: Sending message', message);

    for (let peer in this.peers) {
      if (this.peers.hasOwnProperty(peer)) {
        if (this.peers[peer].channel !== undefined) {
          this.peers[peer].channel.send(message);
        }
      }
    }
  }

  // This is used to attach generic logging handlers for data channels.
  addDataChannelListeners(channel) {
    console.log('SETTING UP LISTENERS', channel);

    channel.onclose = event => {
      this.logger.log('WebRTC: data channel close', event);
    };

    channel.onerror = err => {
      this.logger.log('WebRTC: data channel error', err);
    };

    channel.onmessage = event => {
      this.logger.log('WebRTC: data channel message', event);
    };

    channel.onopen = event => {
      this.logger.log('WebRTC: data channel open', event);
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
