"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
const lib_1 = require("../lib");
const Tensor_1 = require("./Tensor");
class Model extends lib_1.AsyncInstance {
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
        lib_1.AsyncInstance.assertCallable($);
        switch (type) {
            case 'policy':
                return new this.Policy(lib_1.AsyncInstance, id);
            case 'sequential':
                return new this.Sequential(lib_1.AsyncInstance, id);
            case 'linear':
                return new this.Linear(lib_1.AsyncInstance, id);
            case 'relu':
                return new this.ReLU(lib_1.AsyncInstance, id);
            case 'dropout':
                return new this.Dropout(lib_1.AsyncInstance, id);
            case 'sigmoid':
                return new this.Sigmoid(lib_1.AsyncInstance, id);
            case 'softmax':
                return new this.Softmax(lib_1.AsyncInstance, id);
            case 'logsoftmax':
                return new this.LogSoftmax(lib_1.AsyncInstance, id);
            case 'log':
                return new this.Log(lib_1.AsyncInstance, id);
            case 'tanh':
                return new this.Tanh(lib_1.AsyncInstance, id);
            case 'mseloss':
                return new this.MSELoss(lib_1.AsyncInstance, id);
            case 'nllloss':
                return new this.NLLLoss(lib_1.AsyncInstance, id);
            case 'crossentropyloss':
                return new this.CrossEntropyLoss(lib_1.AsyncInstance, id);
            case 'categorical_crossentropy':
                return new this.Categorical_CrossEntropy(lib_1.AsyncInstance, id);
            default:
                throw new Error(`Unkown Model Type: ${type}`);
        }
    }
    static async getModelType(id) {
        return lib_1.assertType(await controller.sendJSON({
            functionCall: 'model_type',
            objectType: 'model',
            objectIndex: id,
            tensorIndexParams: []
        }, 'string'), 'string');
    }
    static async getModel(id) {
        let type = await Model.getModelType(id);
        return Model.newModel(lib_1.AsyncInstance, id, type);
    }
    static async createModel(layerConstructor, ...params) {
        let layerType = layerConstructor.name.toLowerCase();
        return lib_1.assertType(await controller.sendJSON({
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
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'params'
        }), 'FloatTensor_list'), Array);
    }
    async num_parameters() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'param_count'
        }), 'int'), 'number');
    }
    async models() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'models'
        }), 'Model_list'), Array);
    }
    async set_id(new_id) {
        let self = this;
        self.ready();
        lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'set_id',
            tensorIndexParams: [new_id]
        }), 'string'), 'string');
        self.id = new_id;
        return self;
    }
    async fit(input, target, criterion, optim, batch_size, iters = 15, log_interval = 200, metrics = [], verbose = true) {
        let self = this;
        self.ready();
        console.log('fit');
        let num_batches = lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'prepare_to_fit',
            tensorIndexParams: [input.id, target.id, criterion.id, optim.id, batch_size]
        }), 'int'), 'number');
        let loss = 100000;
        for (let iter = 0; iter < iters; iter++) {
            for (let log_i = 0; log_i < num_batches; log_i += log_interval) {
                let prev_loss = loss;
                let _loss = lib_1.assertType(await controller.sendJSON(self.cmd({
                    functionCall: 'fit',
                    tensorIndexParams: [log_i, Math.min(log_i + log_interval, num_batches), 1]
                }), 'float'), 'number');
                if (log_i % 10 === 0) {
                    console.log(`iter ${iter}/${iters} - ${log_i}/${num_batches} -- ${_loss}`);
                }
                if (_loss) {
                    loss = _loss;
                }
                else {
                    console.log(_loss);
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
    async length() {
        let self = this;
        self.ready();
        return (await self.models()).length;
    }
    async activation() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'activation'
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
    async getLayerType() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'model_type'
        }), 'string'), 'string');
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id || '-1', tensorIndexParams: [] }, options);
    }
    async forward(...input) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: input.map(t => t.id)
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
}
exports.Model = Model;
class Policy extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'policy';
        this.stateType = 'discrete';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(model, optimizer, stateType = 'discrete') {
        let id = await Model.createModel(this, model.id, optimizer.id);
        let policy = new this(lib_1.AsyncInstance, id);
        policy.stateType = stateType;
        return policy;
    }
    async sample(...input) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sample',
            tensorIndexParams: input.map(t => t.id)
        }), 'IntTensor'), Tensor_1.Tensor.IntTensor);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(layers) {
        let id = await Model.createModel(this);
        let model = new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(input_dim = 0, output_dim = 0, initializer = 'Xavier') {
        let id = await Model.createModel(this, String(input_dim), String(output_dim), initializer);
        return new this(lib_1.AsyncInstance, id);
    }
    async finish(id) {
        let self = this;
        self.id = id;
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(rate = 0.5) {
        let id = await Model.createModel(this, String(rate));
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
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
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return lib_1.assertType(controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
}
NLLLoss.$ = NLLLoss;
exports.NLLLoss = NLLLoss;
class CrossEntropyLoss extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'crossentropyloss';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(dim = 1) {
        let id = await Model.createModel(this, String(dim));
        return new this(lib_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
}
CrossEntropyLoss.$ = CrossEntropyLoss;
exports.CrossEntropyLoss = CrossEntropyLoss;
class Categorical_CrossEntropy extends Model {
    constructor() {
        super(...arguments);
        this.layerType = 'categorical_crossentropy';
    }
    static async get(id) {
        let type = await Model.getModelType(id);
        Model.assertLayerType(type, this);
        return new this(lib_1.AsyncInstance, id);
    }
    static async create() {
        let id = await Model.createModel(this);
        return new this(lib_1.AsyncInstance, id);
    }
    async forward(input, target) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'forward',
            tensorIndexParams: [input.id, target.id]
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
}
Categorical_CrossEntropy.$ = Categorical_CrossEntropy;
exports.Categorical_CrossEntropy = Categorical_CrossEntropy;
Model.Policy = Policy;
Model.Sequential = Sequential;
Model.Linear = Linear;
Model.ReLU = ReLU;
Model.Dropout = Dropout;
Model.Sigmoid = Sigmoid;
Model.Softmax = Softmax;
Model.LogSoftmax = LogSoftmax;
Model.Log = Log;
Model.Tanh = Tanh;
Model.MSELoss = MSELoss;
Model.NLLLoss = NLLLoss;
Model.CrossEntropyLoss = CrossEntropyLoss;
Model.Categorical_CrossEntropy = Categorical_CrossEntropy;
//# sourceMappingURL=Model.js.map