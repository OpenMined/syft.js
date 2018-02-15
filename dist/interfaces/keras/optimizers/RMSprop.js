"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class RMSprop {
    constructor(lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0) {
        this.hyperparameters = [lr, rho, epsilon, decay];
    }
    async create(syft_params) {
        let self = this;
        self.syft_optim = await syft.Optimizer.RMSProp.create(syft_params, ...self.hyperparameters);
    }
}
exports.RMSprop = RMSprop;
//# sourceMappingURL=RMSprop.js.map