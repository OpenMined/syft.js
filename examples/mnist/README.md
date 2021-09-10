# syft.js MNIST Example

This is a demonstration of how to use [syft.js](https://github.com/openmined/syft.js)
with [PyGrid](https://github.com/OpenMined/PySyft/packages/grid) to train a plan on local data in the browser.

## Quick Start

1. Install and start [PyGrid](https://github.com/OpenMined/PySyft/packages/grid)
2. Install [PySyft](https://github.com/OpenMined/PySyft) and [Model Centric Federated Learning - MNIST Example: Create Plan](https://github.com/OpenMined/PySyft/blob/d46768cb53b2ff95264c0c17d2e64f5a125e969e/packages/syft/examples/federated-learning/model-centric/mcfl_create_plan.ipynb) from `packages/syft/examples/federated-learning/model-centric` folder to seed the MNIST plan and model into PyGrid.
3. Now back in this folder, execute `npm install`
4. And then execute `npm start`

This will launch a web browser running the file `index.js`. Every time you make changes to this file, the server will automatically re-compile your code and refresh the page. No need to start and stop. :)

## Development

This MNIST example is setup to use a remote copy of the syft.js repo (see the `syft.js/examples/mnist/package.json` dependencies param). In order to circumvent this and test changes to syft.js using the MNIST example, we can establish a link to our local copy of syft.js instead:

```console
cd <syft.js>/
npm link
cd <syft.js>/examples/mnist
npm link @openmined/syft.js
```
