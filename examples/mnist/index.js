import * as tf from '@tensorflow/tfjs-core';
import { Syft, PlanInputSpec, PlanOutputSpec } from '@openmined/syft.js';
import { MnistData } from './mnist';

const gridServer = document.getElementById('grid-server');
const startButton = document.getElementById('start');
let mnist = null;

startButton.onclick = () => {
  setFLUI();
  const modelName = document.getElementById('model-id').value;
  const modelVersion = document.getElementById('model-version').value;
  const authToken = document.getElementById('auth-token').value;
  startFL(gridServer.value, modelName, modelVersion, authToken).catch((err) => {
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
  const worker = new Syft({ url, verbose: true });
  const job = worker.newJob({ modelName, modelVersion, authToken });

  // Load MNIST data.
  await loadMnistDataset();
  const trainDataset = mnist.getTrainData();

  job.request();

  job.on('accepted', async ({ model }) => {
    updateStatus('Accepted into cycle!');

    // Shuffle dataset.
    // TODO replace with Dataloader API
    updateStatus('Shuffling MNIST data...');
    const indices = Array.from(tf.util.createShuffledIndices(trainDataset.xs.shape[0]));
    const data = trainDataset.xs.gather(indices);
    const target = trainDataset.labels.gather(indices);
    updateStatus('MNIST data shuffled.');

    const training = job.train('training_plan', {
      inputs: [
        new PlanInputSpec(PlanInputSpec.TYPE_DATA),
        new PlanInputSpec(PlanInputSpec.TYPE_TARGET),
        new PlanInputSpec(PlanInputSpec.TYPE_BATCH_SIZE),
        new PlanInputSpec(PlanInputSpec.TYPE_CLIENT_CONFIG_PARAM, 'lr'),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W1', 0),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b1', 1),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'W2', 2),
        new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'b2', 3),
      ],
      outputs: [
        new PlanOutputSpec(PlanOutputSpec.TYPE_LOSS),
        new PlanOutputSpec(PlanOutputSpec.TYPE_METRIC, 'accuracy'),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W1', 0),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b1', 1),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'W2', 2),
        new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'b2', 3),
      ],
      data,
      target
    });

    training.on('batchEnd', updateUIAfterBatch);

    training.on('end', async () => {
      // Free GPU memory.
      data.dispose();
      target.dispose();

      // TODO protocol execution
      // job.protocols['secure_aggregation'].execute();

      // Calc model diff.
      const modelDiff = await model.createSerializedDiffFromModel(training.currentModel);

      // Report diff.
      await job.report(modelDiff);
      updateStatus('Cycle is done!');

      // Try again.
      if (doRepeat()) {
        setTimeout(startFL, 1000, url, modelName, modelVersion, authToken);
      }
    });
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

  job.on('error', (err) => {
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
const updateStatus = (message) => {
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
 */
const updateUIAfterBatch = ({ epoch, batch, loss, metrics }) => {
  const accuracy = metrics['accuracy'];
  console.log(
    `Epoch: ${epoch}, Batch: ${batch}, Accuracy: ${accuracy}, Loss: ${loss}`
  );
  Plotly.extendTraces('loss_graph', { y: [[loss]] }, [0]);
  Plotly.extendTraces('acc_graph', { y: [[accuracy]] }, [0]);
};

const doRepeat = () => document.getElementById('worker-repeat').checked;
