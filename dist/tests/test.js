"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
controller.send_json(JSON.stringify({
    functionCall: 'test',
    objectType: 'test',
    objectIndex: '-1',
    tensorIndexParams: ['test']
}), true)
    .then(res => console.log(res), res => console.log('error', res));
//# sourceMappingURL=test.js.map