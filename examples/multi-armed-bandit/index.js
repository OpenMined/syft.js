import React from 'react';
import { render } from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

import App from './app.js';

// //bandit helpers~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function fake_bandit(rwd, sample, alpha, beta) {
  console.log(84, rwd, sample, alpha, beta);
  alpha[0] = alpha[0] + 1;
  beta[0] = beta[0] + 2;
  return [alpha, beta];
}

var { jStat } = require('jstat');

var beta_sample = (alpha, beta) => jStat.beta.sample(alpha, beta);

var binomial_sample = accept_rate => (Math.random() < accept_rate ? 1 : 0);

// console.log(beta_sample(200,800), binomial_sample(.5))

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
var env = new Simulator([0.1, 0.6, 0.8]);
// let exp_rig = (n, _bandit_plan, _model_param) => {
//   let alphas = _model_param[2];
//   let betas = _model_param[3];
//   let samples_from_beta_distr = {};

//   let ts = 0;

//   console.log(1, samples_from_beta_distr);

//   for (i = 0; i < n + 1; i++) {
//     for (opt = 0; opt < alphas.length; opt++) {
//       rwd_vec = [0, 0, 0];
//       sampled_vec = [0, 0, 0];
//       samples_from_beta_distr[opt] = beta_sample(alphas[opt], betas[opt]);
//       selected_action = arg_max(samples_from_beta_distr);
//       //Math.max(samples_from_beta_distr, key=samples_from_beta_distr.get)
//       reward = env.simulate_ui(selected_action);
//       console.log(2, samples_from_beta_distr);
//       console.log(3, selected_action);
//       console.log(4, reward);
//       rwd_vec[selected_action] = reward;
//       sampled_vec[selected_action] = (1)
//       [
//         // console.log(sampled_vec, rwd_vec)
//         (alphas, betas)
//       ] = _bandit_plan(rwd_vec, sampled_vec, alphas, betas);
//       console.log('999999999999999, iter', i);
//       alphas.array().then(array => console.log('alpha', array));
//       beta_sample.array().then(array => console.log('alpha', array));
//     }
//   }
//   console.log('FINAL_____________________, alpha, beta');
//   alphas.array().then(array => console.log('alpha', array));
//   beta_sample.array().then(array => console.log('alpha', array));
//   return [alphas, betas];
// };

// //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Define grid connection parameters
const url = 'ws://localhost:5000';
const modelName = 'bandit_th';
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

// // Final configuration for the app
let appConfig = {
  heroBackground: pickValue(appConfigPossibilities.heroBackground),
  buttonPosition: pickValue(appConfigPossibilities.buttonPosition),
  buttonIcon: pickValue(appConfigPossibilities.buttonIcon),
  buttonColor: pickValue(appConfigPossibilities.buttonColor)
};

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
let pick;
let action;

pick = Math.floor(Math.random() * Object.keys(UIOptions).length);
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
    console.log(155, 'new model params', model, model.params);

    // TODO: @maddie - Replace all of this with the bandit code, but try to still use the same
    // updateAfterBatch and updateStatus calls... those are helpful for the user to see!

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
      console.log(177, i, rwd_vec, sampled_vec);
      // convert to array
      rwd_vec = tf.tensor([0.0, 0.0, 0.0]);
      sampled_vec = tf.tensor([0.0, 0.0, 0.0]);

      rwd_vec = await rwd_vec.array();
      sampled_vec = await sampled_vec.array();
      console.log(179, alphas_arr.length);
      for (let opt = 0; opt < alphas_arr.length; opt++) {
        samples_from_beta_distr[opt] = beta_sample(
          alphas_arr[opt],
          betas_arr[opt]
        );
      }
      console.log(
        'init_sample_from_beta',
        'before max',
        samples_from_beta_distr
      );
      let selected_action = arg_max(samples_from_beta_distr);
      pick = selected_action;
      alert('pick', pick);
      // TODO: @patrick we need to rerender based on the pick here
      // maybe setup a loading screen for better UI otherwise user will be shown 2 layouts

      // block and wait for user actions, get the value of var action
      let reward = env.simulate(selected_action); // action

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
    const modelDiff = await model.createSerializedDiff(updated_model_params);

    await job.report(modelDiff);
    updateStatus('Cycle is done!');

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
