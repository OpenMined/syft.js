import React from 'react';
import { render } from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

import App from './app.js';

// Define grid connection parameters
const url = 'ws://localhost:5000';
const modelName = 'bandit';
const modelVersion = '1.0.0';
const shouldRepeat = false;

// Pick random values f.or the layout
const pickValue = p => p[Math.floor(Math.random() * p.length)];

// 24 possible configurations
const appConfigPossibilities = {
  heroBackground: ['black', 'gradient'],
  buttonPosition: ['hero', 'vision'],
  buttonIcon: ['arrow', 'user', 'code'],
  buttonColor: ['blue', 'white']
};

// Final configuration for the app
const appConfig = {
  heroBackground: pickValue(appConfigPossibilities.heroBackground),
  buttonPosition: pickValue(appConfigPossibilities.buttonPosition),
  buttonIcon: pickValue(appConfigPossibilities.buttonIcon),
  buttonColor: pickValue(appConfigPossibilities.buttonColor)
};

// Set up an event listener for the button when it's clicked
// TODO: @maddie - Submit the diff for a positive button click here...
const onButtonClick = () => {
  console.log(
    'Clicked the button! Send a positive result for config',
    appConfig
  );
};

// Start React
render(
  <App
    config={appConfig}
    onButtonClick={onButtonClick}
    start={() => startFL(url, modelName, modelVersion, shouldRepeat)}
  />,
  document.getElementById('root')
);

// Main start method
const startFL = async (
  url,
  modelName,
  modelVersion,
  authToken = null,
  shouldRepeat
) => {
  const worker = new Syft({ url, authToken, verbose: true });
  const job = await worker.newJob({ modelName, modelVersion });

  job.start();

  job.on('accepted', async ({ model, clientConfig }) => {
    updateStatus('Accepted into cycle!');

    // TODO: @maddie - Replace all of this with the bandit code, but try to still use the same
    // updateAfterBatch and updateStatus calls... those are helpful for the user to see!
    // // Load MNIST data
    // await loadMnistDataset();
    // const trainDataset = mnist.getTrainData();
    // const data = trainDataset.xs;
    // const targets = trainDataset.labels;

    // // Prepare randomized indices for data batching
    // const indices = Array.from({ length: data.shape[0] }, (v, i) => i);
    // tf.util.shuffle(indices);

    // // Prepare train parameters
    // const batchSize = clientConfig.batch_size;
    // const lr = clientConfig.lr;
    // const numBatches = Math.ceil(data.shape[0] / batchSize);

    // // Calculate total number of model updates
    // // in case none of these options specified, we fallback to one loop
    // // though all batches.
    // const maxEpochs = clientConfig.max_epochs || 1;
    // const maxUpdates = clientConfig.max_updates || maxEpochs * numBatches;
    // const numUpdates = Math.min(maxUpdates, maxEpochs * numBatches);

    // // Copy model to train it
    // let modelParams = [];
    // for (let param of model.params) {
    //   modelParams.push(param.clone());
    // }

    // // Main training loop
    // for (let update = 0, batch = 0, epoch = 0; update < numUpdates; update++) {
    //   // Slice a batch
    //   const chunkSize = Math.min(batchSize, data.shape[0] - batch * batchSize);
    //   const indicesBatch = indices.slice(
    //     batch * batchSize,
    //     batch * batchSize + chunkSize
    //   );
    //   const dataBatch = data.gather(indicesBatch);
    //   const targetBatch = targets.gather(indicesBatch);

    //   // Execute the plan and get updated model params back
    //   let [loss, acc, ...updatedModelParams] = await job.plans[
    //     'training_plan'
    //   ].execute(
    //     job.worker,
    //     dataBatch,
    //     targetBatch,
    //     chunkSize,
    //     lr,
    //     ...modelParams
    //   );

    //   // Use updated model params in the next cycle
    //   for (let i = 0; i < modelParams.length; i++) {
    //     modelParams[i].dispose();
    //     modelParams[i] = updatedModelParams[i];
    //   }

    //   await updateAfterBatch({
    //     epoch,
    //     batch,
    //     accuracy: await acc.array(),
    //     loss: await loss.array()
    //   });

    //   batch++;

    //   // Check if we're out of batches (end of epoch)
    //   if (batch === numBatches) {
    //     batch = 0;
    //     epoch++;
    //   }

    //   // Free GPU memory
    //   acc.dispose();
    //   loss.dispose();
    //   dataBatch.dispose();
    //   targetBatch.dispose();
    // }

    // // Free GPU memory
    // data.dispose();
    // targets.dispose();

    // // TODO protocol execution
    // // job.protocols['secure_aggregation'].execute();

    // // Calc model diff
    // const modelDiff = await model.createSerializedDiff(modelParams);

    // // Report diff
    // await job.report(modelDiff);
    // updateStatus('Cycle is done!');

    // // Try again...
    // if (shouldRepeat) {
    //   setTimeout(startFL, 1000, url, modelName, modelVersion, authToken);
    // }
  });

  job.on('rejected', ({ timeout }) => {
    // Handle the job rejection
    if (timeout) {
      const msUntilRetry = timeout * 1000;

      // Try to join the job again in "msUntilRetry" milliseconds
      updateStatus(`Rejected from cycle, retry in ${timeout}`);
      setTimeout(job.start.bind(job), msUntilRetry);
    } else {
      updateStatus(
        `Rejected from cycle with no timeout, assuming Model training is complete.`
      );
    }
  });

  job.on('error', err => {
    updateStatus(`Error: ${err.message}`);
  });
};

// Status update message
const updateStatus = message => {
  console.log('STATUS', message);
};

// Log statistics after each batch
const updateAfterBatch = async ({ epoch, batch, accuracy, loss }) => {
  console.log(
    `Epoch: ${epoch}`,
    `Batch: ${batch}`,
    `Accuracy: ${accuracy}`,
    `Loss: ${loss}`
  );

  await tf.nextFrame();
};
