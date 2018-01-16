import * as syft from '..'

let log = console.log.bind(console, 'logging:')

// async function test() {
//
//   let a = new syft.FloatTensor([
//     [
//       [1,1,1],
//       [1,1,1]
//     ],
//     [
//       [1,1,1],
//       [1,1,1]
//     ]
//   ])
//
//   let b = new syft.FloatTensor([
//     [
//       [2,2,2],
//       [2,2,2]
//     ],
//     [
//       [2,2,2],
//       [2,2,2]
//     ]
//   ])
//
//   let c = await a.__add__(b)
//
//   log(await c.toString())
//
//   return c
// }
//
//
//
// test().then(
//   val => console.log('done', val),
//   err => console.log('error', err)
// )

let ts = new syft.TensorSerializer

for (let i = 0; i < 5*5*5*5*5*9; i++) {
  let props = ts.decodeType(i)
  let type = ts.encodeType(props)

  if (type !== i) {
    log(i, '=>', type)
  }
}
log('done')
