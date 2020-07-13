// Import core dependencies
import React from 'react';
import { render, hydrate } from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

import App from './app.js';
let _sim = 1;

// Include jStat
const { jStat } = require('jstat');

// Status update message
const updateStatus = (message, ...args) =>
  console.log('BANDIT PLAN', message, ...args);

// Define grid connection parameters
const url = 'ws://localhost:5000';
const modelName = 'bandit_th_24';
const modelVersion = '1.0.3';

// All possible UI options
const allUIOptions = [
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

// bandit simulator helper code

const binomial_sample = accept_rate => (Math.random() < accept_rate ? 1 : 0);

class Simulator {
  constructor(rates) {
    this.rates = rates;
    this.action_space = Array(rates.length);
  }
  simulate(idx) {
    let choice = binomial_sample(this.rates[idx]);
    console.log(
      `simulated ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ reward: ${choice} for UI: ${idx}`
    );
    return choice;
  }
  simulate_ui(idx) {
    let choice = prompt(`showing UI${Number(idx) + 1}`, '1 for y, 0 for no');
    return Number(choice);
  }
}
const simulated_rates = Array.from({ length: 24 }, () =>
  Math.min(Math.abs(Math.random() - Math.random() / 10), 0.77)
);
simulated_rates[9] = 0.85;
const env = new Simulator(simulated_rates);

// User action promise, gotta wait for the user to do something!
let userActionPromiseResolve;
const userActionPromise = new Promise(resolve => {
  userActionPromiseResolve = resolve;
});

// Has a value already been submitted?
let hasSubmittedValue = false;

// When the user clicks the button...
const submitPositiveResult = () => {
  if (!hasSubmittedValue) {
    hasSubmittedValue = true;
    userActionPromiseResolve(true);
  }
};

// When the user doesn't click the button...
const submitNegativeResult = config => {
  if (!hasSubmittedValue) {
    hasSubmittedValue = true;
    userActionPromiseResolve(false);
  }
};

// When the user doesn't make a decision for 20 seconds, closes the window, or presses X... send a negative result
setTimeout(submitNegativeResult, 20000);
window.addEventListener('beforeunload', submitNegativeResult);
document.addEventListener('keyup', e => {
  if (e.code === 'KeyX') submitNegativeResult();
});

// Define React root elem
const ROOT = document.getElementById('root');

// Start React
render(
  <App
    isLoaded={false}
    onButtonClick={submitPositiveResult}
    start={() => startFL(url, modelName, modelVersion)}
  />,
  ROOT
);

// Main start method
const startFL = async (url, modelName, modelVersion, authToken = null) => {
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
      'Converted alphas and betas into an array',
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

    // For each sample...
    for (let i = 1; i <= numSamples; i++) {
      // Set the reward and sampled vectors to be a big array of zeros
      rewardVector = await tf.zeros([allUIOptions.length], 'float32').array();
      sampledVector = await tf.zeros([allUIOptions.length], 'float32').array();
      updateStatus(
        'Setting the reward and sampled vectors to zeros, and converting those to arrays',
        rewardVector,
        sampledVector
      );

      // For each option...
      for (let opt = 0; opt < alphasArray.length; opt++) {
        // Get a beta distribution between the alphas and betas
        samplesFromBetaDist[opt] = jStat.beta.sample(
          alphasArray[opt],
          betasArray[opt]
        );

        updateStatus('Got samples from beta distribution', samplesFromBetaDist);
      }

      // Get the option that the user should be loading...
      let selectedOption = argMax(samplesFromBetaDist);
      updateStatus('Have the desired selected option', selectedOption);

      // Render that option
      hydrate(
        <App
          isLoaded={true}
          config={allUIOptions[selectedOption]}
          onButtonClick={submitPositiveResult}
          start={() => startFL(url, modelName, modelVersion)}
        />,
        ROOT
      );
      updateStatus(
        'Re-rendered the React application with config',
        allUIOptions[selectedOption]
      );

      updateStatus('Waiting on user input...');

      // Wait on user input...
      if (_sim) {
        const simulated_result = env.simulate(selectedOption);
        if (simulated_result == 1) {
          submitPositiveResult();
        } else {
          submitNegativeResult();
        }
      }
      const clicked = await userActionPromise;

      // If they clicked, set the reward value for this option to be a 1, otherwise it's a 0
      const reward = clicked ? 1 : 0;

      updateStatus('User input is...', clicked);

      // Set the reward and sampled vectors to be the appropriate values
      rewardVector[selectedOption] = reward;
      sampledVector[selectedOption] = 1;

      // And turn them into tensors
      rewardVector = tf.tensor(rewardVector);
      sampledVector = tf.tensor(sampledVector);
      updateStatus(
        'New reward and sampled vector',
        rewardVector,
        sampledVector
      );

      // Execute the plan and get the resulting alphas and betas
      const [newAlphas, newBetas] = await job.plans['training_plan'].execute(
        job.worker,
        rewardVector,
        sampledVector,
        alphas,
        betas
      );
      updateStatus('Plan executed', newAlphas, newBetas);

      // Reset the old alphas and betas to the new alphas and betas
      alphas = newAlphas;
      betas = newBetas;
      updateStatus('Resetting alphas and betas', alphas, betas);
    }

    // Set the updated model params to be the new ones
    let updatedModelParams = modelParams;

    updatedModelParams[2] = alphas;
    updatedModelParams[3] = betas;
    updateStatus('Setting updated model params', updatedModelParams);
    const final_alphas = await alphas.array();
    const final_betas = await betas.array();
    updateStatus('final updated alphas', final_alphas);
    updateStatus('final updated betas', final_betas);

    // And report the diff back to PyGrid
    const modelDiff = await model.createSerializedDiff(updatedModelParams);
    await job.report(modelDiff);
    updateStatus('Reported diff');

    // Finished!
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
