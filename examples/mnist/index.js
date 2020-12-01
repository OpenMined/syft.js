import * as tf from '@tensorflow/tfjs-core';
import { Syft, PlanInputSpec, PlanOutputSpec, data } from '@openmined/syft.js';
import { MnistDataset } from './mnist-dataset';
import { retrieveCheckpoint, storeCheckpoint } from './checkpoint';

const gridServer = document.getElementById('grid-server');
const startButton = document.getElementById('start');
const startFromCheckpointButton = document.getElementById('start-from-checkpoint');
const stopButton = document.getElementById('stop-training');
const stopAndSaveButton = document.getElementById('stop-training-and-save');
const stopAndSaveMessage = document.getElementById('saved-checkpoint');
const resumeFromTrainerButton = document.getElementById('resume-training-from-trainer');

/**
 * Keeps current training object.
 * @type {PlanTrainer}
 */
let training = null;

// Check for checkpoint
const checkpoint = retrieveCheckpoint('checkpoint');
if (checkpoint) {
  startFromCheckpointButton.disabled = false;
}

const startClickHandler = (useCheckpoint = false) => {
  setFLUI();
  const modelName = document.getElementById('model-id').value;
  const modelVersion = document.getElementById('model-version').value;
  const authToken = document.getElementById('auth-token').value;
  startFL(
    gridServer.value,
    modelName,
    modelVersion,
    authToken,
    useCheckpoint ? checkpoint : undefined
  ).catch((err) => {
    updateStatus(`Error: ${err}`);
  });
}

// Assign actions to buttons
startButton.onclick = () => startClickHandler();
startFromCheckpointButton.onclick = () => startClickHandler(true);
stopButton.onclick = () => training.stop();
resumeFromTrainerButton.onclick = () => training.resume();
stopAndSaveButton.onclick = async () => {
  const checkpoint = await training.stop();
  await storeCheckpoint('checkpoint', checkpoint);
  updateStatus('Checkpoint is saved in local storage');
  stopAndSaveMessage.style.display = 'block';
}

/**
 * The main federated learning training routine
 * @param {string} url - PyGrid Url
 * @param {string} modelName - Federated learning model name hosted in PyGrid
 * @param {string} modelVersion - Federated learning model version
 * @param {string} [authToken] - Optional authentication token
 * @param {PlanTrainerCheckpoint} [checkpoint] - Optional training checkpoint
 * @returns {Promise<void>}
 */
const startFL = async (url, modelName, modelVersion, authToken = null, checkpoint = null) => {
  const worker = new Syft({ url, verbose: true });
  const job = worker.newJob({ modelName, modelVersion, authToken });

  // Load MNIST data.
  const transform = new data.transform.core.Compose([
    new data.transform.tfjs.ToTensor({type: 'float32'}, {type: 'int32'}),
    new data.transform.tfjs.Normalize({mean: [0.1307 * 255], std: [0.3081 * 255]}),
    new data.transform.tfjs.OneHot(null, {depth: 10, squeeze: true}),
  ]);
  const mnistDataset = new MnistDataset({train: true, transform});
  await mnistDataset.load();

  job.request();

  job.on('accepted', async ({ clientConfig, model }) => {
    updateStatus('Accepted into cycle!');

    const mnistLoader = new data.DataLoader({
      dataset: mnistDataset,
      batchSize: clientConfig.batch_size,
    });

    training = job.train('training_plan', {
      checkpoint,
      inputs: [
        new PlanInputSpec(PlanInputSpec.TYPE_DATA, null, 0),
        new PlanInputSpec(PlanInputSpec.TYPE_DATA, null, 1),
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
      data: mnistLoader,
    });

    training.on('start', () => {
      resumeFromTrainerButton.disabled = true;
      stopButton.disabled = false;
      stopAndSaveButton.disabled = false;
      updateStatus('Training is started!');
    });

    training.on('batchEnd', updateUIAfterBatch);

    training.on('stop', () => {
      resumeFromTrainerButton.disabled = false;
      stopButton.disabled = true;
      stopAndSaveButton.disabled = true;
      updateStatus('Training is stopped');
    });

    training.on('end', async () => {
      resumeFromTrainerButton.disabled = true;
      stopButton.disabled = true;
      stopAndSaveButton.disabled = true;

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
