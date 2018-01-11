"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const syft = require("..");
function test() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let a = new syft.FloatTensor([
            [
                [1, 1, 1],
                [1, 1, 1]
            ],
            [
                [1, 1, 1],
                [1, 1, 1]
            ]
        ]);
        let b = new syft.FloatTensor([
            [
                [2, 2, 2],
                [2, 2, 2]
            ],
            [
                [2, 2, 2],
                [2, 2, 2]
            ]
        ]);
        let c = yield a.__add__(b);
        return c;
    });
}
test().then(val => console.log('done', val), err => console.log('error', err));
//# sourceMappingURL=test.js.map