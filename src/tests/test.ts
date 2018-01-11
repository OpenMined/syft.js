import * as syft from '..'

async function test() {

  let a = new syft.FloatTensor([
    [
      [1,1,1],
      [1,1,1]
    ],
    [
      [1,1,1],
      [1,1,1]
    ]
  ])

  let b = new syft.FloatTensor([
    [
      [2,2,2],
      [2,2,2]
    ],
    [
      [2,2,2],
      [2,2,2]
    ]
  ])

  let c = await a.__add__(b)

  return c
}



test().then(
  val => console.log('done', val),
  err => console.log('error', err)
)
