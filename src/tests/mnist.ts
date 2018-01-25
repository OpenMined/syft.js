
let mnist = require('mnist')

import * as syft from '..'


let dataset = mnist.set(10000, 200)
async function test() {
  let training = {
    input: await syft.FloatTensor.create(dataset.training.map(i=>i.input)),
    output: await syft.FloatTensor.create(dataset.training.map(i=>i.output)),
  }
  let testing = {
    input: await syft.FloatTensor.create(dataset.test.map(i=>i.input)),
    output: await syft.FloatTensor.create(dataset.test.map(i=>i.output)),
  }

  let model = await syft.Sequential.create([
    await syft.Linear.create(28*28, 16),
    await syft.ReLU.create(),
    await syft.Linear.create(16, 10),
    await syft.Softmax.create()
  ])

  let loss = await syft.Categorical_CrossEntropy.create()
  let optim = await syft.SGD.create([])
  let metric = ['accuracy']

  let error = await model.fit(
    training.input,
    training.output,
    loss,
    optim,
    200,
    10,
    1,
    metric,
    true
  )

  console.log('trained!', error);


  (global as any).perd = await model.forward(testing.input)

}

test()
