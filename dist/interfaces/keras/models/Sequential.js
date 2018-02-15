"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Sequential {
    constructor() {
        this.layers = [];
        this.metrics = [];
        this.compiled = false;
    }
    async add(layer) {
        let self = this;
        if (self.layers.length > 0) {
            layer.input_shape = self.layers[self.layers.length - 1].output_shape;
            if (layer.output_shape == null) {
                layer.output_shape = layer.input_shape;
            }
            await layer.create();
        }
        self.layers.push(layer);
    }
    async compile(loss, optimizer, metrics = []) {
        let self = this;
        if (!self.compiled) {
            self.compiled = true;
            self.syft_model = await syft.Model.Sequential.create();
            for (let layer of self.layers) {
                for (let l of layer.ordered_syft) {
                    self.syft_model.add(l);
                }
            }
            if (loss === 'categorical_crossentropy') {
                self.loss = await syft.Model.Categorical_CrossEntropy.create();
            }
            else if (loss === 'mean_squared_error') {
                self.loss = await syft.Model.MSELoss.create();
            }
            self.optimizer = optimizer;
            self.metrics = metrics;
            self.optimizer.create(await self.syft_model.parameters());
        }
        else {
            console.warn('Warning: Model already compiled... please rebuild from scratch if you need to change things');
        }
        return self;
    }
    async summary() {
    }
    async fit(x_train, y_train, batch_size, epochs = 1, validation_data = null, log_interval = 1, verbose = false) {
        let self = this;
        if (self.syft_model == null ||
            self.loss == null ||
            self.optimizer == null ||
            self.optimizer.syft_optim == null) {
            throw new Error('Not Compiled');
        }
        return self.syft_model.fit(x_train, y_train, self.loss, self.optimizer.syft_optim, batch_size, epochs, log_interval, self.metrics, verbose);
    }
    async evaluate(test_input, test_target, batch_size, metrics = [], verbose = true) {
    }
    async predict(x) {
        let self = this;
        if (self.syft_model == null ||
            self.loss == null ||
            self.optimizer == null) {
            throw new Error('Not Compiled');
        }
        return (await self.syft_model.forward(x)).to_numpy();
    }
    async get_weights() {
        let self = this;
        if (self.syft_model == null ||
            self.loss == null ||
            self.optimizer == null) {
            throw new Error('Not Compiled');
        }
        return self.syft_model.parameters();
    }
    async to_json() {
    }
}
exports.Sequential = Sequential;
//# sourceMappingURL=Sequential.js.map