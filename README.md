# syft.js

## Resources
  - [Setup Repo](./docs/setup.md)
  - [Interactive Console](./docs/interactive-console.md)
  - [Contribute](./docs/contribute.md)
  - [TypeScript Style Guidelines](./docs/style-guidelines.md)
  - [MNIST Tutorial](https://github.com/OpenMined/tutorials/tree/master/beginner/Syft.js/getting-started-mnist-model)

## install with npm from github
```
$ npm install --save OpenMined/syft.js#master
```

TypeScript example:
```javascript
import * as syft from 'syft'
```

JavaScript example:
```javascript
const syft = require('syft')

let t = await syft.FloatTensor.create([
  [1,2],
  [3,4]
])

console.log(await t.toString())
```
