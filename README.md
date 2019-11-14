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
npm install --save syft.js @tensorflow/tfjs
```

Or if Yarn is your cup of tea:

```text
yarn add syft.js @tensorflow/tfjs
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

[It's highly suggested you use PNPM as your Javascript package manager.](https://github.com/pnpm/pnpm)

1. Fork and clone
2. Run `npm install`
3. Run `npm start`
4. Do your work.
5. Push to your clone
6. Submit a PR to openmined/syft.js

### Contributing

We're accepting PR's for testing at the moment to improve our overall code coverage. In terms of core functionality, we're considering the current version of Syft.js feature complete until a further roadmap is designated.
