// TODO: Make sure this is working!
import 'webrtc-adapter';

export default class WebRTCClient {
  constructor(opts) {
    const { peerConfig, logger, socket } = opts;

    this.peerConfig = peerConfig;
    this.logger = logger;
    this.socket = socket;

    // Think of offerPeer as our local client. It's going to create a data channel and an offer and send them to the other peer.
    this.offerPeer = new RTCPeerConnection(peerConfig);
    this.offerPeer.onicecandidate = event => this.onOfferICE(event, this);

    // Think of answerPeer as our remote server. It's going to accept an offer from offerPeer, and create a corresponding answer.
    this.answerPeer = new RTCPeerConnection(this.peerConfig);
    this.answerPeer.ondatachannel = event =>
      this.onAnswerDataChannel(event, this);
    this.answerPeer.onicecandidate = event => this.onAnswerICE(event, this);
  }

  // This will be called for each offer candidate, which is a potential address that the other peer can attempt to connect to.
  // Note that event.candidate can be null, so we must guard against that.
  // The two peers will exchange candidates until they find a connection that works.
  onOfferICE(event, self) {
    self.logger.log('WebRTC: offerPeer ice candidate', event);

    if (event && event.candidate) {
      // These would normally be sent to answerPeer over some other transport, like a websocket, but since this is local we can just set it here.
      this.answerPeer.addIceCandidate(event.candidate);
    }
  }

  // The answer peer will also have this method called for each candidate.
  onAnswerICE(event, self) {
    self.logger.log('WebRTC: answerPeer ice candidate', event);

    if (event && event.candidate) {
      // These would normally be sent to offerPeer over some other transport, like a websocket, but since this is local we can just set it here.
      this.offerPeer.addIceCandidate(event.candidate);
    }
  }

  // This will be called when answerPeer receives the offer, since a data channel was included in the offer.
  // The event.channel will be answerPeer's end of the channel.
  // Note that answerPeer does not create a data channel directly, it only uses this one created as a side effect of the offer.
  onAnswerDataChannel(event, self) {
    self.logger.log('WebRTC: answerPeer data channel', event);

    this.addDataChannelListeners(event.channel, 'answerPeer');
  }

  // This is used to attach generic logging handlers for data channels.
  addDataChannelListeners(channel, label) {
    channel.onclose = event => {
      this.logger.log(`WebRTC: ${label} data channel close`, event);
    };

    channel.onerror = err => {
      this.logger.log(`WebRTC: ${label} data channel error`, err);
    };

    channel.onmessage = event => {
      this.logger.log(`WebRTC: ${label} data channel message`, event);
    };

    channel.onopen = event => {
      this.logger.log(`WebRTC: ${label} data channel open`, event);

      channel.send('hello from ' + label);
    };
  }

  // Generic error handler to just log a message.
  handleError(message) {
    const self = this;

    return error => {
      self.logger.log(message, error);
    };
  }

  // Start everything
  start() {
    // Create the offered data channel. Note that this must happen before the offer is created, so that it is included in the offer.
    const offerDataChannel = this.offerPeer.createDataChannel('dataChannel', {
      maxRetransmits: 0,
      reliable: false
    });

    this.addDataChannelListeners(offerDataChannel, 'offerPeer');

    // Create an offer to send to answerPeer. Like most operations with the WebRTC API, this is asynchronous.
    // Our callback will be invoked once an offer has been created.
    this.offerPeer.createOffer(offer => {
      this.logger.log('WebRTC: created offer', offer);
      offer = new RTCSessionDescription(offer);

      this.offerPeer.setLocalDescription(
        offer,
        () => {
          this.logger.log('WebRTC: set local description for offerPeer');
        },

        this.handleError(
          'WebRTC: error setting local description for offerPeer'
        )
      );

      // Normally we would send this over the wire to answerPeer, but since this is all local, we can just set it here.
      this.answerPeer.setRemoteDescription(
        offer,
        () => {
          this.logger.log('WebRTC: set remote description for answerPeer');

          this.answerPeer.createAnswer(answer => {
            this.logger.log('WebRTC: created answer');
            answer = new RTCSessionDescription(answer);

            this.answerPeer.setLocalDescription(
              answer,
              () => {
                this.logger.log('WebRTC: set local description for answerPeer');
              },

              this.handleError(
                'WebRTC: error setting answerPeer local description'
              )
            );

            // Normally we would send this over the wire to offerPeer, but since this is all local, we can just set it here.
            this.offerPeer.setRemoteDescription(
              answer,
              () => {
                this.logger.log('WebRTC: set remote description for offerPeer');
              },

              this.handleError(
                'WebRTC: error setting offerPeer remote description'
              )
            );
          }, this.handleError('WebRTC: error creating answer'));
        },

        this.handleError(
          'WebRTC: error setting remote description for answerPeer'
        )
      );
    }, this.handleError('WebRTC: error creating offer'));
  }
}
