"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const controller = require("./controller");
const AsyncInit_1 = require("./AsyncInit");
function get_param_ids(params = []) {
    let param_ids = [];
    for (let p of params) {
        param_ids.push(p.id);
    }
    return param_ids;
}
class Optimizer extends AsyncInit_1.AsyncInit {
    constructor(id, optimizer_type = '', params = [], h_params = []) {
        super();
        let self = this;
        self.optimizer_type = optimizer_type;
        self.type = 'Optimizer';
        controller.sendJSON(self.cmd({
            functionCall: 'create',
            tensorIndexParams: [self.optimizer_type, ...params], h_params
        }), 'string')
            .then(res => self.__finish__(res))
            .catch(err => self.__error__(err));
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    zero_grad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'zero_grad'
            }), 'string');
        });
    }
    step(batch_size, iteration) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'step',
                tensorIndexParams: [batch_size, iteration]
            }), 'string');
        });
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
}
exports.Optimizer = Optimizer;
class SGD extends Optimizer {
    constructor(params, lr = 0.01, momentum = 0, decay = 0) {
        super(void 0, 'sgd', get_param_ids(params), [String(lr), String(momentum), String(decay)]);
    }
}
exports.SGD = SGD;
class RMSProp extends Optimizer {
    constructor(params, lr = 0.01, rho = 0.9, epsilon = 1e-6, decay = 0) {
        super(void 0, 'rmsprop', get_param_ids(params), [String(lr), String(rho), String(epsilon), String(decay)]);
    }
}
exports.RMSProp = RMSProp;
class Adam extends Optimizer {
    constructor(params, lr = 0.01, beta_1 = 0.9, beta_2 = 0.999, epsilon = 1e-6, decay = 0) {
        super(void 0, 'adam', get_param_ids(params), [String(lr), String(beta_1), String(beta_2), String(epsilon), String(decay)]);
    }
}
exports.Adam = Adam;
//# sourceMappingURL=Optimizer.js.map