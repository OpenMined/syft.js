/*
The following is a step-by-step explanation of what's going on below:

1. Initiate syft.js and connect to the Grid
2. Get the protocol and assigned plan that this worker is supposed to work on
 - If there is no workerId, Grid will generate one for us
 - If there is no scopeId, Grid will generate a scope and make this worker the creator
 - Altogether, Grid will send back this worker's information, their protocol, their assigned plan, and the workerId's and assignments of the other participants
3. Links are created whereby other participants may join
 - These links are to be shared with the other participants
 - Note that each worker will need to request their protocol and assigned plan from the grid... they won't have access to another worker's assigned plan
4. Create a direct peer-to-peer connection with the other participants
 - This is done using WebRTC under the hood using a mesh network by which every peer has a private data connection to every other peer
 - This is an asynchronous action, meaning that peers may come and go at any point
 - The syft.js library is capable of handling connections, disconnections, and reconnections without issue
5. Execute the plan using data supplied by the worker
 - The executePlan() function always returns a Promise, be sure to handle both a resolved and a rejected case
*/

import {
  getQueryVariable,
  writeIdentityToDOM,
  writeLinksToDOM
} from './_helpers';

// In the real world: import syft from 'syft.js';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '../../src';
import { MnistData } from './mnist';


const gridServer = document.getElementById('grid-server');
const protocol = document.getElementById('protocol');
const connectButton = document.getElementById('connect');
const startButton = document.getElementById('start');
const disconnectButton = document.getElementById('disconnect');
const appContainer = document.getElementById('app');
const textarea = document.getElementById('message');
const submitButton = document.getElementById('message-send');

appContainer.style.display = 'none';

/*
connectButton.onclick = () => {
  appContainer.style.display = 'block';
  gridServer.style.display = 'none';
  protocol.style.display = 'none';
  connectButton.style.display = 'none';

  startSyft(gridServer.value, protocol.value);
};
*/

startButton.onclick = () => {
  setFLUI();
  startFL(gridServer.value, 'model-id');
};

const startFL = async (url, modelName) => {
  const worker = new Syft({ url, verbose: true });
  const job = await worker.newJob({ modelName });

  job.start();

  job.on('accepted', async ({ model, clientConfig }) => {
    // Load data
    console.log('Loading data...');
    const mnist = new MnistData();
    await mnist.load();
    const trainDataset = mnist.getTrainData();
    const data = trainDataset.xs;
    const targets = trainDataset.labels;
    console.log('Data loaded');

    // Prepare train parameters.
    const batchSize = clientConfig.batch_size;
    const lr = clientConfig.lr;
    const numBatches = Math.ceil(data.shape[0] / batchSize);

    // Calculate total number of model updates
    // in case none of these options specified, we fallback to one loop
    // though all batches.
    const maxEpochs = clientConfig.max_epochs || 1;
    const maxUpdates = clientConfig.max_updates || maxEpochs * numBatches;
    const numUpdates = Math.min(maxUpdates, maxEpochs * numBatches);

    // Make copies of model params.
    let modelParams = [];
    for (let param of model.params) {
      modelParams.push(param.clone());
    }

    // Main training loop.
    for (let update = 0, batch = 0, epoch = 0; update < numUpdates; update++) {
      // Slice a batch.
      const chunkSize = Math.min(batchSize, data.shape[0] - batch * batchSize);
      const dataBatch = data.slice(batch * batchSize, chunkSize);
      const targetBatch = targets.slice(batch * batchSize, chunkSize);

      // Execute the plan and get updated model params back.
      let [loss, acc, ...updatedModelParams] = await job.plans[
        'training_plan'
      ].execute(
        job.worker,
        dataBatch,
        targetBatch,
        chunkSize,
        lr,
        ...modelParams
      );

      // Use updated model params in the next cycle.
      for (let i = 0; i < modelParams.length; i++) {
        modelParams[i].dispose();
        modelParams[i] = updatedModelParams[i];
      }

      await updateUIAfterBatch({
        epoch,
        batch,
        accuracy: (await acc.data())[0],
        loss: (await loss.data())[0]
      });

      batch++;

      // Check if we're out of batches (end of epoch).
      if (batch === numBatches) {
        batch = 0;
        epoch++;
      }

      // Free GPU memory.
      acc.dispose();
      loss.dispose();
      dataBatch.dispose();
      targetBatch.dispose();
    }

    // TODO protocol execution
    // job.protocols['secure_aggregation'].execute();

    // Calc model diff.
    const modelDiff = [];
    for (let i = 0; i < modelParams.length; i++) {
      modelDiff.push(model.params[i].sub(modelParams[i]));
    }

    // Report diff.
    await job.report(modelDiff);
    console.log('Done!');
  });

  job.on('rejected', ({ timeout }) => {
    // Handle the job rejection
    console.log('We have been rejected by PyGrid to participate in the job.');
    const msUntilRetry = timeout * 1000;
    // Try to join the job again in "msUntilRetry" milliseconds
    setTimeout(job.start.bind(job), msUntilRetry);
  });

  job.on('error', err => {
    console.log('Error', err);
  });
};

const setFLUI = () => {
  Plotly.newPlot(
    'loss_graph',
    [{ y: [], mode: 'lines', line: { color: '#80CAF6' } }],
    { title: 'Train Loss', showlegend: false },
    { staticPlot: true }
  );

  Plotly.newPlot(
    'acc_graph',
    [{ y: [], mode: 'lines', line: { color: '#80CAF6' } }],
    { title: 'Train Accuracy', showlegend: false },
    { staticPlot: true }
  );

  document.getElementById('fl-training').style.display = 'table';
};

const updateUIAfterBatch = async ({ epoch, batch, accuracy, loss }) => {
  console.log(
    `Epoch: ${epoch}, Batch: ${batch}, Accuracy: ${accuracy}, Loss: ${loss}`
  );
  Plotly.extendTraces('loss_graph', { y: [[loss]] }, [0]);
  Plotly.extendTraces('acc_graph', { y: [[accuracy]] }, [0]);
  await tf.nextFrame();
};

// ---------------------------- OLD -------------------------------

const startSyft = (url, protocolId) => {
  const workerId = getQueryVariable('worker_id');
  const scopeId = getQueryVariable('scope_id');

  // 1. Initiate syft.js and create socket connection
  const mySyft = new Syft({
    verbose: true,
    url,
    workerId,
    scopeId,
    protocolId
  });

  mySyft.onSocketStatus(async ({ connected }) => {
    if (connected) {
      // 2. Get the protocol and associated plan that are assigned to me
      await mySyft.getProtocol();

      console.log('PROTOCOL', mySyft.protocol);
      console.log('PLAN', mySyft.plan);

      // Write my identity to the screen - not required
      writeIdentityToDOM(
        `You are ${mySyft.role} "${mySyft.workerId}" in scope "${mySyft.scopeId}"`
      );

      // Push the workerId and scopeId onto the current URL if they aren't already there
      // This isn't strictly necessary, but if a worker is a creator of a scope (instead of a participant),
      // then they won't be able to refresh and rejoin the scope they created
      if (!workerId && !scopeId) {
        window.history.pushState(
          {},
          null,
          `?worker_id=${mySyft.workerId}&scope_id=${mySyft.scopeId}`
        );
      }

      // 3. Create links for the other participants
      if (mySyft.role === 'creator') {
        writeLinksToDOM(
          Object.keys(mySyft.participants).map(
            id =>
              `${window.location.origin +
                window.location.pathname}?worker_id=${id}&scope_id=${
                mySyft.scopeId
              }`
          )
        );
      }

      // 4. Create a direct P2P connection with the other participants
      mySyft.connectToParticipants();

      // 5. Execute plan with supplied data
      const data = tf.tensor([
        [-1, 2],
        [3, -4]
      ]);

      mySyft
        .executePlan(data)
        .then(results => {
          // For each resultId specified by the plan, output the resulting value
          results.forEach(result => {
            result.value
              .array()
              .then(arrayValue => console.log(result.id, arrayValue));
          });
        })
        .catch(error => {
          console.log('Handle the error...', error);
        });
    }
  });

  submitButton.onclick = () => {
    mySyft.sendToParticipants(textarea.value);

    textarea.value = '';
  };

  disconnectButton.onclick = () => {
    mySyft.disconnectFromParticipants();
    mySyft.disconnectFromGrid();

    appContainer.style.display = 'none';
    gridServer.style.display = 'inline-block';
    protocol.style.display = 'inline-block';
    connectButton.style.display = 'inline-block';
  };
};
