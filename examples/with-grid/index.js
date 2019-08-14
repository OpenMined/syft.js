/*
The following is a step-by-step explanation of what's going on below:

1. Initiate syft.js, create a unique instance ID for the client, and connect to grid.js
2. Get the protocol we want from grid.js
3. Create a new "scope" (like creating a private room between this client and other syft.js clients with an invitation)
 - Depending on the protocol chosen, this will get the number of participants and generate instance ID's for each of them
 - When creating a new scope, syft.js sends the id of the protocol, their instance ID, and the instance ID's of the other participants
4. Links are created whereby other participants may join
 - Note that at this point, the creator of the scope may disconnect from grid.js since grid.js is not going to be a participant
 - In theory, grid.js could be a participant in protocols. This is not done in this example.
 - The scope creator should NEVER send the plans of the other participants directly to them
 - Each participant must connect with grid.js and retrieve them independently
 - While grid.js will send the entire protocol to the creator of the scope, each participant will only receive their specific list of plans in the protocol
5. Upon a participant joining, get the plans that have been assigned to them by the grid
 - At this point, assuming all participants have joined, they should all have their plans................
*/

import syft from 'syft.js';
import {
  getQueryVariable,
  writeIdentityToDOM,
  writeLinksToDOM
} from './_helpers';

const instanceId = getQueryVariable('instance_id');
const scope = getQueryVariable('scope_id');

// 1. Initiate syft.js and create socket connection
const mySyft = new syft({
  verbose: true,
  url: 'ws://localhost:3000',
  instanceId,
  scope
});

const textarea = document.getElementById('message');
const submitButton = document.getElementById('message-send');

const prepareSubmitMessage = () => {
  submitButton.onclick = () => {
    mySyft.sendToPeers(textarea.value);

    textarea.value = '';
  };
};

mySyft.onSocketStatus(async ({ connected }) => {
  if (connected) {
    // If we have an instanceId and a scope given to us, we must be a participant in the scope...
    if (instanceId && scope) {
      writeIdentityToDOM(
        `You are participant "${instanceId}" in scope "${scope}"`
      );

      // 5. Get the list of plans for the scope we want to join
      await mySyft.getPlans();

      console.log('PLANS', mySyft.plans);

      mySyft.connectToPeers();
      prepareSubmitMessage();

      // Shutdown connection to grid.js because we no longer need it (in this case)
      // mySyft.disconnectFromGrid();
    }
    // Otherwise, we must be the creator of the scope!
    else {
      writeIdentityToDOM(`You are the creator "${mySyft.instanceId}"`);

      // 2. Get the protocol we want (in this case "millionaire-problem")
      const protocol = await mySyft.getProtocol('millionaire-problem');

      if (protocol) {
        // 3. Create a scope
        const scope = await mySyft.createScope();

        // 4. Create links for the other participants
        writeLinksToDOM(
          scope.participants.map(
            id =>
              `http://localhost:8080?instance_id=${id}&scope_id=${scope.scopeId}`
          )
        );

        console.log('PLANS', mySyft.plans);

        mySyft.connectToPeers();
        prepareSubmitMessage();

        // Shutdown connection to grid.js because we no longer need it (in this case)
        // mySyft.disconnectFromGrid();
      }
    }
  }
});
