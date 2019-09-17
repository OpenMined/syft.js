import 'regenerator-runtime/runtime';

import {
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_OPTIONS,
  WEBRTC_JOIN_ROOM,
  Logger, WEBRTC_INTERNAL_MESSAGE, WEBRTC_PEER_LEFT
} from 'syft-helpers.js';
import WebRTCClient from '../src/webrtc';

// WebRTC mocks.
import {
  RTCPeerConnectionMock,
  RTCSessionDescriptionMock,
  RTCIceCandidateMock
} from './_webrtc-mocks';
global.RTCPeerConnection = RTCPeerConnectionMock;
global.RTCSessionDescription = RTCSessionDescriptionMock;
global.RTCIceCandidate = RTCIceCandidateMock;

// Socket mock.
class SocketMock {
  send(type, data) { }
}

describe('WebRTC', () => {
  const logger = new Logger('syft.js', true);
  const socketMock = new SocketMock();
  let rtc, socketSendMock;

  beforeEach(() => {
    rtc = new WebRTCClient({
      peerConfig: WEBRTC_PEER_CONFIG,
      peerOptions: WEBRTC_PEER_OPTIONS,
      logger,
      socket: socketMock
    });
    socketSendMock = jest.spyOn(socketMock, 'send');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('start() sends message to join the scope', () => {
    rtc.start('joinTestId', 'joinTestScope');
    expect(socketSendMock).toBeCalledTimes(1);
    expect(socketSendMock).lastCalledWith(WEBRTC_JOIN_ROOM, {
      instanceId: 'joinTestId',
      scopeId: 'joinTestScope'
    });
  });

  test('receiveNewPeer() should initiate new rtc data channel', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peerInstanceId = 'peerInstanceId',
      rtcConstructorMock = jest.spyOn(RTCPeerConnection.prototype, 'constructorSpy'),
      pcOnIceCandidateMock = jest.spyOn(RTCPeerConnection.prototype, 'onicecandidate', 'set');

    rtc.start(instanceId, scopeId);
    rtc.receiveNewPeer({instanceId: peerInstanceId});
    await new Promise(done => setImmediate(done));

    expect(rtcConstructorMock).toBeCalledWith(WEBRTC_PEER_CONFIG, WEBRTC_PEER_OPTIONS);
    expect(rtc.peers).toHaveProperty(peerInstanceId);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("connection");
    expect(rtc.peers[peerInstanceId]["connection"]).toBeInstanceOf(RTCPeerConnection);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("channel");

    expect(pcOnIceCandidateMock).toHaveBeenCalledTimes(1);
    const onIceCandidate = pcOnIceCandidateMock.mock.calls[0][0];
    expect(onIceCandidate).toBeInstanceOf(Function);

    // Emulate onicecandidate event.
    onIceCandidate.call(rtc.peers[peerInstanceId].connection, {candidate: "test-candidate1"});
    onIceCandidate.call(rtc.peers[peerInstanceId].connection, {candidate: "test-candidate2"});
    onIceCandidate.call(rtc.peers[peerInstanceId].connection, {});

    expect(socketSendMock).toHaveBeenCalledTimes(4);
    expect(socketSendMock).nthCalledWith(2, WEBRTC_INTERNAL_MESSAGE, {
      instanceId,
      scopeId,
      to: peerInstanceId,
      type: 'offer',
      data: {type: "offer", sdp: "testOfferSdp"}
    });
    expect(socketSendMock).nthCalledWith(3, WEBRTC_INTERNAL_MESSAGE, {
      instanceId,
      scopeId,
      to: peerInstanceId,
      type: 'candidate',
      data: "test-candidate1"
    });
    expect(socketSendMock).nthCalledWith(4, WEBRTC_INTERNAL_MESSAGE, {
      instanceId,
      scopeId,
      to: peerInstanceId,
      type: 'candidate',
      data: "test-candidate2"
    });
  });

  test('should handle "offer" internal message', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peerInstanceId = 'peerInstanceId',
      rtcConstructorMock = jest.spyOn(RTCPeerConnection.prototype, 'constructorSpy'),
      pcOnIceCandidateMock = jest.spyOn(RTCPeerConnection.prototype, 'onicecandidate', 'set'),
      pcOnDataChannelMock = jest.spyOn(RTCPeerConnection.prototype, 'ondatachannel', 'set');

    rtc.start(instanceId, scopeId);
    rtc.receiveInternalMessage({
        instanceId: peerInstanceId,
        scopeId,
        to: instanceId,
        type: 'offer',
        data: {type: "offer", sdp: "testOfferSdp"}
    });

    await new Promise(done => setImmediate(done));

    expect(rtcConstructorMock).toBeCalledWith(WEBRTC_PEER_CONFIG, WEBRTC_PEER_OPTIONS);
    expect(rtc.peers).toHaveProperty(peerInstanceId);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("connection");
    expect(rtc.peers[peerInstanceId]["connection"]).toBeInstanceOf(RTCPeerConnection);

    const pc = rtc.peers[peerInstanceId]["connection"];
    expect(pc.localDescription).toStrictEqual({type: "answer", sdp: "testAnswerSdp"});
    expect(pc.remoteDescription).toStrictEqual(new RTCSessionDescription({type: "offer", sdp: "testOfferSdp"}));

    expect(pcOnDataChannelMock).toHaveBeenCalledTimes(1);
    const onDataChannel = pcOnDataChannelMock.mock.calls[0][0];
    expect(onDataChannel).toBeInstanceOf(Function);
    // Simulate ondatachannel.
    onDataChannel.call(pc, {channel: {dummy: 1}});

    expect(rtc.peers[peerInstanceId]).toHaveProperty("channel");
  });

  test('should handle "answer" internal message', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peerInstanceId = 'peerInstanceId',
      pc = new RTCPeerConnection();

    rtc.start(instanceId, scopeId);
    rtc.peers[peerInstanceId] = {
      connection: pc
    };
    rtc.receiveInternalMessage({
        instanceId: peerInstanceId,
        scopeId,
        to: instanceId,
        type: 'answer',
        data: {type: "answer", sdp: "testAnswerSdp"}
    });

    await new Promise(done => setImmediate(done));

    expect(pc.remoteDescription).toStrictEqual(new RTCSessionDescription({type: "answer", sdp: "testAnswerSdp"}));
  });

  test('should handle "candidate" internal message', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peerInstanceId = 'peerInstanceId',
      pc = new RTCPeerConnection();

    rtc.start(instanceId, scopeId);
    rtc.peers[peerInstanceId] = {
      connection: pc
    };
    rtc.receiveInternalMessage({
        instanceId: peerInstanceId,
        scopeId,
        to: instanceId,
        type: 'candidate',
        data: {"dummy": 1}
    });

    await new Promise(done => setImmediate(done));

    expect(pc.iceCandidates).toHaveLength(1);
    expect(pc.iceCandidates[0]).toStrictEqual(new RTCIceCandidate({"dummy": 1}))
  });

  test('sendMessage() should send messages to peers', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      channelSendMock = jest.fn(),
      channel1 = {send: (data) => { channelSendMock(1, data) }},
      channel2 = {send: (data) => { channelSendMock(2, data) }};

    rtc.start(instanceId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1InstanceId] = { channel: channel1 };
    rtc.peers[peer2InstanceId] = { channel: channel2 };

    // Broadcast.
    rtc.sendMessage({"dummy": "hello"});

    expect(channelSendMock).toHaveBeenCalledTimes(2);
    expect(channelSendMock).toHaveBeenNthCalledWith(1, 1, {"dummy": "hello"});
    expect(channelSendMock).toHaveBeenNthCalledWith(2, 2, {"dummy": "hello"});

    // Single peer.
    rtc.sendMessage({"dummy": "hello there"}, peer1InstanceId);
    expect(channelSendMock).toHaveBeenNthCalledWith(3, 1, {"dummy": "hello there"});
  });

  test('removePeer() should close channel', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      channelCloseMock = jest.fn(),
      channel1 = {close: () => { channelCloseMock(1) }},
      channel2 = {close: () => { channelCloseMock(2) }};

    rtc.start(instanceId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1InstanceId] = { channel: channel1 };
    rtc.peers[peer2InstanceId] = { channel: channel2 };

    rtc.removePeer(peer1InstanceId);

    expect(channelCloseMock).toHaveBeenCalledTimes(1);
    expect(channelCloseMock).toHaveBeenNthCalledWith(1, 1);
    expect(rtc.peers).not.toHaveProperty(peer1InstanceId);
    expect(rtc.peers).toHaveProperty(peer2InstanceId);

    // Non-existing peer.
    rtc.removePeer("invalid");
    expect(channelCloseMock).toHaveBeenCalledTimes(1);
    expect(rtc.peers).toHaveProperty(peer2InstanceId);
  });

  test('stop() should close all channels and send peer left message', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      channelCloseMock = jest.fn(),
      channel1 = {close: () => { channelCloseMock(1) }},
      channel2 = {close: () => { channelCloseMock(2) }};

    rtc.start(instanceId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1InstanceId] = { channel: channel1 };
    rtc.peers[peer2InstanceId] = { channel: channel2 };

    rtc.stop();

    expect(channelCloseMock).toHaveBeenCalledTimes(2);
    expect(rtc.peers).not.toHaveProperty(peer1InstanceId);
    expect(rtc.peers).not.toHaveProperty(peer2InstanceId);

    expect(socketSendMock).toBeCalledTimes(2);
    expect(socketSendMock).lastCalledWith(WEBRTC_PEER_LEFT, {
      instanceId,
      scopeId
    });
  });

});
