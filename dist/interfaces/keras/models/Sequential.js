"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syft = require("../../../syft");
class Sequential {
    constructor(layers = []) {
        this.layers = [];
        this.metrics = [];
        this.compiled = false;
        for (let layer of layers) {
            this.add(layer);
        }
    }
    async add(layer) {
        if (this.compiled) {
            throw new Error('CANNOT add layers after model has been compiled.');
        }
        if (this.layers.length > 0) {
            layer.inputShape = this.layers[this.layers.length - 1].outputShape;
            if (layer.outputShape == null) {
                layer.outputShape = layer.inputShape;
            }
        }
        this.layers.push(layer);
        return this;
    }
    async compile({ loss, optimizer, metrics = [] }) {
        if (!this.compiled) {
            this.compiled = true;
            this.syftModel = await syft.Model.Sequential.create();
            for (let layer of this.layers) {
                for (let l of layer.orderedSyft) {
                    await layer.create();
                    this.syftModel.add(l);
                }
            }
            if (loss === 'categorical_crossentropy') {
                this.loss = await syft.Model.Categorical_CrossEntropy.create();
            }
            else if (loss === 'meanSquared_error') {
                this.loss = await syft.Model.MSELoss.create();
            }
            await optimizer.create(await this.syftModel.parameters());
            this.optimizer = optimizer;
            this.metrics = metrics;
        }
        else {
            console.warn('Warning: Model already compiled... please rebuild from scratch if you need to change things');
        }
        return this;
    }
    async summary() {
    }
    async fit({ input, target, batchSize, epochs = 1, validationData, logInterval = 1, verbose = false }) {
        if (this.syftModel == null ||
            this.loss == null ||
            this.optimizer == null ||
            this.optimizer.syftOptim == null) {
            throw new Error('Not Compiled');
        }
        return this.syftModel.fit({
            input,
            target,
            criterion: this.loss,
            optimizer: this.optimizer.syftOptim,
            batchSize,
            iterations: epochs,
            logInterval,
            metrics: this.metrics,
            verbose
        });
    }
    async evaluate({ testInput, testTarget, batchSize, metrics = [], verbose = false }) {
    }
    async predict(x) {
        if (this.syftModel == null ||
            this.loss == null ||
            this.optimizer == null) {
            throw new Error('Not Compiled');
        }
        return (await this.syftModel.forward(x));
    }
    async getWeights() {
        if (this.syftModel == null ||
            this.loss == null ||
            this.optimizer == null) {
            throw new Error('Not Compiled');
        }
        return this.syftModel.parameters();
    }
    async getJSON() {
    }
}
exports.Sequential = Sequential;
//# sourceMappingURL=Sequential.js.map