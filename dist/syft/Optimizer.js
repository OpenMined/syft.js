"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
const lib_1 = require("../lib");
function getParamIds(params = []) {
    let paramIds = [];
    for (let p of params) {
        paramIds.push(p.id);
    }
    return paramIds;
}
class Optimizer extends lib_1.AsyncInstance {
    constructor() {
        super(...arguments);
        this.type = 'Optimizer';
        this.optimizerType = '';
    }
    static async createOptomizer(optimizerType, params = [], hyperParams = []) {
        return lib_1.assertType(await controller.sendJSON({
            objectType: 'Optimizer',
            functionCall: 'create',
            tensorIndexParams: [optimizerType.name.toLowerCase(), ...params],
            hyperParams
        }, 'string'), 'string');
    }
    async zeroGrad() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'zero_grad'
        }), 'string'), 'string');
    }
    async step(batchSize, iteration) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'step',
            tensorIndexParams: [batchSize, iteration]
        }), 'string'), 'string');
    }
    cmd(options) {
        return Object.assign({ objectType: this.type, objectIndex: this.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
}
exports.Optimizer = Optimizer;
class SGD extends Optimizer {
    static async create({ params, lr = 0.01, momentum = 0, decay = 0 }) {
        let id = await Optimizer.createOptomizer(this, getParamIds(params), [String(lr), String(momentum), String(decay)]);
        return new this(lib_1.AsyncInstance, id);
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
}
SGD.$ = SGD;
exports.SGD = SGD;
class RMSProp extends Optimizer {
    static async create({ params, lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0 }) {
        let id = await Optimizer.createOptomizer(this, getParamIds(params), [String(lr), String(rho), String(epsilon), String(decay)]);
        return new this(lib_1.AsyncInstance, id);
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
}
RMSProp.$ = RMSProp;
exports.RMSProp = RMSProp;
class Adam extends Optimizer {
    static async create({ params, lr = 0.01, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-6, decay = 0 }) {
        let id = await Optimizer.createOptomizer(this, getParamIds(params), [String(lr), String(beta1), String(beta2), String(epsilon), String(decay)]);
        return new this(lib_1.AsyncInstance, id);
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
}
Adam.$ = Adam;
exports.Adam = Adam;
Optimizer.SGD = SGD;
Optimizer.RMSProp = RMSProp;
Optimizer.Adam = Adam;
//# sourceMappingURL=Optimizer.js.map