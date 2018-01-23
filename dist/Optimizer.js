"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const controller = require("./controller");
const AsyncClass_1 = require("./AsyncClass");
const asserts_1 = require("./asserts");
function get_param_ids(params = []) {
    let param_ids = [];
    for (let p of params) {
        param_ids.push(p.id);
    }
    return param_ids;
}
class Optimizer extends AsyncClass_1.AsyncInstance {
    static createOptomizer(optimizer_type, params = [], h_params = []) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return asserts_1.assertType(controller.sendJSON({
                objectType: 'Optimizer',
                functionCall: 'create',
                tensorIndexParams: [optimizer_type.name.toLowerCase(), ...params],
                h_params
            }, 'string'), 'string');
        });
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    zero_grad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'zero_grad'
            }), 'string'), 'string');
        });
    }
    step(batch_size, iteration) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'step',
                tensorIndexParams: [batch_size, iteration]
            }), 'string'), 'string');
        });
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
}
exports.Optimizer = Optimizer;
class SGD extends Optimizer {
    static create(params, lr = 0.01, momentum = 0, decay = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let id = yield Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(momentum), String(decay)]);
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
    static get(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
}
SGD.$ = SGD;
exports.SGD = SGD;
class RMSProp extends Optimizer {
    static create(params, lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let id = yield Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(rho), String(epsilon), String(decay)]);
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
    static get(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
}
RMSProp.$ = RMSProp;
exports.RMSProp = RMSProp;
class Adam extends Optimizer {
    static create(params, lr = 0.01, beta_1 = 0.9, beta_2 = 0.999, epsilon = 1e-6, decay = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let id = yield Optimizer.createOptomizer(this, get_param_ids(params), [String(lr), String(beta_1), String(beta_2), String(epsilon), String(decay)]);
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
    static get(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new this(AsyncClass_1.AsyncInstance, id);
        });
    }
}
Adam.$ = Adam;
exports.Adam = Adam;
//# sourceMappingURL=Optimizer.js.map