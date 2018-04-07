# syft.js

## Resources
  - [Setup Repo](./readmes/setup.md)
  - [Interactive Console](./readmes/interactive-console.md)
  - [Contribute](./readmes/contribute.md)
  - [TypeScript Style Guidelines](./readmes/style-guidelines.md)

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
