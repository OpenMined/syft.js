# Syft.js
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

![Build](https://img.shields.io/github/workflow/status/OpenMined/syft.js/Run%20tests%20and%20coverage)
![codecov](https://img.shields.io/codecov/c/github/OpenMined/syft.js)
![npm](https://img.shields.io/npm/v/@openmined/syft.js)
![GitHub](https://img.shields.io/github/license/OpenMined/syft.js.svg)
![OpenCollective](https://img.shields.io/opencollective/all/openmined)

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

### Usage

See [API Documentation](API-REFERENCE.md).

### Local Development

1. Fork and clone
2. Run `npm install`
3. Run `npm start`
4. Do your work.
5. Push to your fork
6. Submit a PR to openmined/syft.js

### Running Demos

Demos are placed in `example` folder. It's important to note
that examples are self-sustaining projects and need `npm install`
executed in their own folders.

The "Hello World" syft.js demo is MNIST training example located in `examples/mnist` folder.
See its README file for installation and running instructions.

### Contributing

We're accepting PR's for testing at the moment to improve our overall code coverage. In terms of core functionality, we're considering the current version of Syft.js feature complete until a further roadmap is designated.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.patrickcason.com"><img src="https://avatars1.githubusercontent.com/u/1297930?v=4" width="100px;" alt=""/><br /><sub><b>Patrick Cason</b></sub></a><br /><a href="#ideas-cereallarceny" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/OpenMined/syft.js/commits?author=cereallarceny" title="Code">💻</a> <a href="#design-cereallarceny" title="Design">🎨</a> <a href="https://github.com/OpenMined/syft.js/commits?author=cereallarceny" title="Documentation">📖</a> <a href="#business-cereallarceny" title="Business development">💼</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!