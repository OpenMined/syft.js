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

    let tensors, results;

    // Create the first tensor with an ID of 'first-tensor'
    tensors = await mySyft.addTensor('first-tensor', [[1, 2], [3, 4]]);
    console.log('FIRST TENSOR', mySyft.getValues(tensors[0].tensor));

    // Create the second tensor with an ID of 'second-tensor'
    tensors = await mySyft.addTensor('second-tensor', [[2, 4], [6, 8]]);
    console.log('SECOND TENSOR', mySyft.getValues(tensors[1].tensor));

    // Create the third tensor with an ID of 'third-tensor'
    tensors = await mySyft.addTensor('third-tensor', [[4, 8], [12, 16]]);
    console.log('THIRD TENSOR', mySyft.getValues(tensors[2].tensor));

    // Remove the second tensor and log the list of tensors
    tensors = await mySyft.removeTensor('second-tensor');
    console.log('ALL TENSORS', tensors);

    // Let's just do a sample operation, add for example
    results = await mySyft.runOperation('add', [
      'first-tensor',
      'third-tensor'
    ]);
    console.log('ADD TENSORS', mySyft.getValues(results));

    // Maybe try to multiply now
    results = await mySyft.runOperation('mul', [
      'first-tensor',
      'third-tensor'
    ]);
    console.log('MULTIPLY TENSORS', mySyft.getValues(results));

    // Closing the connection because we don't need it anymore...
    mySyft.stop();
  } catch (error) {
    // Log any errors that we find
    console.error(error);
  }
}

runApp();
