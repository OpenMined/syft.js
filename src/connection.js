export const createConnection = url => {
  return new WebSocket(url);
};
