async function runApp() {
  try {
    // Let's go ahead and create a Syft instance (with logging turned on)
    const mySyft = new Syft({
      url: 'ws://localhost:1112/',
      verbose: true
    });

    // Start the websocket listener
    // This will kick off a socket listener which waits for tensors and/or operations
    // However, we can also add and remove tensors, as well as run operations manually, as shown below
    mySyft.start();

    mySyft.onTensorAdded(data => {
      console.log('TENSOR ADDED', data, mySyft.getValues(data.tensor));
    });

    mySyft.onTensorRemoved(data => {
      console.log('TENSOR REMOVED', data);
    });

    mySyft.onRunOperation(data => {
      console.log('OPERATION RAN', data, mySyft.getValues(data.result));
    });

    let results;

    // Create the first tensor with an ID of 'first-tensor'
    await mySyft.addTensor('first-tensor', [[1, 2], [3, 4]]);

    // Create the second tensor with an ID of 'second-tensor'
    await mySyft.addTensor('second-tensor', [[2, 4], [6, 8]]);

    // Create the third tensor with an ID of 'third-tensor'
    await mySyft.addTensor('third-tensor', [[4, 8], [12, 16]]);

    // Remove the second tensor and log the list of tensors
    await mySyft.removeTensor('second-tensor');

    // Let's just do a sample operation, add for example
    results = await mySyft.runOperation('add', [
      'first-tensor',
      'third-tensor'
    ]);

    // Maybe try to multiply now
    results = await mySyft.runOperation('mul', [
      'first-tensor',
      'third-tensor'
    ]);

    // Closing the connection because we don't need it anymore...
    mySyft.stop();
  } catch (error) {
    // Log any errors that we find
    console.error(error);
  }
}

runApp();
