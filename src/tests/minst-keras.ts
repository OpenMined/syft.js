
let mnist = require('mnist')(false)

import * as syft from '..'
let g = global as any
g.syft = syft
let dataset = mnist(60000, 10000)

async function test() {
  let training = {
    input: await syft.Tensor.FloatTensor.create(dataset.training.input),
    output: await syft.Tensor.FloatTensor.create(dataset.training.output),
  }
  let testing = {
    input: await syft.Tensor.FloatTensor.create(dataset.test.input),
    output: await syft.Tensor.FloatTensor.create(dataset.test.output),
  }

  let model = new syft.keras.Sequential()
  g.model = model

  await model.add(new syft.keras.Dense(16, 784, 'relu'))
  await model.add(new syft.keras.Dense(10, undefined, 'softmax'))

  await model.compile(
    'categorical_crossentropy',
    new syft.keras.SGD(),
    ['accuracy']
  )

  let train = async () => {
    let error = await model.fit(
      training.input,
      training.output,
      128,
      10,
      undefined,
      1,
      false,
    )
    console.log('trained!', error)
  }

  await train()

  g.train = train

  g.perd = await model.predict(testing.input)

  console.log(await (global as any).perd.toString())

}
let done = (res: any) => console.log(res)
test().then(done).catch(done)
