"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class _Dense {
    constructor(units, input_shape, activation) {
        this.ordered_syft = [];
        let self = this;
        self.units = units;
        self.input_shape = input_shape;
        self.output_shape = self.units;
        self.activation_str = activation;
    }
    static async create(units, input_shape, activation) {
        let model = new this(units, input_shape, activation);
        model.syft_model = await syft.Model.Linear.create(model.input_shape, model.units);
        model.ordered_syft.push(model.syft_model);
        if (model.activation_str != null && model.activation_str != "linear") {
            if (model.activation_str == 'relu') {
                model.syft_activation = await syft.Model.ReLU.create();
            }
            else if (model.activation_str == 'softmax') {
                model.syft_activation = await syft.Model.Softmax.create();
            }
            else if (model.activation_str == 'sigmoid') {
                model.syft_activation = await syft.Model.Sigmoid.create();
            }
            else if (model.activation_str == 'tanh') {
                model.syft_activation = await syft.Model.Tanh.create();
            }
        }
        if (model.syft_activation) {
            model.ordered_syft.push(model.syft_activation);
        }
        return model;
    }
}
exports._Dense = _Dense;
async function Dense(units, input_shape, activation) {
    return _Dense.create(units, input_shape, activation);
}
exports.Dense = Dense;
//# sourceMappingURL=Dense.js.map