"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Adam {
    constructor(lr = 0.01, beta_1 = 0.9, beta_2 = 0.999, epsilon = 1e-6, decay = 0) {
        this.hyperparameters = [lr, beta_1, beta_2, epsilon, decay];
    }
    async create(syft_params) {
        let self = this;
        self.syft_optim = await syft.Optimizer.Adam.create(syft_params, ...self.hyperparameters);
    }
}
exports.Adam = Adam;
//# sourceMappingURL=Adam.js.map