"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class SGD {
    constructor({ lr = 0.01, momentum = 0, decay = 0 }) {
        this.hyperparameters = { lr, momentum, decay };
    }
    async create(syftParams) {
        this.syftOptim = await syft.Optimizer.SGD.create(Object.assign({ params: syftParams }, this.hyperparameters));
    }
}
exports.SGD = SGD;
//# sourceMappingURL=SGD.js.map