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
    input: await syft.Tensor.FloatTensor.create(arrMul([[0,0,1],[0,1.0,1],[1,0,1],[1,1,1]], 2000)),
    output: await syft.Tensor.FloatTensor.create(arrMul([[0,0],[0,0],[0,1],[0,1]], 2000)),
  }
  // let testing = {
  //   input: await syft.FloatTensor.create(dataset.test.input),
  //   output: await syft.FloatTensor.create(dataset.test.output),
  // }

  let model = await syft.Model.Sequential.create([
    await syft.Model.Linear.create(3, 4),
    await syft.Model.Tanh.create(),
    await syft.Model.Linear.create(4, 2),
    await syft.Model.Softmax.create(1),
    await syft.Model.Log.create()
  ])

  ;(global as any).model = model

  let loss = await syft.Model.NLLLoss.create()
  let optim = await syft.Optimizer.SGD.create(await model.parameters())
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
