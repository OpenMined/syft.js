"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
const lib_1 = require("../lib");
function get_param_ids(params = []) {
    let param_ids = [];
    for (let p of params) {
        param_ids.push(p.id);
    }
    return param_ids;
}
class Optimizer extends lib_1.AsyncInstance {
    static async createOptomizer(optimizer_type, params = [], hyperParams = []) {
        return lib_1.assertType(await controller.sendJSON({
            objectType: 'Optimizer',
            functionCall: 'create',
            tensorIndexParams: [optimizer_type.name.toLowerCase(), ...params],
            hyperParams
        }, 'string'), 'string');
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    async zero_grad() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'zero_grad'
        }), 'string'), 'string');
    }
    async step(batch_size, iteration) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'step',
            tensorIndexParams: [batch_size, iteration]
        }), 'string'), 'string');
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
}
exports.Optimizer = Optimizer;
class SGD extends Optimizer {
    static async create(params, lr = 0.01, momentum = 0, decay = 0) {
        let id = await Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(momentum), String(decay)]);
        return new this(lib_1.AsyncInstance, id);
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
}
SGD.$ = SGD;
exports.SGD = SGD;
class RMSProp extends Optimizer {
    static async create(params, lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0) {
        let id = await Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(rho), String(epsilon), String(decay)]);
        return new this(lib_1.AsyncInstance, id);
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
}
RMSProp.$ = RMSProp;
exports.RMSProp = RMSProp;
class Adam extends Optimizer {
    static async create(params, lr = 0.01, beta_1 = 0.9, beta_2 = 0.999, epsilon = 1e-6, decay = 0) {
        let id = await Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(beta_1), String(beta_2), String(epsilon), String(decay)]);
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