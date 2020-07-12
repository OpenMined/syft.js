import React from 'react';
import { render } from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

import App from './app.js';

// =========== bandit helper code ===============
// note, this code here is very similar to the code in the python client notebook
var { jStat } = require('jstat');

var beta_sample = (alpha, beta) => jStat.beta.sample(alpha, beta);

var binomial_sample = accept_rate => (Math.random() < accept_rate ? 1 : 0);

function make_data_for_plot() {
  var N = 100;
  let idx = Array.apply(null, { length: N }).map(Number.call, Number);
  idx = idx.map(x => x / 100);
  let val = idx.map(i => jStat.beta.pdf(i, 20, 80));
  return [idx, val];
}

let arg_max = d =>
  Object.entries(d).filter(el => el[1] == Math.max(...Object.values(d)))[0][0];

class Simulator {
  constructor(rates) {
    this.rates = rates;
    this.action_space = Array(rates.length);
  }
  simulate(idx) {
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
var env = new Simulator([0.1, 0.6, 0.8]);

// ========= end bandit helper code ===============

// Define grid connection parameters
const url = 'ws://localhost:5000';
const modelName = 'bandit_th';
const modelVersion = '1.0.0'; // TODO: @patrick this needs to match what you hosted... 3 option model vs 24 option model etc... usually 2.x.x is for 24 options
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

// intial config
let appConfig = {
  heroBackground: pickValue(appConfigPossibilities.heroBackground),
  buttonPosition: pickValue(appConfigPossibilities.buttonPosition),
  buttonIcon: pickValue(appConfigPossibilities.buttonIcon),
  buttonColor: pickValue(appConfigPossibilities.buttonColor)
};

// All ui options as a flat list
const UIOptions = {
  0: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'arrow',
    buttonColor: 'blue'
  },
  1: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'arrow',
    buttonColor: 'white'
  },
  2: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'user',
    buttonColor: 'blue'
  },
  3: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'user',
    buttonColor: 'white'
  },
  4: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'code',
    buttonColor: 'blue'
  },
  5: {
    heroBackground: 'black',
    buttonPosition: 'hero',
    buttonIcon: 'code',
    buttonColor: 'white'
  },
  6: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'arrow',
    buttonColor: 'blue'
  },
  7: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'arrow',
    buttonColor: 'white'
  },
  8: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'user',
    buttonColor: 'blue'
  },
  9: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'user',
    buttonColor: 'white'
  },
  10: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'code',
    buttonColor: 'blue'
  },
  11: {
    heroBackground: 'black',
    buttonPosition: 'vision',
    buttonIcon: 'code',
    buttonColor: 'white'
  },
  12: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'arrow',
    buttonColor: 'blue'
  },
  13: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'arrow',
    buttonColor: 'white'
  },
  14: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'user',
    buttonColor: 'blue'
  },
  15: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'user',
    buttonColor: 'white'
  },
  16: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'code',
    buttonColor: 'blue'
  },
  17: {
    heroBackground: 'gradient',
    buttonPosition: 'hero',
    buttonIcon: 'code',
    buttonColor: 'white'
  },
  18: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'arrow',
    buttonColor: 'blue'
  },
  19: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'arrow',
    buttonColor: 'white'
  },
  20: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'user',
    buttonColor: 'blue'
  },
  21: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'user',
    buttonColor: 'white'
  },
  22: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'code',
    buttonColor: 'blue'
  },
  23: {
    heroBackground: 'gradient',
    buttonPosition: 'vision',
    buttonIcon: 'code',
    buttonColor: 'white'
  }
};

// time out code
const TIMEOUT = 20000;

let hasSubmittedValue = false;
let action;

const n_options = Object.keys(UIOptions).length;
let pick = Math.floor(Math.random() * n_options); // note: pick is set later in the code (sampled based on model params)
appConfig = UIOptions[pick];

// Set up an event listener for the button when it's clicked
// TODO: @maddie - Submit the diff for a positive button click here...
const onButtonClick = () => {
  if (!hasSubmittedValue) {
    action = 1;
    hasSubmittedValue = true;
    console.log(
      'Clicked the button! Send a positive result for config',
      appConfig
    );
  }
};

// @patrick: this is so I can simulate a no response without waiting by pressing x for the demo
document.addEventListener('keyup', e => {
  if (e.code === 'KeyX') {
    action = 0;
    hasSubmittedValue = true;
    console.log("didn't click, send negative result for config", appConfig);
  }
});

setTimeout(() => {
  action = 0;
  hasSubmittedValue = true;
  console.log("didn't click, send negative result for config", appConfig);
}, TIMEOUT);

window.addEventListener('beforeunload', e => {
  action = 0;
  hasSubmittedValue = true;
  console.log("didn't click, send negative result for config", appConfig);
});

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
    alert('Accepted into cycle!');

    // Copy model to train it.
    let modelParams = [];
    for (let param of model.params) {
      modelParams.push(param.clone());
    }

    let n = 1;
    let alphas = modelParams[2];
    let betas = modelParams[3];
    let samples_from_beta_distr = {};
    console.log('init_____________________, alpha, beta', alphas, betas);

    alphas.array().then(array => console.log('alpha', array));
    betas.array().then(array => console.log('beta', array));

    let ts = 0;

    console.log('init_sample_from_beta', samples_from_beta_distr);

    var alphas_arr = await alphas.array();
    var betas_arr = await betas.array();
    var rwd_vec;
    var sampled_vec;

    for (let i = 1; i < n + 1; i++) {
      // convert to array
      const blank_vec = Array(3).fill(Number(0.0)); // TODO: change 3 to var:n_options, current is 3 because I am testing using a simpler model (only 3 choices)
      rwd_vec = tf.tensor(blank_vec);
      sampled_vec = tf.tensor(blank_vec);

      rwd_vec = await rwd_vec.array();
      sampled_vec = await sampled_vec.array();
      for (let opt = 0; opt < alphas_arr.length; opt++) {
        samples_from_beta_distr[opt] = beta_sample(
          alphas_arr[opt],
          betas_arr[opt]
        );
      }

      let selected_action = arg_max(samples_from_beta_distr);
      pick = selected_action;
      // TODO: @patrick we need to rerender based on the pick here
      // the reason is, if we don't render based on the latest learned params, we won't "gradually show the most optimal UI"
      // maybe setup a "loading screen that explains the exp/demo" for better Ux otherwise user will be shown 2 diff layouts

      // block and wait for user actions, get the value of var action
      // TODO: @patrick this needs to block and wait until we get a user action / aka when hasSubmittedValue becomes True
      // note: you can change this to env.simulate_ui to get a alert that mocks user interactions
      let reward = env.simulate(selected_action);

      rwd_vec[selected_action] = reward;
      sampled_vec[selected_action] = 1;

      console.log(208, 'rwd_vec / sampled_vec', rwd_vec, sampled_vec);

      // conver to tensor
      rwd_vec = tf.tensor(rwd_vec);
      sampled_vec = tf.tensor(sampled_vec);

      let new_alphas, new_betas;
      [new_alphas, new_betas] = await job.plans['training_plan'].execute(
        job.worker,
        rwd_vec,
        sampled_vec,
        alphas,
        betas
      );
      alphas = new_alphas;
      betas = new_betas;
      console.log(`iters_____________________${i}, NEW alpha, beta`);
      alphas.array().then(array => console.log('alpha', array));
      betas.array().then(array => console.log('betas', array));
    }

    console.log('FINAL_____________________, alpha, beta');
    alphas.array().then(array => console.log('alpha', array));
    betas.array().then(array => console.log('beta', array));

    let updated_model_params = modelParams;
    updated_model_params[3] = betas;
    updated_model_params[2] = alphas;
    alphas.print();
    betas.print();
    console.log(
      'final updated_model_params',
      updated_model_params,
      alphas,
      betas
    );

    // @patrick: please leave this here because we may want to update plots
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

    //   // Free GPU memory // model is small enough to not need this
    //   acc.dispose();
    //   loss.dispose();
    //   dataBatch.dispose();
    //   targetBatch.dispose();
    // }

    // // Free GPU memory // model is small enough to not need this
    // data.dispose();
    // targets.dispose();

    // // Report diff
    const modelDiff = await model.createSerializedDiff(updated_model_params);

    await job.report(modelDiff);
    updateStatus('Cycle is done!');

    // Try again...
    if (shouldRepeat) {
      setTimeout(startFL, 1000, url, modelName, modelVersion, authToken);
    }
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
