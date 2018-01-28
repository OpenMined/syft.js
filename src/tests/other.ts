

function arrMul<T>(
  arr: T[],
  n: number
) {
  let res: T[] = []
  for (let i = 0; i < n; i++) {
    res = res.concat(arr);
  }
  return res
}

import * as syft from '..'
;(global as any).syft = syft

async function test() {
  let training = {
    input: await syft.FloatTensor.create(arrMul([[0,0,1],[0,1.0,1],[1,0,1],[1,1,1]], 2000)),
    output: await syft.FloatTensor.create(arrMul([[0,0],[0,0],[0,1],[0,1]], 2000)),
  }
  // let testing = {
  //   input: await syft.FloatTensor.create(dataset.test.input),
  //   output: await syft.FloatTensor.create(dataset.test.output),
  // }

  let model = await syft.Sequential.create([
    await syft.Linear.create(3, 4),
    await syft.Tanh.create(),
    await syft.Linear.create(4, 2),
    await syft.Softmax.create(1),
    await syft.Log.create()
  ])

  ;(global as any).model = model

  let loss = await syft.NLLLoss.create()
  let optim = await syft.SGD.create(await model.parameters())
  let metric = ['accuracy']

  let train = async () => {
    let error = await model.fit(
      training.input,
      training.output,
      loss,
      optim,
      100,
      10,
      1,
      metric,
      true
    )
    console.log('trained!', error)
  }

  await train()

  ;(global as any).train = train

  ;(global as any).perd = await model.forward(training.input)

  console.log(await (global as any).perd.toString())

}

test()
