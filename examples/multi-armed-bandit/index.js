// Import core dependencies
import React from 'react';
import { render } from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

import App from './app.js';

// Include jStat
const { jStat } = require('jstat');

// Status update message
const updateStatus = (message, ...args) =>
  console.log('BANDIT PLAN', message, ...args);

// Define grid connection parameters
const url = 'ws://localhost:5000';
const modelName = 'bandit_th_24';
const modelVersion = '1.0.1';

// Define timeout
const TIMEOUT = 20000;

// Pick random values f.or the layout
const pickValue = p => p[Math.floor(Math.random() * p.length)];

// All possible UI options
const UIOptions = [
  ['black', 'gradient'], // heroBackground
  ['hero', 'vision'], // buttonPosition
  ['arrow', 'user', 'code'], // buttonIcon
  ['blue', 'white'] // buttonColor
]
  .reduce((a, b) =>
    a.reduce((r, v) => r.concat(b.map(w => [].concat(v, w))), [])
  )
  .map(([heroBackground, buttonPosition, buttonIcon, buttonColor]) => ({
    heroBackground,
    buttonPosition,
    buttonIcon,
    buttonColor
  }));

// Pick one of the possible UI's to display to the user
const appConfig = pickValue(UIOptions);

// Has a value already been submitted?
let hasSubmittedValue = false;

const submitPositiveResult = () => {
  if (!hasSubmittedValue) {
    hasSubmittedValue = true;

    console.log(
      'Clicked the button! Send a positive result for config',
      appConfig
    );
  }
};

const submitNegativeResult = () => {
  if (!hasSubmittedValue) {
    hasSubmittedValue = true;

    console.log(
      "Didn't click the button! Send a negative result for config",
      appConfig
    );
  }
};

// When the user clicks the button... send a positive result
const onButtonClick = submitPositiveResult;

// When the user doesn't make a decision for 20 seconds, closes the window, or presses X... send a negative result
setTimeout(submitNegativeResult, TIMEOUT);
window.addEventListener('beforeunload', submitNegativeResult);
document.addEventListener('keyup', e => {
  if (e.code === 'KeyX') submitNegativeResult();
});

// Start React
render(
  <App
    config={appConfig}
    onButtonClick={onButtonClick}
    start={() => startFL(url, modelName, modelVersion)}
  />,
  document.getElementById('root')
);

// Main start method
const startFL = async (url, modelName, modelVersion, authToken = null) => {
  // TODO: @patrick: Not sure what this simulator class does...
  class Simulator {
    constructor(rates) {
      this.rates = rates;
      this.action_space = Array(rates.length);
    }

    simulate(idx) {
      const binomial_sample = accept_rate =>
        Math.random() < accept_rate ? 1 : 0;

      let choice = binomial_sample(this.rates[idx]);

      console.log(`simulated ${choice} for UI${idx}`);

      return choice;
    }

    simulate_ui(idx) {
      let choice = prompt(`showing UI${Number(idx) + 1}`, '1 for y, 0 for no');

      return Number(choice);
    }
  }

  // TODO: @patrick: this is current hard coded to 3 values, please feel free to replace with a list (length = matching the number of options) of generated probabilities >0 && <1
  // I recommend making 1 or 2 options much higher than the others for ease of testing
  const env = new Simulator([0.1, 0.6, 0.8]);

  // Define the worker and the job
  const worker = new Syft({ url, authToken, verbose: true });
  const job = await worker.newJob({ modelName, modelVersion });

  // Immediately start the cycle
  updateStatus('Starting job request...');
  job.start();

  // When we've been accepted into the cycle...
  job.on('accepted', async ({ model }) => {
    updateStatus('Accepted into cycle!');

    // Arg max function
    const argMax = d =>
      Object.entries(d).filter(
        el => el[1] == Math.max(...Object.values(d))
      )[0][0];

    // Copy model params
    let modelParams = [];
    for (let param of model.params) {
      modelParams.push(param.clone());
    }
    updateStatus('Copying model params');

    // Get alphas and betas from model params
    let alphas = modelParams[2];
    let betas = modelParams[3];
    updateStatus('Getting alphas and betas from model params', alphas, betas);

    // Convert them to an array
    const alphasArray = await alphas.array();
    const betasArray = await betas.array();
    updateStatus(
      'Concerted alphas and betas into an array',
      alphasArray,
      betasArray
    );

    // Create an array to hold samples from the beta distribution
    const samplesFromBetaDist = [];

    // Create a reward and sample vector
    let rewardVector;
    let sampledVector;

    // Define the number of samples
    const numSamples = 1;

    for (let i = 1; i <= numSamples; i++) {
      updateStatus(`Entering outer loop for ${i} time`);

      const blankVector = tf.zeros([UIOptions.length], 'float32');
      updateStatus('Creating a blank vector', blankVector);

      rewardVector = await blankVector.array();
      sampledVector = await blankVector.array();
      updateStatus(
        'Setting it as the reward and sampled vector, and converting those to arrays',
        rewardVector,
        sampledVector
      );

      for (let opt = 0; opt < alphasArray.length; opt++) {
        updateStatus(`Entering inner loop for ${opt} time`);

        samplesFromBetaDist[opt] = jStat.beta.sample(
          alphasArray[opt],
          betasArray[opt]
        );

        updateStatus('Got samples from beta distribution', samplesFromBetaDist);
      }

      // TODO: @patrick we need to rerender based on the pick here
      // The reason is, if we don't render based on the latest learned params, we won't "gradually show the most optimal UI"
      // Maybe setup a "loading screen that explains the exp/demo" for better UX otherwise user will be shown 2 diff layouts
      let selectedAction = argMax(samplesFromBetaDist);
      updateStatus('Have the desired selected action', selectedAction);

      // TODO: @patrick this needs to block and wait until we get a user action / aka when hasSubmittedValue becomes True
      // Note: you can change this to env.simulate_ui to get a alert that mocks user interactions
      let reward = env.simulate(selectedAction);
      updateStatus('Simulate the reward', reward);

      rewardVector[selectedAction] = reward;
      sampledVector[selectedAction] = 1;
      updateStatus(
        'New reward and sampled vector (1)',
        rewardVector,
        sampledVector
      );

      rewardVector = tf.tensor(rewardVector);
      sampledVector = tf.tensor(sampledVector);
      updateStatus(
        'New reward and sampled vector (2)',
        rewardVector,
        sampledVector
      );

      const [newAlphas, newBetas] = await job.plans['training_plan'].execute(
        job.worker,
        rewardVector,
        sampledVector,
        alphas,
        betas
      );

      updateStatus('Plan executed', newAlphas, newBetas);

      alphas = newAlphas;
      betas = newBetas;
      updateStatus('Resetting alphas and betas', alphas, betas);
    }

    let updatedModelParams = modelParams;

    updatedModelParams[2] = alphas;
    updatedModelParams[3] = betas;
    updateStatus('Setting updated model params', updatedModelParams);

    // Report diff
    const modelDiff = await model.createSerializedDiff(updatedModelParams);
    await job.report(modelDiff);
    updateStatus('Reported diff');

    updateStatus('Cycle is done!');
  });

  // When we've been rejected from the cycle...
  job.on('rejected', ({ timeout }) => {
    // Handle the job rejection
    if (timeout) {
      const msUntilRetry = timeout * 1000;

      // Try to join the job again in "msUntilRetry" milliseconds
      updateStatus(`Rejected from cycle, retry in ${timeout}`);

      setTimeout(job.start.bind(job), msUntilRetry);
    } else {
      updateStatus(
        `Rejected from cycle with no timeout, assuming model training is complete.`
      );
    }
  });

  // When there's an error in the cycle...
  job.on('error', err => {
    updateStatus(`Error: ${err.message}`, err);
  });
};
