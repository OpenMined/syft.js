"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("..");
let log = console.log.bind(console, 'logging:');
let ts = new syft.TensorSerializer;
for (let i = 0; i < 5 * 5 * 5 * 5 * 5 * 9; i++) {
    let props = ts.decodeType(i);
    let type = ts.encodeType(props);
    if (type !== i) {
        log(i, '=>', type);
    }
}
log('done');
let t = new syft.FloatTensor([[1, 2], [3, 4]]);
//# sourceMappingURL=test.js.map