export const getConnection = (url, onJson) => {
  const ws = new WebSocket(url);
  ws.onmessage = event => onJson(JSON.parse(event.data));
  return {
    close: () => ws.close()
  };
};
