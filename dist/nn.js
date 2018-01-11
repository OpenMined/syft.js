"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const promasync_1 = require("promasync");
const controller = require("./controller");
const Tensor_1 = require("./Tensor");
const AsyncInit_1 = require("./AsyncInit");
class Model extends AsyncInit_1.AsyncInit {
    constructor(id, layer_type, params = []) {
        super();
        let self = this;
        self.params = false;
        self._layer_type = layer_type;
        self.type = 'model';
        self.output_shape = '(dynamic)';
        if (id) {
            self.__finish__(id);
        }
        else {
            controller.send_json(self.cmd('create', [self._layer_type, ...params]))
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    discover() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            self._layer_type = yield self.layer_type();
            if (self._layer_type == 'linear') {
                return new Linear(self.id);
            }
            else if (self._layer_type == 'sigmoid') {
                return new Sigmoid(self.id);
            }
            else if (self._layer_type == 'crossentropyloss') {
                return new CrossEntropyLoss(self.id);
            }
            else if (self._layer_type == 'tanh') {
                return new Tanh(self.id);
            }
            else if (self._layer_type == 'dropout') {
                return new Dropout(self.id);
            }
            else if (self._layer_type == 'softmax') {
                return new Softmax(self.id);
            }
            else if (self._layer_type == 'logsoftmax') {
                return new LogSoftmax(self.id);
            }
            else if (self._layer_type == 'relu') {
                return new ReLU(self.id);
            }
            else if (self._layer_type == 'log') {
                return new Log(self.id);
            }
            else if (self._layer_type == 'policy') {
                return new Policy(self.id);
            }
            else {
                console.log('Attempted to discover the type - but it wasn\'t supported. Has the layer type '
                    + self._layer_type + ' been added to the discover() method in nn.js?');
            }
        });
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
            return controller.no_params_func(self.cmd, 'params', 'FloatTensor_list', false);
        });
    }
    num_parameters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.no_params_func(self.cmd, 'param_count', 'int');
        });
    }
    models() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.no_params_func(self.cmd, 'models', 'Model_list');
        });
    }
    set_id(new_id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            yield controller.params_func(self.cmd, 'set_id', [new_id], 'string');
            self.id = new_id;
            return self;
        });
    }
    fit(input, target, criterion, optim, batch_size, iters = 15, log_interval = 200, metrics = [], verbose = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (Array.isArray(input)) {
                input = new Tensor_1.FloatTensor(input, autograd = true, delete_after_use = false);
            }
            if (Array.isArray(target)) {
                target = new Tensor_1.FloatTensor(target, autograd = true, delete_after_use = false);
            }
            let num_batches = yield controller.params_func(self.cmd, 'prepare_to_fit', [input.id, target.id, criterion.id, optim.id, batch_size], return_type = 'int');
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
                    let _loss = yield controller.params_func(self.cmd, 'fit', [log_i, Math.min(log_i + log_interval, num_batches), 1], return_type = 'float');
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
            let layer_type = `${yield self.layer_type()}_${self.id} (${self.type})`;
            let output_shape = '';
            if (typeof self.output_shape == 'number') {
                output_shape = String(self.output_shape);
            }
            else {
                output_shape = String(self.output_shape);
            }
            let n_param = String(yield self.num_parameters());
            let output = layer_type + ' '.repeat(29 - layer_type.length) + output_shape + ' '.repeat(26 - output_shape.length) + n_param + '\n';
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
            return controller.no_params_func(self.cmd, 'activation', 'FloatTensor', delete_after_use = false);
        });
    }
    layer_type() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.no_params_func(self.cmd, 'model_type', 'string');
        });
    }
    cmd(function_call, params = []) {
        let self = this;
        return {
            functionCall: function_call,
            objectType: self.type,
            objectIndex: self.id,
            tensorIndexParams: params
        };
    }
    forward(input) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.params_func(self.cmd, 'forward', [input.id], 'FloatTensor', false);
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
                return `<syft.nn.${self._layer_type} at ${self.id}>`;
            }
        });
    }
}
exports.Model = Model;
class Policy extends Model {
    constructor(model, optimizer, state_type = 'discrete') {
        super(, 'policy', [model.id, optimizer.id]);
        let self = this;
        self.state_type = state_type;
        self.optimizer = optimizer;
    }
    sample(input) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.params_func(self.cmd, 'sample', [input.id], return_type = 'IntTensor');
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
            if (self.state_type == 'discrete') {
                if (args.length == 1) {
                    return self.sample(args[0]);
                }
                else if (args.length == 2) {
                    return self.sample(args[0], args[1]);
                }
                else if (args.length == 3) {
                    return self.sample(args[0], args[1], args[2]);
                }
            }
            else if (self.state_type == 'continuous') {
                if (args.length == 1) {
                    return self.forward(args[0]);
                }
                else if (args.length == 2) {
                    return self.forward(args[0], args[1]);
                }
                else if (args.length == 3) {
                    return self.forward(args[0], args[1], args[2]);
                }
            }
            else {
                console.log(`Error: State type ${self.state_type} unknown`);
            }
        });
    }
    history() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let raw_history = yield controller.params_func(self.cmd, 'get_history', [], return_type = 'string');
            let history_idx = list(map(lambda, x, list(map(lambda, y, int(y), x.split(','))), raw_history[2], -1, split('],[')));
            let losses = [];
            let rewards = [];
            for (let loss, reward of history_idx) {
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
        super(, 'sequential');
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
            yield controller.params_func(self.cmd, 'add', [model.id], delete_after_use = false);
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
            let mods = promasync_1.default.forEach(yield self.models(), (m) => tslib_1.__awaiter(this, void 0, void 0, function* () {
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
            for (let m of yield self.models())
                : output += m.__repr__();
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
    constructor(input_dim = 0, output_dim = 0, id, initializer = 'Xavier') {
        super(, 'linear', [input_dim, output_dim, initializer]);
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
        super(id, 'relu');
    }
}
exports.ReLU = ReLU;
class Dropout extends Model {
    constructor(id, rate = 0.5) {
        super(id, 'dropout', [rate]);
    }
}
exports.Dropout = Dropout;
class Sigmoid extends Model {
    constructor(id) {
        super(id, 'sigmoid');
    }
}
exports.Sigmoid = Sigmoid;
class Softmax extends Model {
    constructor(id, dim = 1) {
        super(id, 'softmax', [dim]);
    }
}
exports.Softmax = Softmax;
class LogSoftmax extends Model {
    constructor(id, dim = 1) {
        super(id, 'logsoftmax', [dim]);
    }
}
exports.LogSoftmax = LogSoftmax;
class Log extends Model {
    constructor(id) {
        super(id, 'log');
    }
}
exports.Log = Log;
class Tanh extends Model {
    constructor(id) {
        super(id, 'tanh');
    }
}
exports.Tanh = Tanh;
class MSELoss extends Model {
    constructor(id) {
        super(id, 'mseloss');
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type = 'FloatTensor', delete_after_use = false);
        });
    }
}
exports.MSELoss = MSELoss;
class NLLLoss extends Model {
    constructor(id) {
        super(id, 'nllloss');
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type = 'FloatTensor', delete_after_use = false);
        });
    }
}
exports.NLLLoss = NLLLoss;
class CrossEntropyLoss extends Model {
    constructor(id, dim = 1) {
        super(id, 'crossentropyloss', [dim]);
    }
    forward(input, target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.params_func(self.cmd, 'forward', [input.id, target.id], return_type = 'FloatTensor', delete_after_use = false);
        });
    }
}
exports.CrossEntropyLoss = CrossEntropyLoss;
//# sourceMappingURL=nn.js.map