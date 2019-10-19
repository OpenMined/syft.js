// NOTE: Adding async/await in this file requires regenerator-runtime/runtime which adds an unnecessary 2kb on the minified bundled - no thanks!
import { WEBRTC_JOIN_ROOM, WEBRTC_INTERNAL_MESSAGE } from './_constants';

export default class WebRTCClient {
  constructor({ peerConfig, peerOptions, logger, socket }) {
    this.peerConfig = peerConfig;
    this.peerOptions = peerOptions;
    this.logger = logger;
    this.socket = socket;

    this.peers = {};

    this.workerId = null;
    this.scopeId = null;
  }

  // The main start command for WebRTC
  // This will store your id (workerId) and room (scopeId) and immediately join that room
  start(workerId, scopeId) {
    this.logger.log(`WebRTC: Joining room ${scopeId}`);

    this.workerId = workerId;
    this.scopeId = scopeId;

    // Immediately send a request to enter the room
    this.socket.send(WEBRTC_JOIN_ROOM, { workerId, scopeId });
  }

  // The main stop command for WebRTC
  // This goes through all the peers and closes the connection from each one
  stop() {
    this.logger.log('WebRTC: Disconnecting from peers');

    this._forEachPeer((peer, workerId) => {
      if (peer.channel) {
        this.removePeer(workerId);
      }
    }, true);
  }

  // Remove a peer when the signaling server has notified us they've left or when stop() is run
  removePeer(workerId) {
    // If this peer doesn't exist, forget about it
    if (!this.peers[workerId]) return;

    this.logger.log(`WebRTC: Closing connection to ${workerId}`);

    try {
      this.peers[workerId].channel.close();
    } catch (e) {
      this.logger.log('WebRTC: Error removing peer', e);
    }

    delete this.peers[workerId];
  }

  // Given a message, this function allows you to "broadcast" a message to all peers
  // Alternatively, you may send a targeted message to one specific peer (specified by the "to" param)
  sendMessage(message, to) {
    this.logger.log('WebRTC: Sending message', message);

    const send = (channel, msg) => {
      try {
        channel.send(msg);
      } catch (e) {
        this.logger.log('WebRTC: Error sending message', e);
      }
    };

    // If "to" is specified, send to that users
    if (
      to &&
      to !== this.workerId &&
      this.peers[to] &&
      this.peers[to].channel
    ) {
      send(this.peers[to].channel, message);
    }

    // Otherwise, send to each user specified
    else {
      this._forEachPeer(peer => {
        if (peer.channel) {
          send(peer.channel, message);
        }
      });
    }
  }

  // Create an RTCPeerConnection on our end for each offer or answer we receive
  createConnection(workerId) {
    this.logger.log('WebRTC: Creating connection');

    // Create a new peer in the list with a blank candidate cache (to be populated by ICE candidates we receive)
    this.peers[workerId] = {
      candidateCache: []
    };

    // Create and initialize the new connection, then add that connection to the peers list
    const pc = new RTCPeerConnection(this.peerConfig, this.peerOptions);
    this.initConnection(pc, workerId, 'answer');
    this.peers[workerId].connection = pc;

    // When this peer connection receives a data channel
    pc.ondatachannel = e => {
      this.logger.log('WebRTC: Calling ondatachannel');

      this.peers[workerId].channel = e.channel;
      this.peers[workerId].channel.owner = workerId;

      // Set up all our event listeners for this channel so we can hook into them
      this.addDataChannelListeners(this.peers[workerId].channel);
    };
  }

  // Initialize a given RTCPeerConnection ("pc"), for a peer ("workerId"), with an sdpType of "offer" or "answer"
  initConnection(pc, workerId, sdpType) {
    this.logger.log('WebRTC: Initializing connection');

    // How an RTCPeerConnection handle new ICE candidates or offer/answer messages...
    pc.onicecandidate = event => {
      // If we have an ICE candidate to handle
      if (event.candidate) {
        this.logger.log('WebRTC: Saving new ICE candidate');

        // Save it to the list for further sending
        this.peers[workerId].candidateCache.push(event.candidate);
      }

      // When the candidate discovery is completed, the handler will be called again, but without the candidate
      else {
        this.logger.log(`WebRTC: Sending ${sdpType} and stored ICE candidates`);

        // In this case, we first send the first SDP offer or SDP answer (depending on the sdpType)...
        this.sendInternalMessage(sdpType, pc.localDescription, workerId);

        // ... then we send all stored ICE candidates
        for (let i = 0; i < this.peers[workerId].candidateCache.length; i++) {
          this.sendInternalMessage(
            'candidate',
            this.peers[workerId].candidateCache[i],
            workerId
          );
        }
      }
    };
  }

  // When we receive a new peer's workerId from grid.js...
  receiveNewPeer({ workerId }) {
    this.logger.log('WebRTC: Adding new peer');

    // Create a new peer in the list with a blank candidate cache (to be populated by ICE candidates we receive)
    this.peers[workerId] = {
      candidateCache: []
    };

    // Create and initialize the new connection, then add that connection to the peers list
    const pc = new RTCPeerConnection(this.peerConfig, this.peerOptions);
    this.initConnection(pc, workerId, 'offer');
    this.peers[workerId].connection = pc;

    // Create a data channel through which messaging will take place, we'll call it "dataChannel"
    // Designate who owns that channel and push it onto the peers list
    const channel = pc.createDataChannel('dataChannel');
    channel.owner = workerId;
    this.peers[workerId].channel = channel;

    // Set up all our event listeners for this channel so we can hook into them
    this.addDataChannelListeners(channel);

    // Create an SDP offer for the peer connection
    pc.createOffer()
      .then(offer => {
        this.logger.log('WebRTC: Offer created');

        // Set the offer as the local description
        pc.setLocalDescription(offer)
          .then(this.logger.log('WebRTC: Set offer as local description'))
          .catch(
            this._handleError(
              'WebRTC: Error setting offer as local description'
            )
          );
      })
      .catch(this._handleError('WebRTC: Error creating offer'));
  }

  // Send an internal WebRTC message (this will always be an ICE candidate or SDP message)
  sendInternalMessage(type, message, to) {
    // Don't send to yourself, silly!
    if (to !== this.workerId) {
      this.logger.log('WebRTC: Sending internal WebRTC message');

      this.socket.send(WEBRTC_INTERNAL_MESSAGE, {
        workerId: this.workerId,
        scopeId: this.scopeId,
        to,
        type,
        data: message
      });
    }
  }

  // Receive an internal WebRTC message (this will always be an ICE candidate or SDP message)
  receiveInternalMessage({ type, workerId, data }) {
    switch (type) {
      case 'candidate':
        this.remoteCandidateReceived(workerId, data);
        break;
      case 'offer':
        this.remoteOfferReceived(workerId, data);
        break;
      case 'answer':
        this.remoteAnswerReceived(workerId, data);
        break;
    }
  }

  // When that internal WebRTC message is an ICE candidate
  remoteCandidateReceived(workerId, data) {
    this.logger.log('WebRTC: Remote candidate received');

    // If the connection doesn't exist, create it first
    if (this.peers[workerId] === undefined) {
      this.createConnection(workerId);
    }

    // Get the peer connection of that user and add the ICE candidate to their list
    const pc = this.peers[workerId].connection;

    pc.addIceCandidate(new RTCIceCandidate(data))
      .then(this.logger.log('WebRTC: Adding ICE candidate to peer connection'))
      .catch(
        this._handleError(
          'WebRTC: Error adding ICE candidate to peer connection'
        )
      );
  }

  // When that internal WebRTC message is an SDP offer
  remoteOfferReceived(workerId, data) {
    this.logger.log('WebRTC: Remote offer received');

    // If the connection doesn't exist, create it first
    if (this.peers[workerId] === undefined) {
      this.createConnection(workerId);
    }

    // Get the peer connection of that user
    const pc = this.peers[workerId].connection;

    // Set the remote description to be the SDP offer
    pc.setRemoteDescription(new RTCSessionDescription(data))
      .then(() => {
        this.logger.log('WebRTC: Setting offer as remote description');

        // Create an SDP answer in response to their SDP offer
        pc.createAnswer()
          .then(answer => {
            this.logger.log('WebRTC: Answer created');

            // Set this answer as the peer's local description
            pc.setLocalDescription(answer)
              .then(this.logger.log('WebRTC: Set answer as local description'))
              .catch(
                this._handleError(
                  'WebRTC: Error setting answer as local description'
                )
              );
          })
          .catch(this._handleError('WebRTC: Error creating answer'));
      })
      .catch(
        this._handleError('WebRTC: Error setting offer as remote description')
      );
  }

  // When that internal WebRTC message is an SDP answer
  remoteAnswerReceived(workerId, data) {
    this.logger.log('WebRTC: Remote answer received');

    // Get the peer connection of that user and set the remote description to be the SDP offer
    const pc = this.peers[workerId].connection;

    pc.setRemoteDescription(new RTCSessionDescription(data))
      .then(this.logger.log('WebRTC: Setting answer as remote description'))
      .catch(
        this._handleError('WebRTC: Error setting answer as remote description')
      );
  }

  // This is used to attach generic logging handlers for data channels.
  addDataChannelListeners(channel) {
    // When the data channel is opened
    channel.onopen = event => {
      this.logger.log('WebRTC: Data channel open', event);
    };

    // When the data channel is closed
    channel.onclose = event => {
      this.logger.log('WebRTC: Data channel close', event);
    };

    // When the data channel receives a new message
    channel.onmessage = event => {
      this.logger.log('WebRTC: Data channel message', event);
    };

    // When the data channel errors
    channel.onerror = err => {
      this.logger.log('WebRTC: Data channel error', err);
    };
  }

  // Generic error handler to just log a message
  _handleError(message) {
    const self = this;

    return error => {
      self.logger.log(message, error);
    };
  }

  // Generic for each helper for looping through peers
  _forEachPeer(callback, includeMe = false) {
    const peers = this.peers;

    // If we don't want to be in the peer list, remove ourselves
    if (!includeMe) {
      delete peers[this.workerId];
    }

    for (let peer in peers) {
      callback(peers[peer], peer);
    }
  }
}
