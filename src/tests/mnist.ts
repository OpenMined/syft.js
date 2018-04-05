import * as syft from '..'

let mnist = require('mnist')(false)

let g = global as any
let dataset = mnist(60000, 10000)

g.syft = syft

async function test() {
  let training = {
    input: await syft.Tensor.FloatTensor.create(dataset.training.input),
    output: await syft.Tensor.FloatTensor.create(dataset.training.output)
  }
  let testing = {
    input: await syft.Tensor.FloatTensor.create(dataset.test.input),
    output: await syft.Tensor.FloatTensor.create(dataset.test.output)
  }

  let model = await syft.Model.Sequential.create([
    await syft.Model.Linear.create(784, 10)
  ])

  g.model = model

  let criterion = await syft.Model.CrossEntropyLoss.create()
  let optimizer = await syft.Optimizer.SGD.create({
    params: await model.parameters(),
    lr: 0.06
  })
  let metrics = ['accuracy']

  let loss = await model.fit({
    input: training.input,
    target: training.output,
    criterion,
    optimizer,
    batchSize: 32,
    iterations: 4,
    logInterval: 1,
    metrics,
    verbose: true
  })

  console.log('trained!', loss)

  g.perd = await model.forward(testing.input)
  criterion.forward(g.perd, testing.output)

  console.log(await g.perd.shape())
}

let done = (res: any) => console.log(res)
test().then(done).catch(done)
