const mnist = require('mnist')(false)

import * as syft from '..'

let testSamples = 1000
let trainingSamples = 6000

let dataset = mnist(trainingSamples, testSamples)

async function train() {
  let training = {
    input: await syft.Tensor.FloatTensor.create(dataset.training.input),
    output: await syft.Tensor.FloatTensor.create(dataset.training.output)
  }

  let testing = {
    input: await syft.Tensor.FloatTensor.create(dataset.test.input),
    output: await syft.Tensor.FloatTensor.create(dataset.test.output)
  }

  // syft.setVerbose(true)

  let model = new syft.keras.Sequential()

  await model.add(
    new syft.keras.Dense({
      inputShape: 784,
      outputShape: 10,
      activation: 'linear'
    })
  )

  await model.compile({
    loss: 'crossentropyloss',
    optimizer: new syft.keras.SGD({
      lr: 0.06
    }),
    metrics: ['accuracy']
  })

  let softmax = await syft.Model.Softmax.create()

  let loss = await model.fit({
    input: training.input,
    target: training.output,
    batchSize: 32,
    epochs: 2,
    logInterval: 1,
    verbose: true
  })

  console.log('Trained with a final loss:', loss)

  let perd = await softmax.forward(
    await model.predict(testing.input)
  )

  // select a random test example to draw
  let select = Math.floor(testSamples * Math.random())

  dataset.draw(
    (await testing.input.getData()).slice(select * 784, (select + 1) * 784),
    (await perd.getData()).slice(select * 10, (select + 1) * 10),
    (await testing.output.getData()).slice(select * 10, (select + 1) * 10)
  )
}

train()
  .then(() => process.exit())
  .catch((err) => console.log(err))
