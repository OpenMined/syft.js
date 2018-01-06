"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const controller = require("./controller");
class Tensor {
    constructor(data, data_is_pointer = false) {
        let self = this;
        if (data != void 0 && !data_is_pointer) {
        }
        if (Array.isArray(data)) {
            self.data = new Float64Array(np.array(data));
            self.__ready__ = false;
            controller.send_json({
                'objectType': 'IntTensor',
                'functionCall': 'create',
                'data': list(data.flatten()),
                'shape': self.data.shape
            }).then(res => self.__finish__(res));
        }
        else if (data_is_pointer) {
            self.id = data;
            self.data_is_pointer = true;
            self.__ready__ = true;
        }
    }
    __finish__(res) {
        let self = this;
        if (true) {
            self.__waits__.forEach(wait => wait.res());
        }
        else {
            let err = new Error(res);
            self.__error__ = err;
            self.__waits__.forEach(wait => wait.rej(err));
        }
        self.__waits__ = [];
    }
    ready() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            if (self.__error__) {
                throw self.__error__;
            }
            else if (self.__ready__) {
                return;
            }
            yield new Promise((res, rej) => {
                self.__waits__.push({ res, rej });
            });
        });
    }
    autograd(state) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
        });
    }
    shape() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return [1, 2, 3];
        });
    }
    params_func(name, params, return_response = false, return_type = 'IntTensor') {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let res = yield controller.send_json(self.cmd(name, params));
            controller.log(res);
            if (return_response) {
                if (return_type == 'IntTensor') {
                    controller.log('IntTensor.__init__: {}'.format(res));
                    return new IntTensor(Number(res), true);
                }
                else if (return_type == 'FloatTensor') {
                    controller.log('IntTensor.__init__: {}'.format(res));
                    return new FloatTensor(Number(res), true);
                }
            }
            return res;
        });
    }
    no_params_func(name, return_response = false, return_type = 'IntTensor') {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.params_func(name, [], return_response, return_type);
        });
    }
    get(param_name = 'size', response_as_tensor = false, return_type = 'IntTensor') {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.params_func('get', [param_name], true, 'string');
        });
    }
    cmd(functionCall, tensorIndexParams = []) {
        let self = this;
        return {
            'functionCall': functionCall,
            'objectType': self.type,
            'objectIndex': self.id,
            'tensorIndexParams': tensorIndexParams
        };
    }
    is_contiguous() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return true;
        });
    }
    to_numpy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let res;
            if (self.is_contiguous()) {
                res = yield controller.send_json({
                    'functionCall': 'to_numpy',
                    'objectType': self.type,
                    'objectIndex': self.id
                });
                return '';
            }
            else {
                return ' - non-contiguous - ';
            }
        });
    }
    __repr__(verbose = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let tensor_str = String(self.to_numpy());
            let type_str = (yield self.shape()).join('x');
            return `${tensor_str}\n[syft.IntTensor: ${self.id} size: ${type_str}]`;
        });
    }
    abs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.no_params_func('abs', true);
        });
    }
    abs_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.no_params_func('abs_');
        });
    }
    acos() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.no_params_func('acos', true);
        });
    }
    acos_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.no_params_func('acos_');
        });
    }
    addmm_(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.params_func('addmm_', [x.id, y.id]);
        });
    }
    addmm(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let copy = yield self.copy();
            yield copy.params_func('addmm_', [x.id, y.id]);
            return copy;
        });
    }
    addmv_(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.params_func('addmv_', [x.id, y.id]);
        });
    }
    addmv(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let copy = yield self.copy();
            yield copy.params_func('addmv_', [x.id, y.id]);
            return copy;
        });
    }
}
exports.Tensor = Tensor;
class IntTensor extends Tensor {
    constructor(data, data_is_pointer = false) {
        super(data, data_is_pointer);
    }
}
exports.IntTensor = IntTensor;
class FloatTensor extends Tensor {
    constructor(data, autograd = false, data_is_pointer = false) {
        super(data, data_is_pointer);
        let self = this;
        if (autograd) {
            self.autograd(true);
        }
    }
}
exports.FloatTensor = FloatTensor;
//# sourceMappingURL=Tensor.js.map