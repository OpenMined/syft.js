# Syft.js

![Travis (.org)](https://img.shields.io/travis/OpenMined/syft.js.svg)
![codecov](https://img.shields.io/codecov/c/github/OpenMined/syft.js)
![npm](https://img.shields.io/npm/v/syft.js.svg)
![GitHub](https://img.shields.io/github/license/OpenMined/syft.js.svg)

## Introduction to Syft.js

Of course, [PySyft](https://github.com/openmined/pysyft) has the ability to run in its own environment. But if you would like to train FL models in the browser, you must resort to using some ML framework like [TensorFlow.js](https://js.tensorflow.org/).

**Syft.js is a microlibrary built on top of TensorFlow.js, allowing for training and prediction of PySyft models in the browser.**

PySyft acts as the parent node, instructing child nodes \(Syft.js clients running in a website on users' browsers\) of what tensors to add to a list, remove from a list, and operate against.

[Link to full documentation here](https://docs.openmined.org/syft-js)

### Installation in a Web Application

If you're using a package manage like NPM:

```text
npm install --save syft.js @tensorflow/tfjs-core
```

Or if Yarn is your cup of tea:

```text
yarn add syft.js @tensorflow/tfjs-core
```

When using a package manager, [TensorFlow.js](https://www.tensorflow.org/js) will be automatically installed. If you're not using a package manager, you can also include Syft.js within a `<script>` tag (see example below).

**Note:** If you're training or predicting with another syft.js client running somewhere else (or in another browser tab) then it's highly suggested you include the [WebRTC adapter](https://github.com/webrtc/adapter) shim inside of your web application.

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2.5/dist/tf.min.js"></script>
<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
<!-- If using WebRTC -->
<script src="https://unpkg.com/syft.js@latest"></script>
```

For integration into your client-side application, [please check out our guide](https://docs.openmined.org/syft-js/guide).

For further API documentation, [please check that out here](https://docs.openmined.org/syft-js/api-documentation).

### Local Development

1. Fork and clone
2. Run `npm install`
3. Run `npm start`
4. Do your work.
5. Push to your fork
6. Submit a PR to openmined/syft.js

### Running Demos

It's important to note that each of the examples are self-sustaining projects. This means that they run independent of the `npm start` command run at the root syft.js directory. In order to run the demos, please do the following:

1. Make sure that grid.js is [running and seeded with data](https://github.com/OpenMined/grid.js/#development).
2. Open a terminal to the root syft.js directory.
3. Run `npm install` and then `npm start`.
4. Open a new terminal tab and `cd` into one of the examples.
5. Run `npm install` and then `npm start` inside of that example's directory. This should open a new browser tab for that example.
6. Leave both tasks going as you proceed with normal development. The example will automatically refresh in your browser every time you make a change to syft.js or to the example itself.

### Contributing

We're accepting PR's for testing at the moment to improve our overall code coverage. In terms of core functionality, we're considering the current version of Syft.js feature complete until a further roadmap is designated.
