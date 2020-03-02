// Sockets
export const SOCKET_STATUS = 'socket-status';
export const SOCKET_PING = 'socket-ping';

// Grid
export const GET_PROTOCOL = 'get-protocol';
export const CYCLE_STATUS_ACCEPTED = 'accepted';
export const CYCLE_STATUS_REJECTED = 'rejected';

// WebRTC
export const WEBRTC_JOIN_ROOM = 'webrtc: join-room';
export const WEBRTC_INTERNAL_MESSAGE = 'webrtc: internal-message';
export const WEBRTC_PEER_LEFT = 'webrtc: peer-left';

// WebRTC: Data Channel
export const WEBRTC_DATACHANNEL_CHUNK_SIZE = 64 * 1024;
export const WEBRTC_DATACHANNEL_MAX_BUFFER = 4 * 1024 * 1024;
export const WEBRTC_DATACHANNEL_BUFFER_TIMEOUT = 2000;
export const WEBRTC_DATACHANNEL_MAX_BUFFER_TIMEOUTS = 5;

export const WEBRTC_PEER_CONFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302' // FF says too many stuns are bad, don't send more than this
      ]
    }
  ]
};

export const WEBRTC_PEER_OPTIONS = {
  optional: [
    { DtlsSrtpKeyAgreement: true } // Required for connection between Chrome and Firefox
    // FF works w/o this option, but Chrome fails with it
    // { RtpDataChannels: true } // Required in Firefox to use the DataChannels API
  ]
};
