import syft from 'syft.js';

const mySyft = new syft({
  verbose: true,
  url: 'ws://localhost:3000'
});

mySyft.onSocketStatus(({ connected }) => {
  if (connected) {
    mySyft.sendMessage('message', 'hello there');
  }
});

mySyft.onMessageSent(message => {
  console.log('my message sent', message);
});

mySyft.onMessageReceived(message => {
  console.log('my message received', message);
});
