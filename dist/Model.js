"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Async = require("promasync");
const controller = require("./controller");
const asserts_1 = require("./asserts");
const AsyncClass_1 = require("./AsyncClass");
class Model extends AsyncClass_1.AsyncInstance {
    constructor() {
        super(...arguments);
        this.type = 'model';
        this.layerType = '(unknown)';
        this.outputShape = '(dynamic)';
    }
    static assertLayerType(a, b) {
        if (a.toLowerCase() !== b.name.toLowerCase()) {
            throw new TypeError(`Connat Convert '${a}' to '${b.name}'`);
        }
    }
    static newModel($, id, type) {
        AsyncClass_1.AsyncInstance.assertCallable($);
        switch (type) {
            case 'policy':
                return new Policy(AsyncClass_1.AsyncInstance, id);
            case 'sequential':
                return new Sequential(AsyncClass_1.AsyncInstance, id);
            case 'linear':
                return new Linear(AsyncClass_1.AsyncInstance, id);
            case 'relu':
                return new ReLU(AsyncClass_1.AsyncInstance, id);
            case 'dropout':
                return new Dropout(AsyncClass_1.AsyncInstance, id);
            case 'sigmoid':
                return new Sigmoid(AsyncClass_1.AsyncInstance, id);
            case 'softmax':
                return new Softmax(AsyncClass_1.AsyncInstance, id);
            case 'logsoftmax':
                return new LogSoftmax(AsyncClass_1.AsyncInstance, id);
            case 'log':
                return new Log(AsyncClass_1.AsyncInstance, id);
            case 'tanh':
                return new Tanh(AsyncClass_1.AsyncInstance, id);
            case 'mseloss':
                return new MSELoss(AsyncClass_1.AsyncInstance, id);
            case 'nllloss':
                return new NLLLoss(AsyncClass_1.AsyncInstance, id);
            case 'crossentropyloss':
                return new CrossEntropyLoss(AsyncClass_1.AsyncInstance, id);
            case 'categorical_crossentropy':
                return new Categorical_CrossEntropy(AsyncClass_1.AsyncInstance, id);
            default:
                throw new Error(`Unkown Model Type: ${type}`);
        }
    }
    static async getModelType(id) {
        return asserts_1.assertType(await controller.sendJSON({
            functionCall: 'model_type',
            objectType: 'model',
            objectIndex: id,
            tensorIndexParams: []
        }, 'string'), 'string');
    }
    static async getModel(id) {
        let type = await Model.getModelType(id);
        return Model.newModel(AsyncClass_1.AsyncInstance, id, type);
    }
    static async createModel(layerConstructor, ...params) {
        let layerType = layerConstructor.name.toLowerCase();
        return asserts_1.assertType(await controller.sendJSON({
            functionCall: 'create',
            objectType: 'model',
            tensorIndexParams: [layerType, ...params]
        }, 'string'), 'string');
    }
    async feed(...args) {
        let self = this;
        self.ready();
        return self.forward(...args);
    }
    async parameters() {
        let self = this;
        self.ready();
        return asserts_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'params'
        }), 'FloatTensor_list'), Array);
    }
    async num_parameters() {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'param_count'
        }), 'int');
    }
    async models() {
        let self = this;
        self.ready();
        return asserts_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'models'
        }), 'Model_list'), Array);
    }
    async set_id(new_id) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'set_id',
            tensorIndexParams: [new_id]
        }), 'string');
        self.id = new_id;
        return self;
    }
    async fit(input, target, criterion, optim, batch_size, iters = 15, log_interval = 200, metrics = [], verbose = true) {
        let self = this;
        self.ready();
        let num_batches = asserts_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'prepare_to_fit',
            tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
        }), 'int'), 'number');
        let loss = 100000;
        for (let iter = 0; iter < iters; iter++) {
            for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
                console.log(`iter ${iter}/${iters}\n log_i ${log_i}/${log_interval}`);
                let prev_loss = loss;
                let _loss = asserts_1.assertType(await controller.sendJSON(self.cmd({
                    functionCall: 'fit',
                    tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
                }), 'float'), 'number');
                if (_loss) {
                    loss = _loss;
                }
                if (Number.isNaN(loss) || Number.isNaN(prev_loss)) {
                    break;
                }
            }
            if (Number.isNaN(loss)) {
                break;
            }
        }
        return loss;
    }
    async fitOld(input, target, criterion, optim, batch_size, iters = 15, log_interval = 200, metrics = [], verbose = true) {
        let self = this;
        self.ready();
        let num_batches = asserts_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'prepare_to_fit',
            tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
        }), 'int'), 'number');
        console.log(`Number of Batches:${num_batches}`);
        let progress_bars = [];
        if (verbose) {
        }
        let start = Date.now();
        let loss = 100000;
        for (let iter = 0; iter < iters; iter++) {
            if (verbose) {
            }
            let iter_start = Date.now();
            for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
                let prev_loss = loss;
                let _loss = asserts_1.assertType(await controller.sendJSON(self.cmd({
                    functionCall: 'fit',
                    tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
                }), 'float'), 'number');
                if (_loss !== '0') {
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
                let elapsed = Date.now() - iter_start;
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
            let elapsed = Date.now() - start;
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
    }
    async summary(verbose = true, return_instead_of_print = false) {
        let self = this;
        self.ready();
        let layerType = `${await self.getLayerType()}_${self.id} (${self.type})`;
        let outputShape = '';
        if (typeof self.outputShape === 'number') {
            outputShape = String(self.outputShape);
        }
        else {
            outputShape = String(self.outputShape);
        }
        let n_param = String(await self.num_parameters());
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
    }
    async length() {
        let self = this;
        self.ready();
        return (await self.models()).length;
    }
    async activation() {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'activation'
        }), 'FloatTensor');
    }
    async getLayerType() {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'model_type'
        }), 'string');
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id || '-1', tensorIndexParams: [] }, options);
    }
    async forward(...input) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: input.map(t => t.id)
        }), 'FloatTensor');
    }
}
exports.Model = Model;
class Policy extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'policy';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(model, optimizer, stateType = 'discrete') {
        let id = await Model.createModel(this, model.id, optimizer.id);
        let policy = new this(AsyncClass_1.AsyncInstance, id);
        policy.stateType = stateType;
        return policy;
    }
    async sample(...input) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'sample',
            tensorIndexParams: input.map(t => t.id)
        }), 'IntTensor');
    }
    async parameters() {
        let self = this;
        self.ready();
        if (self.model) {
            return self.model.parameters();
        }
        return [];
    }
    async feed(...args) {
        let self = this;
        self.ready();
        if (self.stateType === 'discrete') {
            return self.sample(...args);
        }
        else if (self.stateType === 'continuous') {
            return self.forward(...args);
        }
        throw new Error(`Unknown State Type: ${self.stateType}`);
    }
}
Policy.$ = Policy;
exports.Policy = Policy;
class Sequential extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'sequential';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(layers) {
        let id = await Model.createModel(this);
        let model = new this(AsyncClass_1.AsyncInstance, id);
        if (Array.isArray(layers)) {
            for (let layer of layers) {
                await model.add(layer);
            }
        }
        return model;
    }
    async add(model) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'add',
            tensorIndexParams: [model.id]
        }));
    }
    async summary() {
        let self = this;
        self.ready();
        let single = '_________________________________________________________________\n';
        let header = 'Layer (type)                 Output Shape              Param #   \n';
        let double = '=================================================================\n';
        let non_trainable_params = 'Non-trainable params: 0' + '\n';
        let output = single + header + double;
        Async.each;
        let mods = await Async.map(await self.models(), async (m) => {
            return m.summary(false, true);
        });
        output += mods.join(single);
        output += double;
        console.log(output);
        return output;
    }
}
Sequential.$ = Sequential;
exports.Sequential = Sequential;
class Linear extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'linear';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(input_dim = 0, output_dim = 0, initializer = 'Xavier') {
        let id = await Model.createModel(this, String(input_dim), String(output_dim), initializer);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    async finish(id) {
        let self = this;
        self.id = id;
        let params = await self.parameters();
    }
}
Linear.$ = Linear;
exports.Linear = Linear;
class ReLU extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'relu';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
ReLU.$ = ReLU;
exports.ReLU = ReLU;
class Dropout extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'dropout';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(rate = 0.5) {
        let id = await Model.createModel(this, String(rate));
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
Dropout.$ = Dropout;
exports.Dropout = Dropout;
class Sigmoid extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'sigmoid';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
Sigmoid.$ = Sigmoid;
exports.Sigmoid = Sigmoid;
class Softmax extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'softmax';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
Softmax.$ = Softmax;
exports.Softmax = Softmax;
class LogSoftmax extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'logsoftmax';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
LogSoftmax.$ = LogSoftmax;
exports.LogSoftmax = LogSoftmax;
class Log extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'log';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
Log.$ = Log;
exports.Log = Log;
class Tanh extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'tanh';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
}
Tanh.$ = Tanh;
exports.Tanh = Tanh;
class MSELoss extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'mseloss';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor');
    }
}
MSELoss.$ = MSELoss;
exports.MSELoss = MSELoss;
class NLLLoss extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'nllloss';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor');
    }
}
NLLLoss.$ = NLLLoss;
exports.NLLLoss = NLLLoss;
class CrossEntropyLoss extends Model {
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor');
    }
}
CrossEntropyLoss.$ = CrossEntropyLoss;
exports.CrossEntropyLoss = CrossEntropyLoss;
class Categorical_CrossEntropy extends Model {
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(AsyncClass_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor');
    }
}
Categorical_CrossEntropy.$ = Categorical_CrossEntropy;
exports.Categorical_CrossEntropy = Categorical_CrossEntropy;
//# sourceMappingURL=Model.js.map