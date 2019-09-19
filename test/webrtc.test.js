import 'regenerator-runtime/runtime';

import {
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_OPTIONS,
  WEBRTC_JOIN_ROOM,
  WEBRTC_INTERNAL_MESSAGE,
  WEBRTC_PEER_LEFT,
  Logger
} from 'syft-helpers.js';
import WebRTCClient from '../src/webrtc';

// WebRTC mocks.
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from './_webrtc-mocks';
global.RTCPeerConnection = RTCPeerConnection;
global.RTCSessionDescription = RTCSessionDescription;
global.RTCIceCandidate = RTCIceCandidate;

// Socket mock.
class SocketMock {
  send(type, data) { }
}

describe('WebRTC', () => {
  const logger = new Logger('syft.js', true),
    logSpy = jest.spyOn(logger, 'log'),
    socketMock = new SocketMock();
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
      pcOnIceCandidateMock = jest.spyOn(RTCPeerConnection.prototype, 'onicecandidate', 'set');

    rtc.start(instanceId, scopeId);
    rtc.receiveNewPeer({instanceId: peerInstanceId});
    await new Promise(done => setImmediate(done));

    expect(rtc.peers).toHaveProperty(peerInstanceId);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("connection");
    expect(rtc.peers[peerInstanceId]["connection"]).toBeInstanceOf(RTCPeerConnection);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("channel");

    // Check channel events are set.
    const channel = rtc.peers[peerInstanceId]["channel"];
    expect(channel.onopen).toBeInstanceOf(Function);
    expect(channel.onclose).toBeInstanceOf(Function);
    expect(channel.onmessage).toBeInstanceOf(Function);
    expect(channel.onerror).toBeInstanceOf(Function);

    // Check events are logged.
    logSpy.mockReset();
    channel.onopen("onopen");
    channel.onclose("onclose");
    channel.onmessage("onmessage");
    channel.onerror("onerror");
    expect(logSpy).toHaveBeenCalledTimes(4);
    expect(logSpy.mock.calls[0][1]).toBe("onopen");
    expect(logSpy.mock.calls[1][1]).toBe("onclose");
    expect(logSpy.mock.calls[2][1]).toBe("onmessage");
    expect(logSpy.mock.calls[3][1]).toBe("onerror");

    const pc = rtc.peers[peerInstanceId]["connection"];
    expect(pc.options).toStrictEqual(WEBRTC_PEER_CONFIG);
    expect(pc.optional).toStrictEqual(WEBRTC_PEER_OPTIONS);

    expect(pcOnIceCandidateMock).toHaveBeenCalledTimes(1);
    const onIceCandidate = pc.onicecandidate;
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

    expect(rtc.peers).toHaveProperty(peerInstanceId);
    expect(rtc.peers[peerInstanceId]).toHaveProperty("connection");
    expect(rtc.peers[peerInstanceId]["connection"]).toBeInstanceOf(RTCPeerConnection);

    const pc = rtc.peers[peerInstanceId]["connection"];
    expect(pc.localDescription).toStrictEqual({type: "answer", sdp: "testAnswerSdp"});
    expect(pc.remoteDescription).toStrictEqual(new RTCSessionDescription({type: "offer", sdp: "testOfferSdp"}));

    expect(pcOnDataChannelMock).toHaveBeenCalledTimes(1);
    const onDataChannel = pc.ondatachannel;
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
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      pc = new RTCPeerConnection();

    rtc.start(instanceId, scopeId);

    // Connection already exists.
    rtc.peers[peer1InstanceId] = {
      connection: pc
    };
    rtc.receiveInternalMessage({
        instanceId: peer1InstanceId,
        scopeId,
        to: instanceId,
        type: 'candidate',
        data: {"dummy": 1}
    });

    await new Promise(done => setImmediate(done));

    expect(pc.iceCandidates).toHaveLength(1);
    expect(pc.iceCandidates[0]).toStrictEqual(new RTCIceCandidate({"dummy": 1}))

    // Connection doesn't exists and must be created.
    rtc.receiveInternalMessage({
        instanceId: peer2InstanceId,
        scopeId,
        to: instanceId,
        type: 'candidate',
        data: {"dummy": 2}
    });

    await new Promise(done => setImmediate(done));

    expect(rtc.peers).toHaveProperty(peer2InstanceId);
    expect(rtc.peers[peer2InstanceId]).toHaveProperty("connection");
    expect(rtc.peers[peer2InstanceId]["connection"]).toBeInstanceOf(RTCPeerConnection);

    const pc2 = rtc.peers[peer2InstanceId]["connection"];
    expect(pc2.iceCandidates).toHaveLength(1);
    expect(pc2.iceCandidates[0]).toStrictEqual(new RTCIceCandidate({"dummy": 2}))
  });

  test('sendMessage() should send messages to peers', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      channelSendMock = jest.fn(),
      channel1 = {send: (data) => { channelSendMock(1, data) }},
      channel2 = {send: (data) => { channelSendMock(2, data) }},
      channelWithError = {send: () => { throw new Error() }};

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
    expect(channelSendMock).toHaveBeenCalledTimes(3);
    expect(channelSendMock).toHaveBeenNthCalledWith(3, 1, {"dummy": "hello there"});

    // Error handling.
    rtc.peers[peer1InstanceId] = { channel: channelWithError };
    expect(() => {
      rtc.sendMessage({"dummy": "hello error"});
    }).not.toThrow();

    expect(channelSendMock).toHaveBeenCalledTimes(4);
    expect(channelSendMock).toHaveBeenNthCalledWith(4, 2, {"dummy": "hello error"});
  });

  test('removePeer() should close channel', async () => {
    const
      instanceId = 'testId',
      scopeId = 'testScopeId',
      peer1InstanceId = 'peer1InstanceId',
      peer2InstanceId = 'peer2InstanceId',
      channelCloseMock = jest.fn(),
      channel1 = {close: () => { channelCloseMock(1) }},
      channel2 = {close: () => { channelCloseMock(2) }},
      channelWithError = {send: () => { throw new Error() }};

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

    // Error handling.
    rtc.peers[peer1InstanceId] = { channel: channelWithError };
    expect(() => {
      rtc.removePeer(peer1InstanceId);
    }).not.toThrow();

    expect(rtc.peers).not.toHaveProperty(peer1InstanceId);
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

  test('error handler logs message', async () => {
    logSpy.mockReset();
    const error = new Error("dummy");
    rtc._handleError("test error message")(error);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe("test error message");
    expect(logSpy.mock.calls[0][1]).toStrictEqual(error);
  });
});
