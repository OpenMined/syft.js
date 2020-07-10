import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';
import { MnistData } from './mnist';

const gridServer = document.getElementById('grid-server');
const startButton = document.getElementById('start');
let mnist = null;

startButton.onclick = () => {
  setFLUI();
  const modelName = document.getElementById('model-id').value;
  const modelVersion = document.getElementById('model-version').value;
  const authToken = document.getElementById('auth-token').value;
  startFL(gridServer.value, modelName, modelVersion, authToken).catch(err => {
    updateStatus(`Error: ${err}`);
  });
};

/**
 * The main federated learning training routine
 * @param url PyGrid Url
 * @param modelName Federated learning model name hosted in PyGrid
 * @param modelVersion Federated learning model version
 * @returns {Promise<void>}
 */
const startFL = async (url, modelName, modelVersion, authToken = null) => {
  const worker = new Syft({ url, authToken, verbose: true });
  const job = await worker.newJob({ modelName, modelVersion });

  job.start();

  job.on('accepted', async ({ model, clientConfig }) => {
    updateStatus('Accepted into cycle!');

    // Load MNIST data
    await loadMnistDataset();
    const trainDataset = mnist.getTrainData();
    const data = trainDataset.xs;
    const targets = trainDataset.labels;

    // Prepare randomized indices for data batching.
    const indices = Array.from({ length: data.shape[0] }, (v, i) => i);
    tf.util.shuffle(indices);

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

    // Copy model to train it.
    let modelParams = [];
    for (let param of model.params) {
      modelParams.push(param.clone());
    }

    // Main training loop.
    for (let update = 0, batch = 0, epoch = 0; update < numUpdates; update++) {
      // Slice a batch.
      const chunkSize = Math.min(batchSize, data.shape[0] - batch * batchSize);
      const indicesBatch = indices.slice(
        batch * batchSize,
        batch * batchSize + chunkSize
      );
      const dataBatch = data.gather(indicesBatch);
      const targetBatch = targets.gather(indicesBatch);

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
        accuracy: await acc.array(),
        loss: await loss.array()
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

    // Free GPU memory.
    data.dispose();
    targets.dispose();

    // TODO protocol execution
    // job.protocols['secure_aggregation'].execute();

    // Calc model diff.
    const modelDiff = await model.createSerializedDiff(modelParams);

    // Report diff.
    await job.report(modelDiff);
    updateStatus('Cycle is done!');

    // Try again.
    if (doRepeat()) {
      setTimeout(startFL, 1000, url, modelName, modelVersion, authToken);
    }
  });

  job.on('rejected', ({ timeout }) => {
    // Handle the job rejection.
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

/**
 * Loads MNIST dataset into global variable `mnist`.
 */
const loadMnistDataset = async () => {
  if (!mnist) {
    updateStatus('Loading MNIST data...');
    mnist = new MnistData();
    await mnist.load();
    updateStatus('MNIST data loaded.');
  }
};

/**
 * Log message on the page.
 * @param message
 */
const updateStatus = message => {
  const cont = document.getElementById('status');
  cont.innerHTML = message + '<br>' + cont.innerHTML;
};

/**
 * Initializes loss & accuracy plots.
 */
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

/**
 * Updates graphs after each batch.
 * @param epoch
 * @param batch
 * @param accuracy
 * @param loss
 * @returns {Promise<void>}
 */
const updateUIAfterBatch = async ({ epoch, batch, accuracy, loss }) => {
  console.log(
    `Epoch: ${epoch}, Batch: ${batch}, Accuracy: ${accuracy}, Loss: ${loss}`
  );
  Plotly.extendTraces('loss_graph', { y: [[loss]] }, [0]);
  Plotly.extendTraces('acc_graph', { y: [[accuracy]] }, [0]);
  await tf.nextFrame();
};

const doRepeat = () => document.getElementById('worker-repeat').checked;
