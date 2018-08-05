// Let's go ahead and create a Syft instance
const mySyft = new Syft('ws://localhost:1112/');

// Start the websocket listener
mySyft.start();

// Create the first tensor with an ID of 'first-tensor'
const first = mySyft.addTensor('first-tensor', [[1, 2], [3, 4]]);
console.log('FIRST TENSOR', first);
first.tensor.print(true);

// Create the second tensor with an ID of 'second-tensor'
const second = mySyft.addTensor('second-tensor', [[2, 4], [6, 8]]);
console.log('SECOND TENSOR', second);
second.tensor.print(true);

// Let's just do a sample operation, add for example
// NOTE: You can pass the newly added tensor object or the id of the tensor
const sampleOperation = mySyft.sampleOperation('add', first, 'second-tensor');
console.log('ADD TENSORS', sampleOperation);
sampleOperation.print(true);
