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

If you're running Syft alongside PySyft, which you probably are, then this is likely all you'll need to do to get Syft.js working.  In this case, it will perform any instructions PySyft asks it to perform.

#### Calling Syft.js directly

Everything in Syft.js is based on ID's that you specify.  To add a tensor to the list, you can simply run:

```javascript
syft.addTensor('my-tensor', [[1, 2], [3, 4]]);
```

To remove a tensor :

```javascript
syft.removeTensor('my-tensor');
```

And to run an operation:

```javascript
// First param is any valid Tensorflow.js operation
syft.runOperation('add', ['first-tensor', 'second-tensor']);
syft.runOperation('mul', ['first-tensor', 'second-tensor']);
```

All three methods also return a `Promise` should you desire this functionality:

```javascript
// addTensor()
syft.addTensor('my-tensor', [[1, 2], [3, 4]]).then(tensors => {
    console.log('A list of all stored tensors', tensors);
});

// removeTensor()
syft.removeTensor('my-tensor').then(tensors => {
    console.log('A list of all stored tensors', tensors);
});

// runOperation()
syft.runOperation('add', ['first-tensor', 'second-tensor']).then(result => {
    console.log('A TensorFlow.js tensor', result);
});
```

#### Event Listeners

If `Promise` doesn't do it for you, or you're working with a state management library like Redux, MobX, or Vuex, then you can optionally hook into event listeners.  You have access to the following events:

```javascript
// A tensor being added to the list
syft.onTensorAdded((id, tensor, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('The TensorFlow.js tensor', tensor);
    console.log('A list of all stored tensors', tensors);
});
```

```javascript
// A tensor being removed from the list
syft.onTensorRemoved((id, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('A list of all stored tensors', tensors);
});
```

```javascript
// An operation being run
syft.onRunOperation((func, result) => {
    console.log('The TensorFlow.js operation', func);
    console.log('A TensorFlow.js tensor', result);
});
```

```javascript
// When a PySyft message is received
syft.onMessageReceived((event) => {
    console.log('The JSON passed to us from PySyft', event);
});
```

```javascript
// When a message is sent back to PySyft
syft.onMessageSent(({ type, data }) => {
    console.log('The type of message being passed', type);
    console.log('The data being passed alongside', data);
});
```

#### Helper Functions

It's not likely you'll have to use these functions directly, but nevertheless, you have access to them should you desire:

```javascript
// Get a list of all tensors being stored
syft.getTensors();

// Get a single tensor by ID
syft.getTensorById('my-tensor');

// Get the index of a tensor in the list
syft.getTensorIndex('my-tensor');
```



