"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Adam {
    constructor(hyperparameters) {
        let self = this;
        self.hyperparameters = hyperparameters;
    }
    async create(syft_params) {
        let self = this;
        self.syft_optim = await syft.Optimizer.Adam.create(syft_params, self.hyperparameters);
    }
}
exports.Adam = Adam;
//# sourceMappingURL=Adam.js.map