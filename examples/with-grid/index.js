import syft from 'syft.js';
import { getQueryVariable, writeLinksToDOM } from './_helpers';

const instanceId = getQueryVariable('instance_id');
const scope = getQueryVariable('scope_id');

// 1. Initiate syft.js and create socket connection
const mySyft = new syft({
  verbose: true,
  url: 'ws://localhost:3000',
  instanceId,
  scope
});

mySyft.onSocketStatus(async ({ connected }) => {
  if (connected) {
    // If we have an instanceId and a scope given to us, we must be a participant in the scope...
    if (instanceId && scope) {
      console.log(`You are participant "${instanceId}" in scope "${scope}"`);

      // DO THE PARTICIPANT FLOW NOW
    }
    // Otherwise, we must be the creator of the scope!
    else {
      console.log(`You are the creator "${mySyft.instanceId}"!`);

      // 2. Get the protocol we want (in this case "millionaire-problem")
      const protocol = await mySyft.getProtocol('millionaire-problem');

      if (protocol) {
        // 3. Create a scope
        const scope = await mySyft.createScope();

        // 4. Create links for the other participants
        const links = scope.participants.map(
          id =>
            `http://localhost:8080?instance_id=${id}&scope_id=${scope.scopeId}`
        );

        writeLinksToDOM(links);

        // Shutdown connection to grid.js because we no longer need it (in this case)
        mySyft.disconnectFromGrid();
      }
    }
  }
});

/*
STEPS:

1. Initiate syft.js, create a unique instance ID for the client, and connect to grid.js
2. Get the protocol we want from grid.js
3. As a developer implementing syft.js, choose one of them with which to create a new scope
 - Depending on the protocol chosen, get the number of participants and generate instance ID's for each of them
 - When creating a new scope, the developer sends the id of the chosen protocol
 - In the same message, syft.js will internally send the client's instance ID and the instance ID's of all the participants
4. ...

Remember - once we create P2P connections, destroy the connection to grid.js (unless grid.js is a participant)

Protocol will look like a dictionary, where a key is a user and the value is a LIST of plans (not necessarily something to be executed serially)
The creator can assign participants to a list of plans in the protocol, but the creator cannot physically send the list of plans to the other participants
Once the scope is created, the links will be generated and sent to each user
Then the other participants will request the grid to send them ONLY their exact list of plans given their instance id and scope id
*/
