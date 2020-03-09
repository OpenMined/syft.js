import {
  WEBRTC_PEER_CONFIG,
  WEBRTC_PEER_OPTIONS,
  WEBRTC_JOIN_ROOM,
  WEBRTC_INTERNAL_MESSAGE
} from '../src/_constants';
import Logger from '../src/logger';
import WebRTCClient from '../src/webrtc';
import DataChannelMessage from '../src/data-channel-message';

// WebRTC mocks.
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from './mocks/webrtc';
global.RTCPeerConnection = RTCPeerConnection;
global.RTCSessionDescription = RTCSessionDescription;
global.RTCIceCandidate = RTCIceCandidate;

// Socket mock.
class SocketMock {
  send() {}
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
      workerId: 'joinTestId',
      scopeId: 'joinTestScope'
    });
  });

  test('receiveNewPeer() should initiate new rtc data channel', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peerworkerId = 'peerworkerId',
      pcOnIceCandidateMock = jest.spyOn(
        RTCPeerConnection.prototype,
        'onicecandidate',
        'set'
      );

    rtc.start(workerId, scopeId);
    rtc.receiveNewPeer({ workerId: peerworkerId });
    await new Promise(done => setImmediate(done));

    expect(rtc.peers).toHaveProperty(peerworkerId);
    expect(rtc.peers[peerworkerId]).toHaveProperty('connection');
    expect(rtc.peers[peerworkerId]['connection']).toBeInstanceOf(
      RTCPeerConnection
    );
    expect(rtc.peers[peerworkerId]).toHaveProperty('channel');

    // Check channel events are set.
    const channel = rtc.peers[peerworkerId]['channel'];
    expect(channel.onopen).toBeInstanceOf(Function);
    expect(channel.onclose).toBeInstanceOf(Function);
    expect(channel.onmessage).toBeInstanceOf(Function);
    expect(channel.onerror).toBeInstanceOf(Function);

    // Check events are logged.
    logSpy.mockReset();
    channel.onopen('onopen');
    channel.onclose('onclose');
    channel.onmessage('onmessage');
    channel.onerror('onerror');
    expect(logSpy).toHaveBeenCalledTimes(4);
    expect(logSpy.mock.calls[0][1]).toBe('onopen');
    expect(logSpy.mock.calls[1][1]).toBe('onclose');
    expect(logSpy.mock.calls[2][1]).toBe('onmessage');
    expect(logSpy.mock.calls[3][1]).toBe('onerror');

    const pc = rtc.peers[peerworkerId]['connection'];
    expect(pc.options).toStrictEqual(WEBRTC_PEER_CONFIG);
    expect(pc.optional).toStrictEqual(WEBRTC_PEER_OPTIONS);

    expect(pcOnIceCandidateMock).toHaveBeenCalledTimes(1);
    const onIceCandidate = pc.onicecandidate;
    expect(onIceCandidate).toBeInstanceOf(Function);

    // Emulate onicecandidate event.
    onIceCandidate.call(rtc.peers[peerworkerId].connection, {
      candidate: 'test-candidate1'
    });
    onIceCandidate.call(rtc.peers[peerworkerId].connection, {
      candidate: 'test-candidate2'
    });
    onIceCandidate.call(rtc.peers[peerworkerId].connection, {});

    expect(socketSendMock).toHaveBeenCalledTimes(4);
    expect(socketSendMock).nthCalledWith(2, WEBRTC_INTERNAL_MESSAGE, {
      workerId,
      scopeId,
      to: peerworkerId,
      type: 'offer',
      data: { type: 'offer', sdp: 'testOfferSdp' }
    });
    expect(socketSendMock).nthCalledWith(3, WEBRTC_INTERNAL_MESSAGE, {
      workerId,
      scopeId,
      to: peerworkerId,
      type: 'candidate',
      data: 'test-candidate1'
    });
    expect(socketSendMock).nthCalledWith(4, WEBRTC_INTERNAL_MESSAGE, {
      workerId,
      scopeId,
      to: peerworkerId,
      type: 'candidate',
      data: 'test-candidate2'
    });
  });

  test('should handle "offer" internal message', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peerworkerId = 'peerworkerId',
      pcOnDataChannelMock = jest.spyOn(
        RTCPeerConnection.prototype,
        'ondatachannel',
        'set'
      );

    rtc.start(workerId, scopeId);
    rtc.receiveInternalMessage({
      workerId: peerworkerId,
      scopeId,
      to: workerId,
      type: 'offer',
      data: { type: 'offer', sdp: 'testOfferSdp' }
    });

    await new Promise(done => setImmediate(done));

    expect(rtc.peers).toHaveProperty(peerworkerId);
    expect(rtc.peers[peerworkerId]).toHaveProperty('connection');
    expect(rtc.peers[peerworkerId]['connection']).toBeInstanceOf(
      RTCPeerConnection
    );

    const pc = rtc.peers[peerworkerId]['connection'];
    expect(pc.localDescription).toStrictEqual({
      type: 'answer',
      sdp: 'testAnswerSdp'
    });
    expect(pc.remoteDescription).toStrictEqual(
      new RTCSessionDescription({ type: 'offer', sdp: 'testOfferSdp' })
    );

    expect(pcOnDataChannelMock).toHaveBeenCalledTimes(1);
    const onDataChannel = pc.ondatachannel;
    expect(onDataChannel).toBeInstanceOf(Function);
    // Simulate ondatachannel.
    onDataChannel.call(pc, { channel: { dummy: 1 } });

    expect(rtc.peers[peerworkerId]).toHaveProperty('channel');
  });

  test('should handle "answer" internal message', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peerworkerId = 'peerworkerId',
      pc = new RTCPeerConnection();

    rtc.start(workerId, scopeId);
    rtc.peers[peerworkerId] = {
      connection: pc
    };
    rtc.receiveInternalMessage({
      workerId: peerworkerId,
      scopeId,
      to: workerId,
      type: 'answer',
      data: { type: 'answer', sdp: 'testAnswerSdp' }
    });

    await new Promise(done => setImmediate(done));

    expect(pc.remoteDescription).toStrictEqual(
      new RTCSessionDescription({ type: 'answer', sdp: 'testAnswerSdp' })
    );
  });

  test('should handle "candidate" internal message', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peer1workerId = 'peer1workerId',
      peer2workerId = 'peer2workerId',
      pc = new RTCPeerConnection();

    rtc.start(workerId, scopeId);

    // Connection already exists.
    rtc.peers[peer1workerId] = {
      connection: pc
    };
    rtc.receiveInternalMessage({
      workerId: peer1workerId,
      scopeId,
      to: workerId,
      type: 'candidate',
      data: { dummy: 1 }
    });

    await new Promise(done => setImmediate(done));

    expect(pc.iceCandidates).toHaveLength(1);
    expect(pc.iceCandidates[0]).toStrictEqual(
      new RTCIceCandidate({ dummy: 1 })
    );

    // Connection doesn't exists and must be created.
    rtc.receiveInternalMessage({
      workerId: peer2workerId,
      scopeId,
      to: workerId,
      type: 'candidate',
      data: { dummy: 2 }
    });

    await new Promise(done => setImmediate(done));

    expect(rtc.peers).toHaveProperty(peer2workerId);
    expect(rtc.peers[peer2workerId]).toHaveProperty('connection');
    expect(rtc.peers[peer2workerId]['connection']).toBeInstanceOf(
      RTCPeerConnection
    );

    const pc2 = rtc.peers[peer2workerId]['connection'];
    expect(pc2.iceCandidates).toHaveLength(1);
    expect(pc2.iceCandidates[0]).toStrictEqual(
      new RTCIceCandidate({ dummy: 2 })
    );
  });

  test('sendMessage() should send messages to peers', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peer1workerId = 'peer1workerId',
      peer2workerId = 'peer2workerId',
      channelSendMock = jest.fn(),
      channel1 = {
        send: data => {
          channelSendMock(1, data);
        },
        bufferedAmount: 0,
        addEventListener: () => {}
      },
      channel2 = {
        send: data => {
          channelSendMock(2, data);
        },
        bufferedAmount: 0,
        addEventListener: () => {}
      },
      channelWithError = {
        send: () => {
          throw new Error();
        },
        bufferedAmount: 0,
        addEventListener: () => {}
      };

    rtc.start(workerId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1workerId] = { channel: channel1 };
    rtc.peers[peer2workerId] = { channel: channel2 };

    // Broadcast.
    await rtc.sendMessage('hello');
    expect(channelSendMock).toHaveBeenCalledTimes(2);
    expect(channelSendMock).toHaveBeenNthCalledWith(
      1,
      1,
      new DataChannelMessage({ data: 'hello' }).getChunk(0)
    );
    expect(channelSendMock).toHaveBeenNthCalledWith(
      2,
      2,
      new DataChannelMessage({ data: 'hello' }).getChunk(0)
    );

    // Single peer.
    await rtc.sendMessage('hello there', peer1workerId);
    expect(channelSendMock).toHaveBeenCalledTimes(3);
    expect(channelSendMock).toHaveBeenNthCalledWith(
      3,
      1,
      new DataChannelMessage({ data: 'hello there' }).getChunk(0)
    );

    // Error handling.
    rtc.peers[peer1workerId] = { channel: channelWithError };
    expect(rtc.sendMessage('hello error')).rejects.toThrow();
    expect(channelSendMock).toHaveBeenCalledTimes(4);
    expect(channelSendMock).toHaveBeenNthCalledWith(
      4,
      2,
      new DataChannelMessage({ data: 'hello error' }).getChunk(0)
    );
  });

  test('sendMessage() can send large messages', async done => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peerWorkerId = 'peerWorkerId',
      channel = {
        send: function(data) {
          setTimeout(this.onmessage, 100, { data });
        },
        bufferedAmount: 0,
        addEventListener: () => {}
      };

    rtc.start(workerId, scopeId);
    rtc.peers = {};
    rtc.peers[peerWorkerId] = { channel: channel };
    // sets channel.onmessage value that's triggered by our fake channel.send()
    rtc.addDataChannelListeners(channel);

    const bigMessage = 'test'.repeat(1000000); // ~4MB
    rtc.on('message', message => {
      expect(message.size).toBe(bigMessage.length);
      expect(new TextDecoder().decode(message.data)).toStrictEqual(bigMessage);
      done();
    });

    rtc.sendMessage(bigMessage);
  });

  test('removePeer() should close channel', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peer1workerId = 'peer1workerId',
      peer2workerId = 'peer2workerId',
      channelCloseMock = jest.fn(),
      channel1 = {
        close: () => {
          channelCloseMock(1);
        }
      },
      channel2 = {
        close: () => {
          channelCloseMock(2);
        }
      },
      channelWithError = {
        send: () => {
          throw new Error();
        }
      };

    rtc.start(workerId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1workerId] = { channel: channel1 };
    rtc.peers[peer2workerId] = { channel: channel2 };

    rtc.removePeer(peer1workerId);

    expect(channelCloseMock).toHaveBeenCalledTimes(1);
    expect(channelCloseMock).toHaveBeenNthCalledWith(1, 1);
    expect(rtc.peers).not.toHaveProperty(peer1workerId);
    expect(rtc.peers).toHaveProperty(peer2workerId);

    // Non-existing peer.
    rtc.removePeer('invalid');
    expect(channelCloseMock).toHaveBeenCalledTimes(1);
    expect(rtc.peers).toHaveProperty(peer2workerId);

    // Error handling.
    rtc.peers[peer1workerId] = { channel: channelWithError };
    expect(() => {
      rtc.removePeer(peer1workerId);
    }).not.toThrow();

    expect(rtc.peers).not.toHaveProperty(peer1workerId);
  });

  test('stop() should close all channels and send peer left message', async () => {
    const workerId = 'testId',
      scopeId = 'testScopeId',
      peer1workerId = 'peer1workerId',
      peer2workerId = 'peer2workerId',
      channelCloseMock = jest.fn(),
      channel1 = {
        close: () => {
          channelCloseMock(1);
        }
      },
      channel2 = {
        close: () => {
          channelCloseMock(2);
        }
      };

    rtc.start(workerId, scopeId);
    rtc.peers = {};
    rtc.peers[peer1workerId] = { channel: channel1 };
    rtc.peers[peer2workerId] = { channel: channel2 };

    rtc.stop();

    expect(channelCloseMock).toHaveBeenCalledTimes(2);
    expect(rtc.peers).not.toHaveProperty(peer1workerId);
    expect(rtc.peers).not.toHaveProperty(peer2workerId);
  });

  test('error handler logs message', async () => {
    logSpy.mockReset();
    const error = new Error('dummy');
    rtc._handleError('test error message')(error);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe('test error message');
    expect(logSpy.mock.calls[0][1]).toStrictEqual(error);
  });
});
