# Syft.js

[![Build Status](https://travis-ci.org/OpenMined/syft.js.svg?branch=master)](https://travis-ci.org/OpenMined/syft.js) [![codecov](https://codecov.io/gh/OpenMined/syft.js/branch/master/graph/badge.svg)](https://codecov.io/gh/OpenMined/syft.js)

## Introduction to Syft.js

Of course, [PySyft](https://github.com/openmined/pysyft) has the ability to run in its own environment. But if you would like to train FL models in the browser, you must resort to using some ML framework like [TensorFlow.js](https://js.tensorflow.org/). Syft.js is a wrapper on top of TensorFlow.js, allowing for a socket connection with any running PySyft instance.  PySyft acts as the parent node, instructing child nodes \(Syft.js instances running in a website on users' browsers\) of what tensors to add to a list, remove from a list, and operate against.

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

### Local Development

1. Clone or fork
2. Run `npm install` or `yarn install`
3. Run `npm start` or `yarn start`

### Contributing

We're accepting PR's for testing at the moment to improve our overall code coverage.  In terms of core functionality, we're considering the current version of Syft.js feature complete until a further roadmap is designated.

## Guide

With Syft.js you have the ability to interact directly with the API or let all instructions be done by PySyft.

#### Starting and stopping

{% hint style="info" %}
**Integration with PySyft**

Technically speaking, you don't actually need PySyft to be running in order to use Syft.js. It can also be used as a way to work a list of TensorFlow tensors. However, the rest of this documentation will be assuming you're integrating with PySyft. Either way, you'll need to create an instance of Syft.
{% endhint %}

All you need to get started is by creating an instance of Syft.js and then starting your server:

```javascript
var syft = new Syft({
    url: URL_OF_PYSYFT_INSTANCE
});

syft.start();
```

To shut down the connection, all you need to run is:

```javascript
// ... code from above

syft.stop();
```

If you would like a full list of logs from Syft.js, you can also pass a `verbose: true` option in the configuration:

```javascript
var syft = new Syft({
    url: URL_OF_PYSYFT_INSTANCE,
    verbose: true
});
```

#### Calling Syft.js directly

Everything in Syft.js is based on ID's that you specify.  To add a tensor to the list, you can simply run:

```javascript
syft.addTensor('my-tensor', [[1, 2], [3, 4]]);
```

