import { WebSocket } from 'mock-socket';

import Logger from '../src/logger';
import Socket from '../src/sockets';
import WebRTCClient from '../src/webrtc';
import { WEBRTC_PEER_CONFIG, WEBRTC_PEER_OPTIONS } from '../src/_constants';

global.WebSocket = WebSocket;

const url = 'ws://localhost:8080/';

describe('WebRTC', () => {
  test('THIS IS A DUMMY TEST', () => {
    const logger = new Logger(true);

    const socket = new Socket({
      url,
      logger
    });

    const rtc = new WebRTCClient({
      peerConfig: WEBRTC_PEER_CONFIG,
      peerOptions: WEBRTC_PEER_OPTIONS,
      logger,
      socket
    });

    expect(1).toBe(1);
  });
});
