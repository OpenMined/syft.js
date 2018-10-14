# Syft.js

[![Build Status](https://travis-ci.org/OpenMined/syft.js.svg?branch=master)](https://travis-ci.org/OpenMined/syft.js) [![codecov](https://codecov.io/gh/OpenMined/syft.js/branch/master/graph/badge.svg)](https://codecov.io/gh/OpenMined/syft.js)

## Introduction to Syft.js

Of course, [PySyft](https://github.com/openmined/pysyft) has the ability to run in its own environment. But if you would like to train FL models in the browser, you must resort to using some ML framework like [TensorFlow.js](https://js.tensorflow.org/).

**Syft.js is a microlibrary built on top of TensorFlow.js, allowing for a socket connection with any running PySyft instance.**

PySyft acts as the parent node, instructing child nodes \(Syft.js instances running in a website on users' browsers\) of what tensors to add to a list, remove from a list, and operate against.

### Installation

If you're using a package manage like NPM:

```text
npm install --save syft.js
```

Or if Yarn is your cup of tea:

```bash
yarn add syft.js
```

When using a package manager, TensorFlow.js will be automatically installed.

If you're not using a package manager, you can also include Syft.js within a `<script>` tag:

```markup
<script src="https://cdnjs.cloudflare.com/ajax/libs/tensorflow/0.12.5/tf.min.js"></script>
<script src="https://unpkg.com/syft.js@latest/lib/index.js"></script>
```

For integration into your client-side application, [please check out our guide](guide.md).

For further API documentation, [please check that out here](api-documentation.md).

### Local Development

1. Clone or fork
2. Run `npm install` or `yarn install`
3. Run `npm start` or `yarn start`

### Contributing

We're accepting PR's for testing at the moment to improve our overall code coverage. In terms of core functionality, we're considering the current version of Syft.js feature complete until a further roadmap is designated.

