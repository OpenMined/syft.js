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
    static assertLayerType(layerType, modelConstructor) {
        if (layerType.toLowerCase() !== modelConstructor.name.toLowerCase()) {
            throw new TypeError(`Connat Convert '${layerType}' to '${modelConstructor.name}'`);
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
        this.ready();
        return this.forward(...args);
    }
    async parameters() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'params'
        }), 'FloatTensor_list'), Array);
    }
    async numParameters() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'param_count'
        }), 'int'), 'number');
    }
    async models() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'models'
        }), 'Model_list'), Array);
    }
    async set_id(new_id) {
        this.ready();
        lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'set_id',
            tensorIndexParams: [new_id]
        }), 'string'), 'string');
        this.id = new_id;
        return this;
    }
    async fit({ input, target, criterion, optimizer, batchSize, iterations = 15, logInterval = 200, metrics = [], verbose = false }) {
        this.ready();
        if (verbose) {
            console.log('prepare_to_fit');
        }
        let numBatches = lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'prepare_to_fit',
            tensorIndexParams: [input.id, target.id, criterion.id, optimizer.id, batchSize]
        }), 'int'), 'number');
        if (verbose) {
            console.log('fit');
        }
        let loss = 100000;
        for (let iter = 0; iter < iterations; iter++) {
            for (let logI = 0; logI < numBatches; logI += logInterval) {
                loss = lib_1.assertType(await controller.sendJSON(this.cmd({
                    functionCall: 'fit',
                    tensorIndexParams: [logI, Math.min(logI + logInterval, numBatches), 1]
                }), 'float'), 'number');
                if (verbose && logI % 10 === 0) {
                    console.log(`iter ${iter}/${iterations} - ${logI}/${numBatches} -- ${loss}`);
                }
                if (Number.isNaN(loss)) {
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
        this.ready();
        return (await this.models()).length;
    }
    async activation() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'activation'
        }), 'FloatTensor'), Tensor_1.Tensor.FloatTensor);
    }
    async getLayerType() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'model_type'
        }), 'string'), 'string');
    }
    cmd(options) {
        return Object.assign({ objectType: this.type, objectIndex: this.id || '-1', tensorIndexParams: [] }, options);
    }
    async forward(...input) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
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
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sample',
            tensorIndexParams: input.map(t => t.id)
        }), 'IntTensor'), Tensor_1.Tensor.IntTensor);
    }
    async parameters() {
        this.ready();
        if (this.model) {
            return this.model.parameters();
        }
        return [];
    }
    async feed(...args) {
        this.ready();
        if (this.stateType === 'discrete') {
            return this.sample(...args);
        }
        else if (this.stateType === 'continuous') {
            return this.forward(...args);
        }
        throw new Error(`Unknown State Type: ${this.stateType}`);
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
        this.ready();
        await controller.sendJSON(this.cmd({
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
    static async create({ inputDim = 0, outputDim = 0, initializer = 'Xavier' }) {
        let id = await Model.createModel(this, String(inputDim), String(outputDim), initializer);
        return new this(lib_1.AsyncInstance, id);
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
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
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
        this.ready();
        return lib_1.assertType(controller.sendJSON(this.cmd({
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
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
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
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
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