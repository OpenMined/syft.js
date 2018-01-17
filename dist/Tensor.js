"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const controller = require("./controller");
const DimArray_1 = require("./DimArray");
const AsyncInit_1 = require("./AsyncInit");
const TENSOR_SUPER = {};
const TensorSerializer_1 = require("./TensorSerializer");
const tensorSerializer = new TensorSerializer_1.TensorSerializer;
class Tensor extends AsyncInit_1.AsyncInit {
    constructor($) {
        super();
        if ($ !== TENSOR_SUPER) {
            throw new Error('Cannot Contruct Tensor');
        }
    }
    static deserialize(str) {
        return tensorSerializer.deserialize(str);
    }
    serialize(optimizeStorage = false) {
        return tensorSerializer.serialize(this, optimizeStorage);
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    delete() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.__delete__();
            yield self.ready();
            if (self.id) {
                yield controller.sendJSON(self.cmd({
                    functionCall: 'delete'
                }));
            }
        });
    }
    autograd(state) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
        });
    }
    get(param_name = 'size', response_as_tensor = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (response_as_tensor) {
                return yield controller.sendJSON(self.cmd({
                    functionCall: 'get',
                    tensorIndexParams: [param_name]
                }), self.type);
            }
            else {
                return yield controller.sendJSON(self.cmd({
                    functionCall: 'get',
                    tensorIndexParams: [param_name]
                }), 'string');
            }
        });
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
    is_contiguous() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let txt = yield controller.sendJSON(self.cmd({
                functionCall: 'is_contiguous'
            }), 'bool');
            if (txt == 'true') {
                return true;
            }
            else {
                return false;
            }
        });
    }
    to_numpy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let res;
            if (yield self.is_contiguous()) {
                res = yield controller.sendJSON(self.cmd({
                    functionCall: 'to_numpy'
                }), 'string');
                return res;
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
            let tensor_str = yield self.to_numpy();
            let type_str = (yield self.shape()).join('x');
            let grad = yield self.get('grad');
            if (grad == '') {
                grad = 'None';
            }
            let co = String(yield self.creation_op());
            let desc = `[syft.${self.type}: ${self.id} grad: ${grad} size: ${type_str} init: ${co}]\n`;
            if (verbose) {
                let children = yield self.children();
                let creators = yield self.creators();
                if (children.length > 0) {
                    desc += '\n\t-----------children-----------\n';
                }
                for (let child_id of children) {
                    desc += '\t' + (yield (yield controller.get_tensor(child_id)).__repr__(false));
                }
                if (children.length > 0) {
                    if (creators.length > 0) {
                        desc += '\t------------------------------\n';
                    }
                    else {
                        desc += '\t------------------------------\n\n\n';
                    }
                }
                if (creators.length > 0) {
                    desc += '\n\t-----------creators-----------\n';
                }
                for (let parent_id of creators) {
                    desc += '\t' + (yield (yield controller.get_tensor(parent_id)).__repr__(false));
                }
                if (creators.length > 0) {
                    desc += '\t------------------------------\n\n\n';
                }
                return tensor_str + '\n' + desc;
            }
            return desc;
        });
    }
    abs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'abs'
            }), self.type);
        });
    }
    abs_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'abs_'
            }));
        });
    }
    acos() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'acos'
            }), self.type);
        });
    }
    acos_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'acos_'
            }));
        });
    }
    addmm_(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready(),
                y.ready()
            ]);
            return yield controller.sendJSON(self.cmd({
                functionCall: 'addmm_',
                tensorIndexParams: [x.id, y.id]
            }));
        });
    }
    addmm(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready(),
                y.ready()
            ]);
            let copy = yield self.copy();
            yield copy.addmm_(x, y);
            return copy;
        });
    }
    addmv_(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready(),
                y.ready()
            ]);
            return yield controller.sendJSON(self.cmd({
                functionCall: 'addmv_',
                tensorIndexParams: [x.id, y.id]
            }));
        });
    }
    addmv(x, y) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready(),
                y.ready()
            ]);
            let copy = yield self.copy();
            yield copy.addmv_(x, y);
            return copy;
        });
    }
    asin() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'asin'
            }), self.type);
        });
    }
    asin_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'asin_'
            }));
        });
    }
    atan() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'atan'
            }), self.type);
        });
    }
    atan_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'atan_'
            }));
        });
    }
    __add__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return self.arithmetic_operation(x, 'add', false);
        });
    }
    __iadd__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return self.arithmetic_operation(x, 'add', true);
        });
    }
    backward(grad) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (grad == void 0) {
                controller.sendJSON(self.cmd({
                    functionCall: 'backward'
                }));
            }
            else {
                controller.sendJSON(self.cmd({
                    functionCall: 'backward',
                    tensorIndexParams: [grad.id]
                }));
            }
        });
    }
    ceil() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'ceil'
            }), self.type);
        });
    }
    ceil_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'ceil_'
            }));
        });
    }
    contiguous() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'contiguous'
            }), self.type);
        });
    }
    copy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let t = yield controller.sendJSON(self.cmd({
                functionCall: 'copy'
            }), self.type);
            if (t instanceof Tensor) {
                return t;
            }
            throw new Error('Failed To Copy Tensor');
        });
    }
    cos() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cos'
            }), self.type);
        });
    }
    cos_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cos_'
            }));
        });
    }
    cosh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cosh'
            }), self.type);
        });
    }
    cosh_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cosh_'
            }));
        });
    }
    children() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let res = yield self.get('children');
            if (res && typeof res == 'string') {
                return [];
            }
            return [];
        });
    }
    creation_op() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.get('creation_op');
        });
    }
    creators() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let res = yield self.get('creators');
            if (typeof res == 'string' && res.length > 0) {
                return res.split(',').slice(0, -1);
            }
            return [];
        });
    }
    cumsum(dim = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cumsum',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    dataOnGpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if ((yield self.get('dataOnGpu')) == '1') {
                return true;
            }
            return false;
        });
    }
    exp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'exp'
            }), self.type);
        });
    }
    exp_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'exp_'
            }));
        });
    }
    expand(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'expand',
                tensorIndexParams: args
            }), self.type);
        });
    }
    index_add(indices, dim, x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield controller.sendJSON(self.cmd({
                functionCall: 'index_add',
                tensorIndexParams: [indices.id, dim, x.id]
            }), self.type);
        });
    }
    index_add_(indices, dim, x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield controller.sendJSON(self.cmd({
                functionCall: 'index_add_',
                tensorIndexParams: [indices.id, dim, x.id]
            }), self.type);
        });
    }
    index_select(dim, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'index_select',
                tensorIndexParams: [indices.id, dim]
            }), self.type);
        });
    }
    __truediv__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'div', false);
        });
    }
    __itruediv__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'div', true);
        });
    }
    keepgrad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if ((yield self.get('keepgrad')) == '1') {
                return true;
            }
            else {
                return false;
            }
        });
    }
    __pow__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'pow', false);
        });
    }
    __ipow__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'pow', true);
        });
    }
    pow(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'pow', false);
        });
    }
    pow_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'pow', true);
        });
    }
    floor() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'floor'
            }), self.type);
        });
    }
    floor_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'floor_'
            }));
        });
    }
    round() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'round'
            }), self.type);
        });
    }
    round_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'round_'
            }));
        });
    }
    mm(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return controller.sendJSON(self.cmd({
                functionCall: 'mm',
                tensorIndexParams: [x.id]
            }), self.type);
        });
    }
    grad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return self.get('grad', true);
        });
    }
    __mod__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'remainder', false);
        });
    }
    __imod__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return self.arithmetic_operation(x, 'remainder', true);
        });
    }
    __mul__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'mul', false);
        });
    }
    __imul__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return yield self.arithmetic_operation(x, 'mul', true);
        });
    }
    __neg__() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.neg();
        });
    }
    neg() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'neg'
            }), self.type);
        });
    }
    neg_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'neg_'
            }));
        });
    }
    relu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'relu'
            }), self.type);
        });
    }
    save(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'save',
                tensorIndexParams: [filename]
            }), 'bool');
        });
    }
    set(param_name = 'size', params = []) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'set',
                tensorIndexParams: [...param_name, params]
            }));
        });
    }
    sigmoid_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sigmoid_'
            }));
        });
    }
    sigmoid() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sigmoid'
            }), self.type);
        });
    }
    sign() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sign'
            }), self.type);
        });
    }
    sign_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sign_'
            }));
        });
    }
    sin() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sin'
            }), self.type);
        });
    }
    sin_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sin_'
            }));
        });
    }
    size() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield self.get('size');
        });
    }
    shape(as_list = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (as_list) {
                return ((yield self.get('shape')) || '').split(',').map(a => Number(a));
            }
            else {
                return yield controller.sendJSON(self.cmd({
                    functionCall: 'shape'
                }), self.type);
            }
        });
    }
    softmax(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'softmax',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    std(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'std',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    stride(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            if (dim == -1) {
                return controller.sendJSON(self.cmd({
                    functionCall: 'stride'
                }), 'string');
            }
            else {
                let strides = yield controller.sendJSON(self.cmd({
                    functionCall: 'stride',
                    tensorIndexParams: [dim]
                }), 'string');
                return strides.split(' ');
            }
        });
    }
    sqrt() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sqrt'
            }), self.type);
        });
    }
    sqrt_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sqrt_'
            }));
        });
    }
    trace() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'trace'
            }), self.type);
        });
    }
    trunc() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'trunc'
            }), self.type);
        });
    }
    __sub__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return self.arithmetic_operation(x, 'sub', false);
        });
    }
    __isub__(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return self.arithmetic_operation(x, 'sub', true);
        });
    }
    view(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'view',
                tensorIndexParams: args
            }), self.type);
        });
    }
    view_(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'view_',
                tensorIndexParams: args
            }));
            return self;
        });
    }
    view_as(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return controller.sendJSON(self.cmd({
                functionCall: 'view_as',
                tensorIndexParams: [x.id]
            }), self.type);
        });
    }
    view_as_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            yield controller.sendJSON(self.cmd({
                functionCall: 'view_as_',
                tensorIndexParams: [x.id]
            }));
            return self;
        });
    }
    T() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'transpose'
            }), self.type);
        });
    }
    triu(k = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'triu',
                tensorIndexParams: [k]
            }), self.type);
        });
    }
    triu_(k = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'triu_',
                tensorIndexParams: [k]
            }));
        });
    }
    unsqueeze(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'unsqueeze',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    unsqueeze_(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'unsqueeze_',
                tensorIndexParams: [dim]
            }));
        });
    }
    zero_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'zero_'
            }));
        });
    }
    toString() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let shape = yield self.shape();
            return String(yield self.to_numpy()).replace(']', ' ').replace('[', ' ');
        });
    }
    cpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'cpu'
            }));
        });
    }
    gpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return yield controller.sendJSON(self.cmd({
                functionCall: 'gpu'
            }));
        });
    }
    arithmetic_operation(x, name, inline = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            let operation_cmd = name;
            let parameter;
            if (x instanceof Tensor) {
                operation_cmd += '_elem';
                parameter = x.id;
            }
            else {
                operation_cmd += '_scalar';
                parameter = String(x);
            }
            if (inline) {
                operation_cmd += '_';
            }
            return yield controller.sendJSON(self.cmd({
                functionCall: operation_cmd,
                tensorIndexParams: [parameter]
            }), inline ? void 0 : self.type);
        });
    }
    sinh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sinh'
            }), self.type);
        });
    }
    sinh_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sinh_'
            }));
        });
    }
    log() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'log'
            }), self.type);
        });
    }
    log_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'log_'
            }));
        });
    }
    log1p_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'log1p_'
            }));
        });
    }
    log1p() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'log1p'
            }), self.type);
        });
    }
    frac() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'frac'
            }), self.type);
        });
    }
    frac_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'frac_'
            }));
        });
    }
    reciprocal() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'reciprocal'
            }), self.type);
        });
    }
    reciprocal_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'reciprocal_'
            }));
        });
    }
    rsqrt() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'rsqrt'
            }), self.type);
        });
    }
    rsqrt_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'rsqrt_'
            }));
        });
    }
    remainder(divisor) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return self.arithmetic_operation(divisor, 'remainder');
        });
    }
    remainder_(divisor) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return self.arithmetic_operation(divisor, 'remainder', true);
        });
    }
    sample(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sample',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    tan() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'tan'
            }), self.type);
        });
    }
    tan_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'tan_'
            }));
        });
    }
    tanh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'tanh'
            }), self.type);
        });
    }
    squeeze(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'squeeze',
                tensorIndexParams: [dim]
            }), self.type);
        });
    }
    squeeze_(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'squeeze_',
                tensorIndexParams: [dim]
            }));
        });
    }
    min(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'min',
                tensorIndexParams: [dim, keepdim]
            }), self.type);
        });
    }
    max(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'max',
                tensorIndexParams: [dim, keepdim]
            }), self.type);
        });
    }
    sum(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'sum',
                tensorIndexParams: [dim, keepdim]
            }), self.type);
        });
    }
    prod(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'prod',
                tensorIndexParams: [dim, keepdim]
            }), self.type);
        });
    }
    mean(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'mean',
                tensorIndexParams: [dim, keepdim]
            }), self.type);
        });
    }
}
Tensor.__tensor__ = {};
exports.Tensor = Tensor;
class IntTensor extends Tensor {
    constructor(data, data_is_pointer = false) {
        super(TENSOR_SUPER);
        this.type = 'IntTensor';
        let self = this;
        if (!data) {
            throw Error('Invalid Data');
        }
        if (data instanceof DimArray_1.IntDimArray) {
            self.data = data;
            controller.sendJSON(self.cmd({
                functionCall: 'create',
                data: Array.from(self.data.data),
                shape: Array.from(self.data.shape)
            }), 'string')
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
        else if (Array.isArray(data)) {
            self.data = new DimArray_1.IntDimArray(data);
            controller.sendJSON(self.cmd({
                functionCall: 'create',
                data: Array.from(self.data.data),
                shape: Array.from(self.data.shape)
            }), 'string')
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
        else if (data_is_pointer) {
            self.id = data;
            self.data_is_pointer = true;
            self.__finish__(data);
        }
    }
}
exports.IntTensor = IntTensor;
class FloatTensor extends Tensor {
    constructor(data, autograd = false, data_is_pointer = false) {
        super(TENSOR_SUPER);
        this.type = 'FloatTensor';
        let self = this;
        if (!data) {
            throw Error('Invalid Data');
        }
        if (autograd) {
            self.autograd(true);
        }
        if (data instanceof DimArray_1.FloatDimArray) {
            self.data = data;
            controller.sendJSON(self.cmd({
                functionCall: 'create',
                data: Array.from(self.data.data),
                shape: Array.from(self.data.shape)
            }), 'string')
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
        else if (Array.isArray(data)) {
            self.data = new DimArray_1.FloatDimArray(data);
            controller.sendJSON(self.cmd({
                functionCall: 'create',
                data: Array.from(self.data.data),
                shape: Array.from(self.data.shape)
            }), 'string')
                .then(res => self.__finish__(res))
                .catch(err => self.__error__(err));
        }
        else if (data_is_pointer) {
            self.id = data;
            self.data_is_pointer = true;
            self.__finish__(data);
        }
    }
}
exports.FloatTensor = FloatTensor;
//# sourceMappingURL=Tensor.js.map