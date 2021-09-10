# syft.js MNIST Example

This is a demonstration of how to use [syft.js](https://github.com/openmined/syft.js)
with [PyGrid](https://github.com/OpenMined/pygrid) to train a plan on local data in the browser.

## Quick Start

1. Install and start [PyGrid](https://github.com/OpenMined/pygrid)
2. Install [PySyft](https://github.com/OpenMined/PySyft) and [execute the "Part 01 - Create Plan" notebook](https://github.com/OpenMined/PySyft/blob/master/examples/tutorials/model-centric-fl/Part%2001%20-%20Create%20Plan.ipynb) from `examples/tutorials/model-centric-fl` folder to seed the MNIST plan and model into PyGrid.
3. Now back in this folder, execute `npm install`
4. And then execute `npm start`

This will launch a web browser running the file `index.js`. Every time you make changes to this file, the server will automatically re-compile your code and refresh the page. No need to start and stop. :)

## Development

This MNIST example is setup to use a remote copy of the syft.js repo (see the `syft.js/examples/mnist/package.json` dependencies param). In order to circumvent this and test changes to syft.js using the MNIST example, we can establish a link to our local copy of syft.js instead:

```
$ cd <syft.js>/
$ npm link
$ cd <syft.js>/examples/mnist
$ npm link @openmined/syft.js
```
