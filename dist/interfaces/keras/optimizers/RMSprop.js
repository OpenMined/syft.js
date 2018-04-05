"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class RMSprop {
    constructor({ lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0 }) {
        this.hyperparameters = { lr, rho, epsilon, decay };
    }
    async create(syftParams) {
        this.syftOptim = await syft.Optimizer.RMSProp.create(Object.assign({ params: syftParams }, this.hyperparameters));
    }
}
exports.RMSprop = RMSprop;
//# sourceMappingURL=RMSprop.js.map