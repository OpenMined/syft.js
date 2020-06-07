# Syft.js MNIST Example

This is a demonstration of how to use [syft.js](https://github.com/openmined/syft.js)
with [PyGrid](https://github.com/OpenMined/pygrid) to train a plan on local data in the browser.

Prerequisites:

1. Execute `npm install`
2. Install and start [PyGrid](https://github.com/OpenMined/pygrid)
3. Install [PySyft](https://github.com/OpenMined/PySyft) and execute "Create Plan" and "Host Plan" notebooks from `examples/experimental/FL Training Plan` folder
   to seed MNIST plan and model into PyGrid.

Finally, execute `npm start`.

This will launch a web browser running the file `index.js`. Every time you make changes to this file, the server will automatically re-compile your code and refresh the page. No need to start and stop. :)
