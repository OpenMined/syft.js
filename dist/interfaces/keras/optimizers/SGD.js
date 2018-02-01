"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class SGD {
    constructor(hyperparameters) {
        let self = this;
        self.hyperparameters = hyperparameters;
    }
    async create(syft_params) {
        let self = this;
        self.syft_optim = await syft.Optimizer.SGD.create(syft_params, self.hyperparameters);
    }
}
exports.SGD = SGD;
//# sourceMappingURL=SGD.js.map