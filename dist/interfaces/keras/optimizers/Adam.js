"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Adam {
    constructor({ lr = 0.01, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-6, decay = 0 }) {
        this.hyperparameters = { lr, beta1, beta2, epsilon, decay };
    }
    async compile(syftParams) {
        this.syftOptim = await syft.Optimizer.Adam.create(Object.assign({ params: syftParams }, this.hyperparameters));
    }
}
exports.Adam = Adam;
//# sourceMappingURL=Adam.js.map