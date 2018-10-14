# API Documentation

## Initialization

### Syft Constructor

To create a new `Syft` instance, you instantiate it like such:

```javascript
var syft = new Syft(options);
```

You can supply the following `options`, all of which are optional and passed as an `Object`:

```javascript
var options = {
    url: 'ws://location-of-PySyft:8080/',
    verbose: true
};
```

| Argument | Type | Description |
| :--- | :--- | :--- |
| url | string | The URL of the PySyft socket connection |
| verbose | boolean | Whether or not you want Syft.js to output all logs |

### start\(url\)

This method starts the connection to PySyft and sets up a socket listener to listen to incoming instructions. You may **optionally** define a `url` argument if you didn't in the [Syft constructor documented above](api-documentation.md#syft-constructor).

```javascript
// With a URL being defined in the constructor
syft.start();

// With a URL being defined in start()
syft.start('ws://location-of-PySyft:8080/');
```

This also sends two messages back to PySyft to let the server know the client is ready to receive tensors.

#### When the client is starting

```javascript
{
    "type": "socket-status",
    "data": {
        "status": "starting"
    }
}
```

#### When the client is ready for instructions

```javascript
{
    "type": "socket-status",
    "data": {
        "status": "ready"
    }
}
```

### stop\(\)

This method stops the connection to PySyft. It also clears the list of stored tensors in Syft.js.

```javascript
syft.stop();
```

This also sends back a single message back to PySyft to let the server know the client has shut down.

#### When the client has stopped

```javascript
{
    "type": "socket-status",
    "data": {
        "status": "stopped"
    }
}
```

## Functionality

### addTensor\(id, tensor\)

This method adds a tensor to the list of stored tensors.

| Argument | Type | Description |
| :--- | :--- | :--- |
| id | string | ID of the tensor |
| tensor | array | Value of the tensor |

```javascript
syft.addTensor('my-tensor', [[1, 2], [3, 4]]);
```

#### Calling from PySyft

The request from PySyft:

```javascript
{
    "type": "add-tensor",
    "id": "my-tensor",
    "values": [[1, 2], [3, 4]]
}
```

The response to sent back to PySyft:

```javascript
{
    "type": "add-tensor",
    "data": {
        "id": "my-tensor",
        "tensor": CREATED_TENSORFLOW_TENSOR
    }
}
```

#### Return Value

This method returns a `Promise`:

```javascript
syft.addTensor('my-tensor', [[1, 2], [3, 4]]).then(tensors => {
    console.log('A list of all stored tensors', tensors);
});
```

#### Event Handlers

This method triggers an event handler, `onTensorAdded`, that you may hook into.

### removeTensor\(id\)

This method removes a tensor from the list of stored tensors.

| Argument | Type | Description |
| :--- | :--- | :--- |
| id | string | ID of the tensor |

```javascript
syft.removeTensor('my-tensor');
```

#### Calling from PySyft

The request from PySyft:

```javascript
{
    "type": "remove-tensor",
    "id": "my-tensor",
}
```

The response to sent back to PySyft:

```javascript
{
    "type": "remove-tensor",
    "data": {
        "id": "my-tensor"
    }
}
```

#### Return Value

This method returns a `Promise`:

```javascript
syft.removeTensor('my-tensor').then(tensors => {
    console.log('A list of all stored tensors', tensors);
});
```

#### Event Handlers

This method triggers an event handler, `onTensorRemoved`, that you may hook into.

### runOperation\(func, tensors\)

This method performs a TensorFlow.js operation on two tensors.

| Argument | Type | Description |
| :--- | :--- | :--- |
| func | string | The TensorFlow.js operation \("add", "mul", etc.\) |
| tensors | array | An array of two tensor ID's |

```javascript
syft.runOperation('add', ['first-tensor', 'second-tensor']);
```

#### Calling from PySyft

The request from PySyft:

```javascript
{
    "type": "run-operation",
    "func": "add",
    "tensors": ["first-tensor", "second-tensor"]
}
```

The response to sent back to PySyft:

```javascript
{
    "type": "run-operation",
    "data": {
        "result": RESULT_OF_TENSORFLOW_OPERATION,
        "tensors": [
            FIRST_TENSORFLOW_TENSOR,
            SECOND_TENSORFLOW_TENSOR
        ]
    }
}
```

#### Return Value

This method returns a `Promise`:

```javascript
syft.runOperation('add', ['first-tensor', 'second-tensor']).then(result => {
    console.log('A TensorFlow.js tensor', result);
});
```

#### Event Handlers

This method triggers an event handler, `onRunOperation`, that you may hook into.

## Event Handler

### onTensorAdded\(\)

This event handler is triggered when a new tensor is added to the stored tensors list.

| Argument | Type | Description |
| :--- | :--- | :--- |
| id | string | ID of the tensor |
| tensor | tensor | The TensorFlow.js tensor |
| tensors | array | The array of all tensors being stored |

```javascript
syft.onTensorAdded((id, tensor, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('The TensorFlow.js tensor', tensor);
    console.log('A list of all stored tensors', tensors);
});
```

### onTensorRemoved\(\)

This event handler is triggered when a tensor is removed from the stored tensors list.

| Argument | Type | Description |
| :--- | :--- | :--- |
| id | string | ID of the tensor |
| tensors | array | The array of all tensors being stored |

```javascript
syft.onTensorRemoved((id, tensors) => {
    console.log('The ID of the tensor', id);
    console.log('A list of all stored tensors', tensors);
});
```

### onRunOperation\(\)

This event handler is triggered when an operation is run on two tensors.

| Argument | Type | Description |
| :--- | :--- | :--- |
| func | string | The TensorFlow.js operation \("add", "mul", etc.\) |
| result | tensor | The result of the TensorFlow.js operation |

```javascript
syft.onRunOperation((func, result) => {
    console.log('The TensorFlow.js operation', func);
    console.log('A TensorFlow.js tensor', result);
});
```

### onMessageReceived\(\)

This event handler is triggered when a message is received from PySyft.

| Argument | Type | Description |
| :--- | :--- | :--- |
| event | object | The event object being received from  |

```javascript
syft.onMessageReceived((event) => {
    console.log('The JSON passed to us from PySyft', event);
});
```

### onMessageSent\(\)

This event handler is triggered when a message is sent back to PySyft.

| Argument | Type | Description |
| :--- | :--- | :--- |
| message | object | A message object containing the `type` of message being sent and the `data` associated with that message |

```javascript
syft.onMessageSent(({ type, data }) => {
    console.log('The type of message being passed', type);
    console.log('The data being passed alongside', data);
});
```

## Helpers

### getTensors\(\)

This method returns all the tensors currently being stored by Syft.js.

```javascript
syft.getTensors();
```

#### Calling from PySyft

The request from PySyft:

```javascript
{
    "type": "get-tensors"
}
```

The response to sent back to PySyft:

```javascript
{
    "type": "get-tensors",
    "data": [
        {
            "id": "first-tensor",
            "tensor": FIRST_TENSORFLOW_TENSOR
        },
        {
            "id": "second-tensor",
            "tensor": SECOND_TENSORFLOW_TENSOR
        }
    ]
}
```

#### Return Value

The return is an array of all stored tensors, it looks like such:

```javascript
[
    {
        id: 'first-tensor',
        tensor: FIRST_TENSORFLOW_TENSOR
    },
    {
        id: 'second-tensor',
        tensor: SECOND_TENSORFLOW_TENSOR
    }
]
```

### getTensorById\(id\)

This method returns a tensor specified by an ID.

```javascript
syft.getTensorById(id);
```

#### Calling from PySyft

The request from PySyft:

```javascript
{
    "type": "get-tensor",
    "id": "my-tensor"
}
```

The response to sent back to PySyft:

```javascript
{
    "type": "get-tensor",
    "data": {
        "id": "my-tensor",
        "tensor": REQUESTED_TENSORFLOW_TENSOR
    }
}
```

#### Return Value

The return is an object of the requested tensor, it looks like such:

```javascript
{
    id: 'my-tensor',
    tensor: REQUESTED_TENSORFLOW_TENSOR
}
```

### getTensorIndex\(id\)

This method returns a tensor's index in the tensors array specified by an ID.

```javascript
syft.getTensorIndex(id);
```

#### Return Value

The return is a number representing the index in the tensors array, it looks like such:

```javascript
1
```



