// RTC classes mocks
export class RTCPeerConnection {
  constructor(options, optional) {
    this.options = options;
    this.optional = optional;
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceCandidates = [];
    this.sentMessages = [];
    this.ondatachannelListener = null;
    this.onicecandidateListener = null;
  }

  createDataChannel() {
    return {};
  }

  async createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'testOfferSdp' });
  }

  async createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'testAnswerSdp' });
  }

  async setLocalDescription(sessionDescription) {
    this.localDescription = sessionDescription;
    return Promise.resolve();
  }

  async setRemoteDescription(sessionDescription) {
    this.remoteDescription = sessionDescription;
    return Promise.resolve();
  }

  async addIceCandidate(iceCandidate) {
    this.iceCandidates.push(iceCandidate);
    return Promise.resolve();
  }

  get onicecandidate() {
    return this.onicecandidateListener;
  }

  set onicecandidate(cb) {
    this.onicecandidateListener = cb;
  }

  get ondatachannel() {
    return this.ondatachannelListener;
  }

  set ondatachannel(cb) {
    this.ondatachannelListener = cb;
  }
}

export class RTCSessionDescription {
  constructor(sessionDescription) {
    Object.assign(this, sessionDescription);
  }
}

export class RTCIceCandidate {
  constructor(iceCandidate) {
    Object.assign(this, iceCandidate);
  }
}
