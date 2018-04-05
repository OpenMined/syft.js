"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Dense {
    constructor({ activation, inputShape, outputShape }) {
        this.orderedSyft = [];
        this.activationStr = activation;
        this.inputShape = inputShape;
        this.outputShape = this.outputShape;
    }
    async create() {
        this.syftLayer = await syft.Model.Linear.create(this.inputShape, this.outputShape);
        this.orderedSyft.push(this.syftLayer);
        if (this.activationStr != null && this.activationStr !== 'linear') {
            if (this.activationStr === 'relu') {
                this.syftActivation = await syft.Model.ReLU.create();
            }
            else if (this.activationStr === 'softmax') {
                this.syftActivation = await syft.Model.Softmax.create();
            }
            else if (this.activationStr === 'sigmoid') {
                this.syftActivation = await syft.Model.Sigmoid.create();
            }
            else if (this.activationStr === 'tanh') {
                this.syftActivation = await syft.Model.Tanh.create();
            }
        }
        if (this.syftActivation) {
            this.orderedSyft.push(this.syftActivation);
        }
        return this;
    }
}
exports.Dense = Dense;
//# sourceMappingURL=Dense.js.map