"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Async = require("promasync");
const controller = require("./controller");
const Tensor_1 = require("./Tensor");
const AsyncInit_1 = require("./AsyncInit");
class Model extends AsyncInit_1.AsyncInit {
    constructor(id, params = []) {
        super();
        this.type = 'model';
        this.layerType = '(unknown)';
        this.outputShape = '(dynamic)';
        let self = this;
        if (id) {
            self.__finish__(id);
        }
        else {
            controller.sendJSON(self.cmd({
                functionCall: 'create',
                tensorIndexParams: [self.layerType, ...params]
            }), 'string')
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
    }
    static getModel(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let layerType = yield controller.sendJSON({
                functionCall: 'model_type',
                objectType: 'model',
                objectIndex: id,
                tensorIndexParams: []
            });
            switch (layerType) {
                case 'linear':
                    return new Linear(id);
                case 'sigmoid':
                    return new Sigmoid(id);
                case 'crossentropyloss':
                    return new CrossEntropyLoss(id);
                case 'tanh':
                    return new Tanh(id);
                case 'dropout':
                    return new Dropout(id);
                case 'softmax':
                    return new Softmax(id);
                case 'logsoftmax':
                    return new LogSoftmax(id);
                case 'relu':
                    return new ReLU(id);
                case 'log':
                    return new Log(id);
                case 'policy':
                    return new Policy(id);
                default:
                    throw new Error(`Unsupported Layer Type: '${layerType}'.`);
            }
        });
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    __call__(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (args.length == 1) {
                return yield self.forward(args[0]);
            }
            else if (args.length == 2) {
                return yield self.forward(args[0], args[1]);
            }
            else if (args.length == 3) {
                return yield self.forward(args[0], args[1], args[2]);
            }
        });
    }
    parameters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'params'
            }), 'FloatTensor_list');
        });
    }
    num_parameters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'param_count'
            }), 'int');
        });
    }
    models() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'models'
            }), 'Model_list');
        });
    }
    set_id(new_id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'set_id',
                tensorIndexParams: [new_id]
            }), 'string');
            self.id = new_id;
            return self;
        });
    }
    fit(input, target, criterion, optim, batch_size, iters = 15, log_interval = 200, metrics = [], verbose = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (Array.isArray(input)) {
                input = new Tensor_1.FloatTensor(input, autograd = true);
            }
            if (Array.isArray(target)) {
                target = new Tensor_1.FloatTensor(target, autograd = true);
            }
            let num_batches = yield controller.sendJSON(self.cmd({
                functionCall: 'prepare_to_fit',
                tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
            }), 'int');
            console.log(`Number of Batches:${num_batches}`);
            let progress_bars = [];
            if (verbose) {
            }
            let start = time.time();
            let loss = 100000;
            for (let iter = 0; iter < iters; iter++) {
                if (verbose) {
                }
                let iter_start = time.time();
                for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
                    let prev_loss = loss;
                    let _loss = yield controller.sendJSON(self.cmd({
                        functionCall: 'fit',
                        tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
                    }), 'float');
                    if (_loss != '0') {
                        loss = _loss;
                    }
                    if (Number.isNaN(loss) || Number.isNaN(prev_loss)) {
                        if (verbose) {
                        }
                        break;
                    }
                    else if (loss > prev_loss) {
                        if (verbose) {
                        }
                    }
                    else {
                        if (verbose) {
                        }
                    }
                    let elapsed = time.time() - iter_start;
                    let pace = elapsed / (log_i + 1);
                    let remaining = Math.floor((num_batches - log_i - 1) * pace);
                    let remainingStr = '';
                    if (remaining > 60) {
                        remainingStr += Math.floor(remaining / 60) + 'm' + (remaining % 60) + 's';
                    }
                    else {
                        remainingStr += remaining + 's';
                    }
                    if (verbose) {
                    }
                }
                if (verbose) {
                }
                let elapsed = time.time() - start;
                let pace = elapsed / (iter + 1);
                let remaining = Math.floor((iters - iter - 1) * pace);
                let remainingStr = '';
                if (remaining > 60) {
                    remainingStr += Math.floor(remaining / 60) + 'm' + (remaining % 60) + 's';
                }
                else {
                    remainingStr += remaining + 's';
                }
                if (verbose) {
                }
                if (Number.isNaN(loss)) {
                    break;
                }
            }
            if (verbose) {
            }
            return loss;
        });
    }
    summary(verbose = true, return_instead_of_print = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let layerType = `${yield self.getLayerType()}_${self.id} (${self.type})`;
            let outputShape = '';
            if (typeof self.outputShape == 'number') {
                outputShape = String(self.outputShape);
            }
            else {
                outputShape = String(self.outputShape);
            }
            let n_param = String(yield self.num_parameters());
            let output = layerType + ' '.repeat(29 - layerType.length) + outputShape + ' '.repeat(26 - outputShape.length) + n_param + '\n';
            if (verbose) {
                let single = '_________________________________________________________________\n';
                let header = 'Layer (type)                 Output Shape              Param #   \n';
                let double = '=================================================================\n';
                let non_trainable_params = 'Non-trainable params: 0' + '\n';
            }
            if (return_instead_of_print) {
                return output;
            }
            console.log(output);
            return;
        });
    }
    __len__() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return (yield self.models()).length;
        });
    }
    __getitem__(idx) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return (yield self.parameters())[idx];
        });
    }
    activation() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'activation'
            }), 'FloatTensor');
        });
    }
    getLayerType() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'model_type'
            }), 'string');
        });
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id || '-1', tensorIndexParams: [] }, options);
    }
    forward(...input) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'forward',
                tensorIndexParams: input.map(t => t.id)
            }), 'FloatTensor');
        });
    }
    __repr__(verbose = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (verbose) {
                let output = '';
                output += self.__repr__(false) + '\n';
                for (let p of yield self.parameters()) {
                    output += '\t W:' + p.__repr__(false);
                }
                let activation = yield self.activation();
                if (activation) {
                    output += '\t A:' + activation.__repr__(verbose = false) + '\n';
                }
                return output;
            }
            else {
                return `<syft.nn.${self.layerType} at ${self.id}>`;
            }
        });
    }
}
exports.Model = Model;
class Policy extends Model {
    constructor(id, model, optimizer, stateType = 'discrete') {
        super(void 0, [model.id, optimizer.id]);
        this.layerType = 'policy';
        let self = this;
        self.stateType = stateType;
        self.model = model;
        self.optimizer = optimizer;
    }
    sample(...input) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sample',
                tensorIndexParams: input.map(t => t.id)
            }), 'IntTensor');
        });
    }
    parameters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return self.model.parameters();
        });
    }
    __call__(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (self.stateType == 'discrete') {
                self.sample(...args);
            }
            else if (self.stateType == 'continuous') {
                self.forward(...args);
            }
            else {
                console.log(`Error: State type ${self.stateType} unknown`);
            }
        });
    }
    history() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let raw_history = yield controller.sendJSON(self.cmd({
                functionCall: 'get_history'
            }), 'string');
            let losses = [];
            let rewards = [];
            for (let { loss, reward } of history_idx) {
                if (loss != -1) {
                    losses.push(yield controller.get_tensor(loss));
                }
                else {
                    losses.push(void 0);
                }
                if (reward != -1) {
                    rewards.push(yield controller.get_tensor(reward));
                }
                else {
                    rewards.push(void 0);
                }
            }
            return [losses, rewards];
        });
    }
}
exports.Policy = Policy;
class Sequential extends Model {
    constructor(layers) {
        super(void 0);
        this.layerType = 'sequential';
        let self = this;
        if (Array.isArray(layers)) {
            for (let layer of layers) {
                self.add(layer);
            }
        }
    }
    add(model) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'add',
                tensorIndexParams: [model.id]
            }));
        });
    }
    summary() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let single = '_________________________________________________________________\n';
            let header = 'Layer (type)                 Output Shape              Param #   \n';
            let double = '=================================================================\n';
            let non_trainable_params = 'Non-trainable params: 0' + '\n';
            let output = single + header + double;
            Async.each;
            let mods = yield Async.map(yield self.models(), (m) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                return yield m.summary(false, true);
            }));
            output += mods.join(single);
            output += double;
            console.log(output);
        });
    }
    __repr__() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let output = '';
            for (let m of yield self.models()) {
                output += m.__repr__();
            }
            return output;
        });
    }
    __getitem__(idx) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return (yield self.models())[idx];
        });
    }
}
exports.Sequential = Sequential;
class Linear extends Model {
    constructor(id, input_dim = 0, output_dim = 0, initializer = 'Xavier') {
        super(void 0, [input_dim, output_dim, initializer]);
        this.layerType = 'linear';
    }
    finish(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.id = id;
            yield self.ready();
            let params = yield self.parameters();
        });
    }
}
exports.Linear = Linear;
class ReLU extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'relu';
    }
}
exports.ReLU = ReLU;
class Dropout extends Model {
    constructor(id, rate = 0.5) {
        super(id, [rate]);
        this.layerType = 'dropout';
    }
}
exports.Dropout = Dropout;
class Sigmoid extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'sigmoid';
    }
}
exports.Sigmoid = Sigmoid;
class Softmax extends Model {
    constructor(id, dim = 1) {
        super(id, [dim]);
        this.layerType = 'softmax';
    }
}
exports.Softmax = Softmax;
class LogSoftmax extends Model {
    constructor(id, dim = 1) {
        super(id, [dim]);
        this.layerType = 'logsoftmax';
    }
}
exports.LogSoftmax = LogSoftmax;
class Log extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'log';
    }
}
exports.Log = Log;
class Tanh extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'tanh';
    }
}
exports.Tanh = Tanh;
class MSELoss extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'mseloss';
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'forward',
                tensorIndexParams: [input.id, target.id]
            }), 'FloatTensor');
        });
    }
}
exports.MSELoss = MSELoss;
class NLLLoss extends Model {
    constructor(id) {
        super(id);
        this.layerType = 'nllloss';
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'forward',
                tensorIndexParams: [input.id, target.id]
            }), 'FloatTensor');
        });
    }
}
exports.NLLLoss = NLLLoss;
class CrossEntropyLoss extends Model {
    constructor(id, dim = 1) {
        super(id, [dim]);
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'forward',
                tensorIndexParams: [input.id, target.id]
            }), 'FloatTensor');
        });
    }
}
exports.CrossEntropyLoss = CrossEntropyLoss;
//# sourceMappingURL=Model.js.map