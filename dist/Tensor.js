"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const controller = require("./controller");
const DimArray_1 = require("./DimArray");
const AsyncClass_1 = require("./AsyncClass");
const asserts_1 = require("./asserts");
const TensorSerializer_1 = require("./TensorSerializer");
const tensorSerializer = new TensorSerializer_1.TensorSerializer;
class Tensor extends AsyncClass_1.AsyncInstance {
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
            self.ready();
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
            self.ready();
        });
    }
    get(param_name = 'size', response_as_tensor = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            if (response_as_tensor) {
                return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                    functionCall: 'get',
                    tensorIndexParams: [param_name]
                }), self.type), self.constructor);
            }
            else {
                return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                    functionCall: 'get',
                    tensorIndexParams: [param_name]
                }), 'string'), 'string');
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
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'is_contiguous'
            }), 'bool'), 'boolean');
        });
    }
    to_numpy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let res;
            if (yield self.is_contiguous()) {
                res = asserts_1.assertType(yield controller.sendJSON(self.cmd({
                    functionCall: 'to_numpy'
                }), 'string'), 'string');
                return res.split(' ').map(a => Number(a));
            }
            else {
                return ' - non-contiguous - ';
            }
        });
    }
    __repr__(verbose = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let tensor_str = yield self.to_numpy();
            let type_str = (yield self.shape()).join('x');
            let grad = yield self.get('grad');
            if (grad === '') {
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
    batchify(dim, batch_size) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'batchify',
                tensorIndexParams: [dim, batch_size]
            }), 'FloatTensor_list');
        });
    }
    clamp(min, max) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'clamp',
                tensorIndexParams: [min, max]
            }), self.type);
        });
    }
    equal(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'equal',
                tensorIndexParams: [x.id]
            }), 'bool'), 'boolean');
        });
    }
    lt(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'lt',
                tensorIndexParams: [x.id]
            }), 'bool'), 'boolean');
        });
    }
    lt_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'lt_',
                tensorIndexParams: [x.id]
            }), 'bool'), 'boolean');
        });
    }
    norm(dim = -1, keepdim = false, p = 2) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'norm',
                tensorIndexParams: [dim, keepdim, p]
            }), self.type), self.constructor);
        });
    }
    random_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'random_'
            }), self.type);
            return self;
        });
    }
    split(split_size_or_sections, dim = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'split_by_size',
                tensorIndexParams: [split_size_or_sections, dim]
            }), 'FloatTensor_list');
        });
    }
    abs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'abs'
            }), self.type), self.constructor);
        });
    }
    abs_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'abs_'
            }));
            return self;
        });
    }
    acos() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'acos'
            }), self.type), self.constructor);
        });
    }
    acos_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'acos_'
            }));
            return self;
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
            yield controller.sendJSON(self.cmd({
                functionCall: 'addmm_',
                tensorIndexParams: [x.id, y.id]
            }));
            return self;
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
            yield controller.sendJSON(self.cmd({
                functionCall: 'addmv_',
                tensorIndexParams: [x.id, y.id]
            }));
            return self;
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
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'asin'
            }), self.type), self.constructor);
        });
    }
    asin_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'asin_'
            }));
            return self;
        });
    }
    atan() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'atan'
            }), self.type), self.constructor);
        });
    }
    atan_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'atan_'
            }));
            return self;
        });
    }
    backward(grad) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            if (grad == null) {
                yield controller.sendJSON(self.cmd({
                    functionCall: 'backward'
                }));
            }
            else {
                yield controller.sendJSON(self.cmd({
                    functionCall: 'backward',
                    tensorIndexParams: [grad.id]
                }));
            }
        });
    }
    ceil() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'ceil'
            }), self.type), self.constructor);
        });
    }
    ceil_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'ceil_'
            }));
            return self;
        });
    }
    contiguous() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'contiguous'
            }), self.type), self.constructor);
        });
    }
    copy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'copy'
            }), self.type), self.constructor);
        });
    }
    cos() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'cos'
            }), self.type), self.constructor);
        });
    }
    cos_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'cos_'
            }));
            return self;
        });
    }
    cosh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'cosh'
            }), self.type), self.constructor);
        });
    }
    cosh_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'cosh_'
            }));
            return self;
        });
    }
    children() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let res = yield self.get('children');
            if (res && typeof res === 'string') {
                return [];
            }
            return [];
        });
    }
    creation_op() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return self.get('creation_op');
        });
    }
    creators() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let res = yield self.get('creators');
            if (typeof res === 'string' && res.length > 0) {
                return res.split(',').slice(0, -1);
            }
            return [];
        });
    }
    cumsum(dim = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'cumsum',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    dataOnGpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            if ((yield self.get('dataOnGpu')) === '1') {
                return true;
            }
            return false;
        });
    }
    exp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'exp'
            }), self.type), self.constructor);
        });
    }
    exp_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'exp_'
            }));
            return self;
        });
    }
    expand(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'expand',
                tensorIndexParams: args
            }), self.type), self.constructor);
        });
    }
    index_add(indices, dim, x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'index_add',
                tensorIndexParams: [indices.id, dim, x.id]
            }), self.type), self.constructor);
        });
    }
    index_add_(indices, dim, x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            yield controller.sendJSON(self.cmd({
                functionCall: 'index_add_',
                tensorIndexParams: [indices.id, dim, x.id]
            }), self.type);
            return self;
        });
    }
    index_select(dim, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'index_select',
                tensorIndexParams: [indices.id, dim]
            }), self.type), self.constructor);
        });
    }
    keepgrad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            if ((yield self.get('keepgrad')) === '1') {
                return true;
            }
            else {
                return false;
            }
        });
    }
    pow(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'pow', false);
        });
    }
    pow_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'pow', true);
        });
    }
    floor() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'floor'
            }), self.type), self.constructor);
        });
    }
    floor_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'floor_'
            }));
            return self;
        });
    }
    round() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'round'
            }), self.type), self.constructor);
        });
    }
    round_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'round_'
            }));
            return self;
        });
    }
    mm(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield Promise.all([
                self.ready(),
                x.ready()
            ]);
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'mm',
                tensorIndexParams: [x.id]
            }), self.type), self.constructor);
        });
    }
    grad() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return self.get('grad', true);
        });
    }
    neg() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'neg'
            }), self.type), self.constructor);
        });
    }
    neg_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'neg_'
            }));
            return self;
        });
    }
    relu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'relu'
            }), self.type), self.constructor);
        });
    }
    save(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'save',
                tensorIndexParams: [filename]
            }), 'bool');
        });
    }
    set(param_name = 'size', params = []) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'set',
                tensorIndexParams: [...param_name, params]
            }));
        });
    }
    sigmoid_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'sigmoid_'
            }));
            return self;
        });
    }
    sigmoid() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sigmoid'
            }), self.type), self.constructor);
        });
    }
    sign() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sign'
            }), self.type), self.constructor);
        });
    }
    sign_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'sign_'
            }));
            return self;
        });
    }
    sin() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sin'
            }), self.type), self.constructor);
        });
    }
    sin_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'sin_'
            }));
            return self;
        });
    }
    size() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return self.get('size');
        });
    }
    shape(as_list = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let res = asserts_1.assertType(yield self.get('shape'), 'string');
            return res.split(',').slice(0, -1).map(a => Number(a));
        });
    }
    softmax(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'softmax',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    std(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'std',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    stride(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            if (dim === -1) {
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
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sqrt'
            }), self.type), self.constructor);
        });
    }
    sqrt_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'sqrt_'
            }));
            return self;
        });
    }
    trace() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'trace'
            }), self.type), self.constructor);
        });
    }
    trunc() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'trunc'
            }), self.type), self.constructor);
        });
    }
    view(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'view',
                tensorIndexParams: args
            }), self.type), self.constructor);
        });
    }
    view_(...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
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
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'view_as',
                tensorIndexParams: [x.id]
            }), self.type), self.constructor);
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
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'transpose'
            }), self.type), self.constructor);
        });
    }
    triu(k = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'triu',
                tensorIndexParams: [k]
            }), self.type), self.constructor);
        });
    }
    triu_(k = 0) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'triu_',
                tensorIndexParams: [k]
            }));
            return self;
        });
    }
    unsqueeze(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'unsqueeze',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    unsqueeze_(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'unsqueeze_',
                tensorIndexParams: [dim]
            }));
            return self;
        });
    }
    zero_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'zero_'
            }));
            return self;
        });
    }
    toString() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let shape = yield self.shape();
            let data = yield self.to_numpy();
            return `${self.type}<${shape.join('x')}>(id: ${self.id}) [${data}]`;
        });
    }
    cpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'cpu'
            }));
        });
    }
    gpu() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return controller.sendJSON(self.cmd({
                functionCall: 'gpu'
            }));
        });
    }
    arithmetic_operation(x, name, inline = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            let operation_cmd = name;
            let parameter;
            if (x instanceof Tensor) {
                yield x.ready();
                operation_cmd += '_elem';
                parameter = x.id;
            }
            else {
                operation_cmd += '_scalar';
                parameter = String(x);
            }
            if (inline) {
                operation_cmd += '_';
                yield controller.sendJSON(self.cmd({
                    functionCall: operation_cmd,
                    tensorIndexParams: [parameter]
                }));
                return self;
            }
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: operation_cmd,
                tensorIndexParams: [parameter]
            }), self.type), self.constructor);
        });
    }
    add(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'add');
        });
    }
    add_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'add', true);
        });
    }
    sub(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'sub');
        });
    }
    sub_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'sub', true);
        });
    }
    mul(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'mul');
        });
    }
    mul_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'mul', true);
        });
    }
    div(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'div');
        });
    }
    div_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'div', true);
        });
    }
    mod(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'mod');
        });
    }
    mod_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'mod', true);
        });
    }
    sinh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sinh'
            }), self.type), self.constructor);
        });
    }
    sinh_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'sinh_'
            }));
            return self;
        });
    }
    log() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'log'
            }), self.type), self.constructor);
        });
    }
    log_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'log_'
            }));
            return self;
        });
    }
    log1p_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'log1p_'
            }));
            return self;
        });
    }
    log1p() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'log1p'
            }), self.type), self.constructor);
        });
    }
    frac() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'frac'
            }), self.type), self.constructor);
        });
    }
    frac_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'frac_'
            }));
            return self;
        });
    }
    reciprocal() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'reciprocal'
            }), self.type), self.constructor);
        });
    }
    reciprocal_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'reciprocal_'
            }));
            return self;
        });
    }
    rsqrt() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'rsqrt'
            }), self.type), self.constructor);
        });
    }
    rsqrt_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'rsqrt_'
            }));
            return self;
        });
    }
    remainder(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'remainder');
        });
    }
    remainder_(x) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            return self.arithmetic_operation(x, 'remainder', true);
        });
    }
    sample(dim) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sample',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    tan() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'tan'
            }), self.type), self.constructor);
        });
    }
    tan_() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'tan_'
            }));
            return self;
        });
    }
    tanh() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'tanh'
            }), self.type), self.constructor);
        });
    }
    squeeze(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'squeeze',
                tensorIndexParams: [dim]
            }), self.type), self.constructor);
        });
    }
    squeeze_(dim = -1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            yield controller.sendJSON(self.cmd({
                functionCall: 'squeeze_',
                tensorIndexParams: [dim]
            }));
            return self;
        });
    }
    min(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'min',
                tensorIndexParams: [dim, keepdim]
            }), self.type), self.constructor);
        });
    }
    max(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'max',
                tensorIndexParams: [dim, keepdim]
            }), self.type), self.constructor);
        });
    }
    sum(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'sum',
                tensorIndexParams: [dim, keepdim]
            }), self.type), self.constructor);
        });
    }
    prod(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'prod',
                tensorIndexParams: [dim, keepdim]
            }), self.type), self.constructor);
        });
    }
    mean(dim = -1, keepdim = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            self.ready();
            return asserts_1.assertType(yield controller.sendJSON(self.cmd({
                functionCall: 'mean',
                tensorIndexParams: [dim, keepdim]
            }), self.type), self.constructor);
        });
    }
}
exports.Tensor = Tensor;
class IntTensor extends Tensor {
    constructor() {
        super(...arguments);
        this.type = 'IntTensor';
    }
    static get(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new IntTensor(AsyncClass_1.AsyncInstance, id);
        });
    }
    static create(arr, autograd = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let data = new DimArray_1.IntDimArray(arr);
            let id = asserts_1.assertType(yield controller.sendJSON({
                objectType: 'IntTensor',
                tensorIndexParams: [],
                functionCall: 'create',
                data: Array.from(data.data),
                shape: Array.from(data.shape)
            }, 'string'), 'string');
            let tensor = new IntTensor(AsyncClass_1.AsyncInstance, id);
            if (autograd) {
                yield tensor.autograd(autograd);
            }
            return tensor;
        });
    }
}
IntTensor.$ = IntTensor;
exports.IntTensor = IntTensor;
class FloatTensor extends Tensor {
    constructor() {
        super(...arguments);
        this.type = 'FloatTensor';
    }
    static get(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new FloatTensor(AsyncClass_1.AsyncInstance, id);
        });
    }
    static create(arr, autograd = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let data = new DimArray_1.FloatDimArray(arr);
            let id = asserts_1.assertType(yield controller.sendJSON({
                objectType: 'FloatTensor',
                tensorIndexParams: [],
                functionCall: 'create',
                data: Array.from(data.data),
                shape: Array.from(data.shape)
            }, 'string'), 'string');
            let tensor = new FloatTensor(AsyncClass_1.AsyncInstance, id);
            if (autograd) {
                yield tensor.autograd(autograd);
            }
            return tensor;
        });
    }
}
FloatTensor.$ = FloatTensor;
exports.FloatTensor = FloatTensor;
//# sourceMappingURL=Tensor.js.map