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

  let model = await syft.Model.Sequential.create([
    await syft.Model.Linear.create({
      inputDim: 784,
      outputDim: 10
    })
  ])

  let criterion = await syft.Model.CrossEntropyLoss.create()
  let optimizer = await syft.Optimizer.SGD.create({
    params: await model.parameters(),
    lr: 0.06
  })
  let metrics = ['accuracy']
  let softmax = await syft.Model.Softmax.create()

  let loss = await model.fit({
    input: training.input,
    target: training.output,
    criterion,
    optimizer,
    batchSize: 32,
    iterations: 2,
    logInterval: 1,
    metrics,
    verbose: true
  })

  console.log('Trained with a final loss:', loss)

  let perd = await softmax.forward(
    await model.forward(testing.input)
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
