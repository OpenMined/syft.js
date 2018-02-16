"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Dense {
    constructor(activation, units, input_shape) {
        this.ordered_syft = [];
        let self = this;
        self.units = units;
        self.input_shape = input_shape;
        self.output_shape = self.units;
        self.activation_str = activation;
    }
    async create() {
        let self = this;
        self.syft_layer = await syft.Model.Linear.create(self.input_shape, self.units);
        self.ordered_syft.push(self.syft_layer);
        if (self.activation_str != null && self.activation_str !== 'linear') {
            if (self.activation_str === 'relu') {
                self.syft_activation = await syft.Model.ReLU.create();
            }
            else if (self.activation_str === 'softmax') {
                self.syft_activation = await syft.Model.Softmax.create();
            }
            else if (self.activation_str === 'sigmoid') {
                self.syft_activation = await syft.Model.Sigmoid.create();
            }
            else if (self.activation_str === 'tanh') {
                self.syft_activation = await syft.Model.Tanh.create();
            }
        }
        if (self.syft_activation) {
            self.ordered_syft.push(self.syft_activation);
        }
        return self;
    }
}
exports.Dense = Dense;
//# sourceMappingURL=Dense.js.map