# Guide

{% hint style="info" %}
**Integration with PySyft**

With Syft.js you have the ability to interact directly with the API or let all instructions be done by PySyft. Technically speaking, you don't actually need PySyft to be running in order to use Syft.js. It can simply be used as a way to work a list of TensorFlow.js tensors. However, the rest of this documentation will be assuming you're integrating with PySyft. Either way, you'll need to create an instance of Syft.
{% endhint %}

## Starting and stopping

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

If you're running Syft alongside PySyft, which you probably are, then this is likely all you'll need to do to get Syft.js working. In this case, it will perform any instructions PySyft asks it to perform.

## Calling Syft.js directly

Everything in Syft.js is based on ID's that you specify.

### Adding a tensor

To add a tensor to the list of tensors, pass an ID as the first argument and the value of the tensor as the second argument.

```javascript
syft.addTensor('my-tensor', [[1, 2], [3, 4]]);
```

### Removing a tensor

To remove a tensor from the list of tensors, simply pass the ID.

```javascript
syft.removeTensor('my-tensor');
```

### Running an operation

If you want to run a TensorFlow.js operation on two tensors currently stored in Syft.js, you pass the TensorFlow.js operation as the first argument, and an array containing the ID's of the tensors in question as the second argument.

```javascript
// First param is any valid Tensorflow.js operation
syft.runOperation('add', ['first-tensor', 'second-tensor']);
syft.runOperation('mul', ['first-tensor', 'second-tensor']);
```

### Promises

All three methods also return a `Promise` should you desire this functionality.

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

## Event Listeners

If `Promise` doesn't do it for you, or you're working with a state management library like Redux, MobX, or Vuex, then you can optionally hook into event listeners. You have access to the following events:

### onTensorAdded

```javascript
// A tensor being added to the list
syft.onTensorAdded((id, tensor, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('The TensorFlow.js tensor', tensor);
    console.log('A list of all stored tensors', tensors);
});
```

### onTensorRemoved

```javascript
// A tensor being removed from the list
syft.onTensorRemoved((id, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('A list of all stored tensors', tensors);
});
```

### onRunOperation

```javascript
// An operation being run
syft.onRunOperation((func, result) => {
    console.log('The TensorFlow.js operation', func);
    console.log('A TensorFlow.js tensor', result);
});
```

### onMessageReceived

```javascript
// When a PySyft message is received
syft.onMessageReceived((event) => {
    console.log('The JSON passed to us from PySyft', event);
});
```

### onMessageSent

```javascript
// When a message is sent back to PySyft
syft.onMessageSent(({ type, data }) => {
    console.log('The type of message being passed', type);
    console.log('The data being passed alongside', data);
});
```

## Helper Functions

It's not likely you'll have to use these functions directly, but nevertheless, you have access to them should you desire:

```javascript
// Get a list of all tensors being stored
syft.getTensors();

// Get a single tensor by ID
syft.getTensorById('my-tensor');

// Get the index of a tensor in the list
syft.getTensorIndex('my-tensor');
```

