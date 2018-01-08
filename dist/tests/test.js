"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const __1 = require("..");
function test() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let a = new __1.FloatTensor([
            [
                [1, 2, 3],
                [4, 5, 6]
            ],
            [
                [7, 8, 9],
                [10, 11, 12]
            ]
        ]);
        yield a.ready();
    });
}
test().then(val => console.log('done'), err => console.log('error', err));
//# sourceMappingURL=test.js.map