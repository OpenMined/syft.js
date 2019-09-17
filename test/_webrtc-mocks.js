// RTC classes mocks
export class RTCPeerConnectionMock {
  constructor(options, optional) {
    this.constructorSpy.apply(this, arguments);
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceCandidates = [];
    this.sentMessages = [];
  }

  constructorSpy() {
  }

  createDataChannel(label, options) {
    return {};
  }

  async createOffer(options) {
    return Promise.resolve({type: "offer", sdp: "testOfferSdp"});
  }

  async createAnswer(options) {
    return Promise.resolve({type: "answer", sdp: "testAnswerSdp"});
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

}

Object.defineProperty(RTCPeerConnectionMock.prototype, 'onicecandidate', {
  get() {},
  set(newValue) {},
  enumerable: true,
  configurable: true,
});

Object.defineProperty(RTCPeerConnectionMock.prototype, 'ondatachannel', {
  get() {},
  set(newValue) {},
  enumerable: true,
  configurable: true,
});

export class RTCSessionDescriptionMock {
  constructor(sessionDescription) {
    Object.assign(this, sessionDescription);
  }
}

export class RTCIceCandidateMock {
  constructor(iceCandidate) {
    Object.assign(this, iceCandidate);
  }
}
