import {FloatTensor} from '..'

async function test() {

  let a = new FloatTensor([
    [
      [1,2,3],
      [4,5,6]
    ],
    [
      [7,8,9],
      [10, 11, 12]
    ]
  ])

  await a.ready()
}



test().then(
  val => console.log('done'),
  err => console.log('error', err)
)
