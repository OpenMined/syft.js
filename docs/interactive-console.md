# Interactive Console
Use NodeJS and Chrome Inspector as an interactive console to play around with syft.js.

## Prerequisites
  - [Setup Open Mined Unity Project]()
  - [Setup Syft.js Repo](setup.md)

# Step 1
Open a Terminal window and negative to the `syft.js` repo.

# Step 2
Run node in inspect mode.
```
$ node --inspect .
```
![Start NodeJS](./img/start-node.png)

# Step 3
Open Chrome and negative to `chrome://inspect`,
then click on *inspect* near `path/to/syft.js`.
![Open Chrome Inspector](./img/chrome-inspector.png)

# Step 4
Import `syft.js` by typing `syft = require('.')`
![Import Syft.js](./img/interactive-console.png)

# Step 5
Explore Test and Play around with `syft.js`.
