try {
  // Let's go ahead and create a Syft instance (with logging turned on)
  const mySyft = new Syft('ws://localhost:1112/', true);

  // Start the websocket listener
  // This will kick off a socket listener which waits for tensors and/or operations
  // However, we can also add and remove tensors, as well as run operations manually, as shown below
  mySyft.start();

  // Create the first tensor with an ID of 'first-tensor'
  const first = mySyft.addTensor('first-tensor', [[1, 2], [3, 4]]);

  console.log('FIRST TENSOR', first);
  first.tensor.print(true);

  // Create the second tensor with an ID of 'second-tensor'
  const second = mySyft.addTensor('second-tensor', [[2, 4], [6, 8]]);

  console.log('SECOND TENSOR', second);
  second.tensor.print(true);

  // Create the third tensor with an ID of 'third-tensor'
  const third = mySyft.addTensor('third-tensor', [[4, 8], [12, 16]]);

  console.log('THIRD TENSOR', third);
  third.tensor.print(true);

  // Remove the second tensor and log the list of tensors
  mySyft.removeTensor('second-tensor');

  console.log('ALL TENSORS', mySyft.getTensors());

  // Let's just do a sample operation, add for example
  const addOperation = mySyft.runOperation('add', [
    'first-tensor',
    'third-tensor'
  ]);

  console.log('ADD TENSORS', addOperation);
  addOperation.print(true);

  // Maybe try to multiply now
  const multiplyOperation = mySyft.runOperation('mul', [
    'first-tensor',
    'third-tensor'
  ]);

  console.log('MULTIPLY TENSORS', multiplyOperation);
  multiplyOperation.print(true);

  // Closing the connection because we don't need it anymore...
  mySyft.stop();
} catch (error) {
  // Log any errors that we find
  console.error(error);
}
