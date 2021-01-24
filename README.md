<img src="art/fake-logo.png" alt="syft.js logo" width="200" />

![Build](https://img.shields.io/github/workflow/status/OpenMined/syft.js/Run%20tests%20and%20coverage)
![codecov](https://img.shields.io/codecov/c/github/OpenMined/syft.js)
![npm](https://img.shields.io/npm/v/@openmined/syft.js)
![GitHub](https://img.shields.io/github/license/OpenMined/syft.js.svg)
![OpenCollective](https://img.shields.io/opencollective/all/openmined)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Syft.js

Syft.js is the “web” part of the [OpenMined](https://openmined.org)'s open-source ecosystem for [federated learning](https://ai.googleblog.com/2017/04/federated-learning-collaborative.html),
which currently spans across web, [iOS](https://github.com/OpenMined/SwiftSyft), [Android](https://github.com/OpenMined/KotlinSyft), and [servers/IoT](https://github.com/OpenMined/PySyft).

Syft.js has following core features:

- :hammer_and_wrench: Integration with PyGrid federated learning API.
- :gear: **Training and inference** of any PySyft model written in PyTorch or TensorFlow.
- :bust_in_silhouette: Allows all data to stay on the user's device.
- :lock: Support for **secure multi-party computation** and **secure aggregation** protocols using **peer-to-peer WebRTC** connections (_in progress_).

The library is built on top of [TensorFlow.js](https://js.tensorflow.org/).

There are a variety of additional privacy-preserving protections that may be applied, including [differential privacy](https://towardsdatascience.com/understanding-differential-privacy-85ce191e198a), [muliti-party computation](https://www.inpher.io/technology/what-is-secure-multiparty-computation), and [secure aggregation](https://research.google/pubs/pub45808/).

If you want to know how scalable federated systems are built, [Towards Federated Learning at Scale](https://arxiv.org/pdf/1902.01046.pdf) is a fantastic introduction!

## Installation

Note that syft.js needs Tensorflow.js library as peer dependency.

If you're using a package manager like NPM:

```text
npm install --save @openmined/syft.js @tensorflow/tfjs-core
```

Or if Yarn is your cup of tea:

```text
yarn add @openmined/syft.js @tensorflow/tfjs-core
```

If you're not using a package manager, you will be able to include Syft.js within a `<script>` tag.
In this case [library classes](API-REFERENCE.md) will be available under `syft` global object.

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2.5/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@openmined/syft.js@latest/dist/index.min.js"></script>

<script type="text/javascript">
  // Create syft worker
  const worker = syft.Syft({...});
  ...
</script>
```

## Quick Start

As a developer, there are few steps to building your own secure federated learning system upon the OpenMined infrastructure:

1. :robot: [Develop ML model and training procedure](https://github.com/OpenMined/PyGrid/blob/dev/examples/model-centric/01-Create-plan.ipynb) (aka `Plan` in PySyft terminology) using PySyft.
1. :earth_americas: Host model and Plans on [PyGrid](https://github.com/OpenMined/PyGrid), which will deal with all the federated learning components of your pipeline.
1. :tada: Execute the training on the variety of end-user devices using the client library (syft.js, [SwiftSyft](https://github.com/OpenMined/SwiftSyft), [KotlinSyft](https://github.com/OpenMined/KotlinSyft), [PySyft](https://github.com/OpenMined/PySyft)).
1. :lock: Securely aggregate trained user models in PyGrid.

**:notebook: The entire workflow and process is described in greater detail in the [Web & Mobile Federated Learning project roadmap](https://github.com/OpenMined/Roadmap/blob/master/federated_learning/projects/model_centric_fl.md).**

Syft.js provides minimalistic API to communicate with federated learning PyGrid endpoints
and execute PySyft's Plans in a browser.
The federated learning cycle implemented with syft.js would contain following steps:

- Register into training cycle on PyGrid.
- Download required model and Plans from PyGrid.
- Execute the Plan with given model parameters and local user's data (multiple times) to create better model.
- Submit difference between original and trained model parameters for aggregation.

These steps can be expressed in the following code:

```javascript
import * as tf from '@tensorflow/tfjs-core';
import { Syft } from '@openmined/syft.js';

const gridUrl = 'ws://pygrid.myserver.com:5000';
const modelName = 'my-model';
const modelVersion = '1.0.0';

// if the model is protected with authentication token (optional)
const authToken = '...';

const worker = new Syft({ gridUrl, verbose: true });
const job = await worker.newJob({ modelName, modelVersion, authToken });
job.request();

job.on('accepted', async ({ model, clientConfig }) => {
  const batchSize = clientConfig.batch_size;
  const lr = clientConfig.lr;

  // Load data.
  const [data, target] = LOAD_DATA();
  const batches = MAKE_BATCHES(data, target, batchSize);

  // Load model parameters.
  let modelParams = model.params.map((p) => p.clone());

  // Main training loop.
  for (let [dataBatch, targetBatch] of batches) {
    // NOTE: this is just one possible example.
    // Plan name (e.g. 'training_plan'), its input arguments and outputs depends on FL configuration and actual Plan implementation.
    let updatedModelParams = await job.plans['training_plan'].execute(
      job.worker,
      dataBatch,
      targetBatch,
      batchSize,
      lr,
      ...modelParams
    );

    // Use updated model params in the next iteration.
    for (let i = 0; i < modelParams.length; i++) {
      modelParams[i].dispose();
      modelParams[i] = updatedModelParams[i];
    }
  }

  // Calculate & send model diff.
  const modelDiff = await model.createSerializedDiff(modelParams);
  await job.report(modelDiff);
});

job.on('rejected', ({ timeout }) => {
  // Handle the job rejection, e.g. re-try after timeout.
});

job.on('error', (err) => {
  // Handle errors.
});
```

### Model Training API

The Plan execution and Model training can be implemented easier 
using training helper that will do training loop for you 
(model, batch size, etc. are automatically taken from `Job`):

```javascript
  // Main training loop.
  const training = job.train('training_plan', {
    inputs: [/* ... */],
    outputs: [/* ... */],
    data,
    target,
  });

  training.on('end', async () => {
      // Calculate & send model diff.
      const modelDiff = await model.createSerializedDiff(modelParams);
      await job.report(modelDiff);
  });
```

`inputs` and `outputs` need to be specified using `PlanInputSpec` and `PlanOutputSpec` 
and need to match with Plan's arguments and outputs.
For example, if the Plan has following arguments and outputs:
```
loss, accuracy, modelParams1, modelParams2, modelParams3, modelParams4 = 
    plan(dataBatch, targetBatch, batchSize, lr, modelParams1, modelParams2, modelParams3, modelParams4)
```

Corresponding `inputs`, `outputs` in job.train will be:
```javascript
const inputs = [
    new PlanInputSpec(PlanInputSpec.TYPE_DATA),
    new PlanInputSpec(PlanInputSpec.TYPE_TARGET),
    new PlanInputSpec(PlanInputSpec.TYPE_BATCH_SIZE),
    new PlanInputSpec(PlanInputSpec.TYPE_CLIENT_CONFIG_PARAM, 'lr'),
    new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'param1', 0),
    new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'param2', 1),
    new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'param3', 2),
    new PlanInputSpec(PlanInputSpec.TYPE_MODEL_PARAM, 'param4', 3),
];

const outputs = [
    new PlanOutputSpec(PlanOutputSpec.TYPE_LOSS),
    new PlanOutputSpec(PlanOutputSpec.TYPE_METRIC, 'accuracy'),
    new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'param1', 0),
    new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'param2', 1),
    new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'param3', 2),
    new PlanOutputSpec(PlanOutputSpec.TYPE_MODEL_PARAM, 'param4', 3),
];
```

### Stop & Resume
`PlanTrainer` allows stopping and resuming the training using `stop` and `resume` methods:

```javascript
  // Main training loop.
  const training = job.train('training_plan', {
    inputs: [/* ... */],
    outputs: [/* ... */],
    data,
    target,
  });

  training.on('start', () => {
    // training is started!
  });

  training.on('stop', () => {
    // training is stopped!
  });

  document.getElementById('stop-button').onclick = () => {
    training.stop();
  };

  document.getElementById('resume-button').onclick = () => {
    training.resume();
  };
```

### Checkpointing

`stop` method returns current training state as `PlanTrainerCheckpoint` object, 
which can be serialized to JSON to restored from JSON later to continue the training:

```javascript
const checkpoint = await training.stop();
const checkpointJson = await checkpoint.toJSON();
const checkpointJsonString = JSON.stringify(checkpointJson);
localStorage.setItem('checkpoint', checkpointJsonString);

// ... checkpoint can survive page reload ...

const checkpointJsonString = localStorage.getItem('checkpoint');
const checkpointJson = JSON.parse(checkpointJsonString);
const checkpoint = PlanTrainerCheckpoint.fromJSON(worker, checkpointJson);
    
// Main training loop.
const training = job.train('training_plan', {
  // Pass checkpoint into train method to resume from it
  // NOTE: checkpoint doesn't store Plan and training data, these still need to be supplied
  checkpoint,
  inputs: [/* ... */],
  outputs: [/* ... */],
  data,
  target,
});
```

Checkpoint can be created directly from `PlanTrainer` object 
using `createCheckpoint` method and applied back using `applyCheckpoint`:
```javascript
const checkpoint = training.createCheckpoint();
// ...
training.applyCheckpoint(checkpoint);
training.resume();
```

### Dataset / DataLoader API
One way to provide training data into `PlanTrainer` is 
to prepare and pass `data` and `target` parameters as plain `tf.Tensor`'s. 
Another way is to use `Dataset` and `DataLoader` classes, 
which are simplified version of PyTorch's implementation. 

`Dataset` class needs to be extended to implement element-wise access to the data. 
Resulting dataset is used with `DataLoader` that handles shuffling and batching of dataset elements.  
The `DataLoader` can passed as `data` parameter into the `PlanTrainer`.

```javascript
class MyDataset extends data.Dataset {
  
  constructor() {
    super();
    // this.data = ...;
    // this.target = ...;
  }

  getItem(index) {
    return [
      this.data[index],
      this.target[index]
    ];
  }

  get length() {
    return this.data.length;
  }
}

const dataset = new MyDataset();
const dl = new DataLoader({dataset, batchSize: 64, shuffle: true});

// Use with PlanTrainer
const training = job.train('training_plan', {
    inputs: [/* ... */],
    outputs: [/* ... */],
    data: dl
});

// Or use with custom training loop
for (const [data, target] of dl) {
  // ...
}
```

MNIST example has implementation of MNIST dataset based on `Dataset` class 
and `DataLoader` usage and additionally introduces data transformations using `Transform`.

### API Documentation

See [API Documentation](API-REFERENCE.md) for complete reference.

## Running the Demo App

The “Hello World” syft.js demo is MNIST training example located in `examples/mnist` folder.
It demonstrates how a simple neural net model created in PySyft can be trained in a browser
and the result of training averaged from multiple federated learning participants.

<img src="art/mnist-demo-ani.gif" alt="syft.js MNIST demo animation" />

Running the demo is multi-stage and multi-component process
(as the federated learning itself).

Below are example instructions that assume you
want to put everything under `~/fl-demo` folder.

### Installation

It is recommended that you install python packages in separate virtualenv or conda environment, e.g.:

```bash
virtualenv -p python3 syft
source syft/bin/activate
```

or

```bash
conda create -n syft python=3.7
conda activate syft
```

Now, you will need to install following packages:

- PySyft. Follow
  [PySyft installation guide](https://github.com/OpenMined/PySyft/blob/syft_0.2.x/INSTALLATION.md)
  to install the latest 0.2.x branch of PySyft.

- PyGrid.
  Follow [PyGrid documentation](https://github.com/OpenMined/PyGrid#getting-started)
  to install the latest `dev` branch of PyGrid.

- Syft.js with MNIST demo. Check out the latest `dev` branch of syft.js with MNIST demo app included:
  ```bash
  cd ~/fl-demo
  git clone https://github.com/OpenMined/syft.js
  cd syft.js
  npm install
  cd examples/mnist
  npm install
  ```

#### Seeding the Model & Plan

Syft.js connects to PyGrid to pick up the model and training Plan.
For the demo to work, we need to populate that data into PyGrid.

##### Run PyGrid Node

See [Getting Started](https://github.com/OpenMined/PyGrid#getting-started) for details. 
It is possible to start PyGrid Node using docker or using console script.

We assume you don't need to change default PyGrid Node configuration and it listens
on the `localhost:5000`. If you need to use different host/port,
PyGrid URL will need to be adjusted accordingly in further steps.

##### Create Model & Plan

After PyGrid is running, the next step is to create the model and training plan and host them in PyGrid. 
[MNIST example jupyter notebooks](https://github.com/OpenMined/PyGrid/tree/dev/examples/model-centric) guide you through this process.

Fire up jupyter notebook in PyGrid root folder:

```bash
cd ~/fl-demo/PyGrid
jupyter notebook --notebook-dir=$(pwd)
```

In the console, you should see URL you should open, or the browser will open automatically. After this, navigate to `examples/model-centric` and [run the first notebook](https://github.com/OpenMined/PyGrid/blob/dev/examples/model-centric/01-Create-plan.ipynb). At this point, you can pull down the model and training plan with syft.js. However, if you'd like to see how to execute the plan using the PySyft FL worker, [try running the second notebook](https://github.com/OpenMined/PyGrid/blob/dev/examples/model-centric/02-ExecutePlan.ipynb).

##### PyGrid Node Clean-up

In case you need to reset PyGrid Node database to blank state, stop the process with `Ctrl+C` and remove `databaseGateway.db` file in PyGrid.
Or, if you used docker-compose, stop and re-start it using `docker-compose up --force-recreate` command.

#### Starting the Demo

Finally, we got to the browser part of the demo:

```bash
cd ~/fl-demo/syft.js/examples/mnist
npm start
```

This should start development server and open `localhost:8080` in the browser.
Assuming PyGrid URL, MNIST model name and version were not modified in previous steps, just
press “Start FL Worker”.

You should see following in dev console:

- Syft.js registers into training cycle on PyGrid and gets configuration, Plan, and the model.
- App loads MNIST dataset and executes the training plan with each data batch.
  Charts are updated during this process, and you should see the training loss going down and the accuracy going up.
- After the training is complete, model diff is submitted to PyGrid.

If “Keep making cycle requests” is checked, the whole cycle process is repeated until PyGrid tells worker that model training is complete.

## Compatibility

### PySyft

Syft.js has been tested with PySyft 0.2.7

### PyGrid

Syft.js has been tested with the latest version of PyGrid on `master`.

### Tensorflow.js

Syft.js was tested with Tensorflow.js v1.2.5.

### Browser Support

Syft.js was tested with Chrome and Firefox browsers.

## Support

For support in using this library, please join the **#lib_syftjs** Slack channel. If you’d like to follow along with any code changes to the library, please join the **#code_syftjs** Slack channel. [Click here to join our Slack community!](https://slack.openmined.org)

## Contributing

Please check [open issues](https://github.com/OpenMined/syft.js/issues) as a starting point.

Bug reports and feature suggestions are welcomed as well.

The workflow is usual for github, the `master` branch is considered stable and the `dev` branch is actively under development:

1. Star, fork, and clone the `syft.js` repository.
1. Create a new branch for changes from `dev`.
1. Push changes to this branch.
1. Submit a PR to OpenMined/syft.js.
1. PR is reviewed and accepted.

Read the [contribution guide](https://github.com/OpenMined/.github/blob/master/CONTRIBUTING.md) as a good starting place.
Additionally, we welcome you to the [slack](http://slack.openmined.org/) for queries related to the library and contribution in general.
The Slack channel `#lib_syftjs` is specific to syft.js development. See you there!

## Contributors

These people were integral part of the efforts to bring syft.js to fruition and in its active development.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.patrickcason.com"><img src="https://avatars1.githubusercontent.com/u/1297930?v=4" width="100px;" alt=""/><br /><sub><b>Patrick Cason</b></sub></a><br /><a href="#ideas-cereallarceny" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/OpenMined/syft.js/commits?author=cereallarceny" title="Code">💻</a> <a href="#design-cereallarceny" title="Design">🎨</a> <a href="https://github.com/OpenMined/syft.js/commits?author=cereallarceny" title="Documentation">📖</a> <a href="#business-cereallarceny" title="Business development">💼</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/vova-manannikov"><img src="https://avatars2.githubusercontent.com/u/12518480?v=4" width="100px;" alt=""/><br /><sub><b>Vova Manannikov</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=vvmnnnkv" title="Code">💻</a> <a href="https://github.com/OpenMined/syft.js/commits?author=vvmnnnkv" title="Documentation">📖</a> <a href="https://github.com/OpenMined/syft.js/commits?author=vvmnnnkv" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://nolski.rocks"><img src="https://avatars3.githubusercontent.com/u/2600677?v=4" width="100px;" alt=""/><br /><sub><b>Mike Nolan</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=Nolski" title="Code">💻</a></td>
    <td align="center"><a href="http://ravikantsingh.com"><img src="https://avatars3.githubusercontent.com/u/40258150?v=4" width="100px;" alt=""/><br /><sub><b>Ravikant Singh</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=IamRavikantSingh" title="Code">💻</a> <a href="https://github.com/OpenMined/syft.js/commits?author=IamRavikantSingh" title="Tests">⚠️</a> <a href="https://github.com/OpenMined/syft.js/commits?author=IamRavikantSingh" title="Documentation">📖</a></td>
    <td align="center"><a href="http://vkkhare.github.io"><img src="https://avatars1.githubusercontent.com/u/18126069?v=4" width="100px;" alt=""/><br /><sub><b>varun khare</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=vkkhare" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/pedroespindula"><img src="https://avatars1.githubusercontent.com/u/38431219?v=4" width="100px;" alt=""/><br /><sub><b>Pedro Espíndula</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=pedroespindula" title="Documentation">📖</a></td>
    <td align="center"><a href="https://benardi.github.io/myblog/"><img src="https://avatars0.githubusercontent.com/u/9937551?v=4" width="100px;" alt=""/><br /><sub><b>José Benardi de Souza Nunes</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=Benardi" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.linkedin.com/in/singh-taj"><img src="https://avatars1.githubusercontent.com/u/25232829?v=4" width="100px;" alt=""/><br /><sub><b>Tajinder Singh</b></sub></a><br /><a href="https://github.com/OpenMined/syft.js/commits?author=tsingh2k15" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

[Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/)
