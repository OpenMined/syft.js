# syft.js

## Resources
  - [Setup Repo](./docs/setup.md)
  - [Interactive Console](./docs/interactive-console.md)
  - [Contribute](./docs/contribute.md)
  - [TypeScript Style Guidelines](./docs/style-guidelines.md)

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

let t = new Tensor([
  [1,2],
  [3,4]
])

t.ready()
  .then(() => {
    console.log('ready', t)
  })
  .catch((err) => {
    console.log('error', err)
  })
```
