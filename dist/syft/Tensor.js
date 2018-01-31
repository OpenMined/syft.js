"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
const lib_1 = require("../lib");
const TensorSerializer_1 = require("./TensorSerializer");
const tensorSerializer = new TensorSerializer_1.TensorSerializer;
class Tensor extends lib_1.AsyncInstance {
    static async deserialize(str) {
        return tensorSerializer.deserialize(str);
    }
    serialize(optimizeStorage = false) {
        return tensorSerializer.serialize(this, optimizeStorage);
    }
    finish(id) {
        let self = this;
        self.id = id;
    }
    async delete() {
        let self = this;
        self.__delete__();
        self.ready();
        if (self.id) {
            await controller.sendJSON(self.cmd({
                functionCall: 'delete'
            }));
        }
    }
    async autograd(state) {
        let self = this;
        self.ready();
    }
    async get(param_name = 'size', response_as_tensor = false) {
        let self = this;
        self.ready();
        if (response_as_tensor) {
            return lib_1.assertType(await controller.sendJSON(self.cmd({
                functionCall: 'get',
                tensorIndexParams: [param_name]
            }), self.type), self.constructor);
        }
        else {
            return lib_1.assertType(await controller.sendJSON(self.cmd({
                functionCall: 'get',
                tensorIndexParams: [param_name]
            }), 'string'), 'string');
        }
    }
    cmd(options) {
        let self = this;
        return Object.assign({ objectType: self.type, objectIndex: self.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
    async is_contiguous() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'is_contiguous'
        }), 'bool'), 'boolean');
    }
    async to_numpy() {
        let self = this;
        self.ready();
        let res;
        if (await self.is_contiguous()) {
            res = lib_1.assertType(await controller.sendJSON(self.cmd({
                functionCall: 'to_numpy'
            }), 'string'), 'string');
            return res.split(' ').map(a => Number(a));
        }
        else {
            return ' - non-contiguous - ';
        }
    }
    async __repr__(verbose = true) {
        let self = this;
        self.ready();
        let tensor_str = await self.to_numpy();
        let type_str = (await self.shape()).join('x');
        let grad = await self.get('grad');
        if (grad === '') {
            grad = 'None';
        }
        let co = String(await self.creation_op());
        let desc = `[syft.${self.type}: ${self.id} grad: ${grad} size: ${type_str} init: ${co}]\n`;
        if (verbose) {
            let children = await self.children();
            let creators = await self.creators();
            if (children.length > 0) {
                desc += '\n\t-----------children-----------\n';
            }
            for (let child_id of children) {
                let child = new FloatTensor(lib_1.AsyncInstance, child_id);
                desc += '\t' + await child.__repr__(false);
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
                let parent = new FloatTensor(lib_1.AsyncInstance, parent_id);
                desc += '\t' + await parent.__repr__(false);
            }
            if (creators.length > 0) {
                desc += '\t------------------------------\n\n\n';
            }
            return tensor_str + '\n' + desc;
        }
        return desc;
    }
    async batchify(dim, batch_size) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'batchify',
            tensorIndexParams: [dim, batch_size]
        }), 'FloatTensor_list'), Array);
    }
    async clamp(min, max) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'clamp',
            tensorIndexParams: [min, max]
        }), self.type), this.constructor);
    }
    async equal(x) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'equal',
            tensorIndexParams: [x.id]
        }), 'bool'), 'boolean');
    }
    async lt(x) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'lt',
            tensorIndexParams: [x.id]
        }), 'bool'), 'boolean');
    }
    async lt_(x) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'lt_',
            tensorIndexParams: [x.id]
        }), 'bool'), 'boolean');
    }
    async norm(dim = -1, keepdim = false, p = 2) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'norm',
            tensorIndexParams: [dim, keepdim, p]
        }), self.type), self.constructor);
    }
    async random_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'random_'
        }), self.type);
        return self;
    }
    async split(split_size_or_sections, dim = 0) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'split_by_size',
            tensorIndexParams: [split_size_or_sections, dim]
        }), 'FloatTensor_list'), Array);
    }
    async abs() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'abs'
        }), self.type), self.constructor);
    }
    async abs_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'abs_'
        }));
        return self;
    }
    async acos() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'acos'
        }), self.type), self.constructor);
    }
    async acos_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'acos_'
        }));
        return self;
    }
    async addmm_(x, y) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready(),
            y.ready()
        ]);
        await controller.sendJSON(self.cmd({
            functionCall: 'addmm_',
            tensorIndexParams: [x.id, y.id]
        }));
        return self;
    }
    async addmm(x, y) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready(),
            y.ready()
        ]);
        let copy = await self.copy();
        await copy.addmm_(x, y);
        return copy;
    }
    async addmv_(x, y) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready(),
            y.ready()
        ]);
        await controller.sendJSON(self.cmd({
            functionCall: 'addmv_',
            tensorIndexParams: [x.id, y.id]
        }));
        return self;
    }
    async addmv(x, y) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready(),
            y.ready()
        ]);
        let copy = await self.copy();
        await copy.addmv_(x, y);
        return copy;
    }
    async asin() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'asin'
        }), self.type), self.constructor);
    }
    async asin_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'asin_'
        }));
        return self;
    }
    async atan() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'atan'
        }), self.type), self.constructor);
    }
    async atan_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'atan_'
        }));
        return self;
    }
    async backward(grad) {
        let self = this;
        self.ready();
        if (grad == null) {
            await controller.sendJSON(self.cmd({
                functionCall: 'backward'
            }));
        }
        else {
            await controller.sendJSON(self.cmd({
                functionCall: 'backward',
                tensorIndexParams: [grad.id]
            }));
        }
    }
    async ceil() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'ceil'
        }), self.type), self.constructor);
    }
    async ceil_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'ceil_'
        }));
        return self;
    }
    async contiguous() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'contiguous'
        }), self.type), self.constructor);
    }
    async copy() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'copy'
        }), self.type), self.constructor);
    }
    async cos() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'cos'
        }), self.type), self.constructor);
    }
    async cos_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'cos_'
        }));
        return self;
    }
    async cosh() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'cosh'
        }), self.type), self.constructor);
    }
    async cosh_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'cosh_'
        }));
        return self;
    }
    async children() {
        let self = this;
        self.ready();
        let res = await self.get('children');
        if (res && typeof res === 'string') {
            return [];
        }
        return [];
    }
    async creation_op() {
        let self = this;
        self.ready();
        return self.get('creation_op');
    }
    async creators() {
        let self = this;
        self.ready();
        let res = await self.get('creators');
        if (typeof res === 'string' && res.length > 0) {
            return res.split(',').slice(0, -1);
        }
        return [];
    }
    async cumsum(dim = 0) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'cumsum',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async dataOnGpu() {
        let self = this;
        self.ready();
        if (await self.get('dataOnGpu') === '1') {
            return true;
        }
        return false;
    }
    async exp() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'exp'
        }), self.type), self.constructor);
    }
    async exp_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'exp_'
        }));
        return self;
    }
    async expand(...args) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'expand',
            tensorIndexParams: args
        }), self.type), self.constructor);
    }
    async index_add(indices, dim, x) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'index_add',
            tensorIndexParams: [indices.id, dim, x.id]
        }), self.type), self.constructor);
    }
    async index_add_(indices, dim, x) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready()
        ]);
        await controller.sendJSON(self.cmd({
            functionCall: 'index_add_',
            tensorIndexParams: [indices.id, dim, x.id]
        }), self.type);
        return self;
    }
    async index_select(dim, indices) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'index_select',
            tensorIndexParams: [indices.id, dim]
        }), self.type), self.constructor);
    }
    async keepgrad() {
        let self = this;
        self.ready();
        if (await self.get('keepgrad') === '1') {
            return true;
        }
        else {
            return false;
        }
    }
    async pow(x) {
        let self = this;
        return self.arithmetic_operation(x, 'pow', false);
    }
    async pow_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'pow', true);
    }
    async floor() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'floor'
        }), self.type), self.constructor);
    }
    async floor_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'floor_'
        }));
        return self;
    }
    async round() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'round'
        }), self.type), self.constructor);
    }
    async round_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'round_'
        }));
        return self;
    }
    async mm(x) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'mm',
            tensorIndexParams: [x.id]
        }), self.type), self.constructor);
    }
    async grad() {
        let self = this;
        self.ready();
        return self.get('grad', true);
    }
    async neg() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'neg'
        }), self.type), self.constructor);
    }
    async neg_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'neg_'
        }));
        return self;
    }
    async relu() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'relu'
        }), self.type), self.constructor);
    }
    async save(filename) {
        let self = this;
        self.ready();
        return lib_1.assertType(controller.sendJSON(self.cmd({
            functionCall: 'save',
            tensorIndexParams: [filename]
        }), 'bool'), 'boolean');
    }
    async set(param_name = 'size', params = []) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'set',
            tensorIndexParams: [...param_name, params]
        }));
    }
    async sigmoid_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'sigmoid_'
        }));
        return self;
    }
    async sigmoid() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sigmoid'
        }), self.type), self.constructor);
    }
    async sign() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sign'
        }), self.type), self.constructor);
    }
    async sign_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'sign_'
        }));
        return self;
    }
    async sin() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sin'
        }), self.type), self.constructor);
    }
    async sin_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'sin_'
        }));
        return self;
    }
    async size() {
        let self = this;
        self.ready();
        return self.get('size');
    }
    async shape(as_list = true) {
        let self = this;
        self.ready();
        let res = lib_1.assertType(await self.get('shape'), 'string');
        return res.split(',').slice(0, -1).map(a => Number(a));
    }
    async softmax(dim = -1) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'softmax',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async std(dim = -1) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'std',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async stride(dim = -1) {
        let self = this;
        self.ready();
        if (dim === -1) {
            return lib_1.assertType(await controller.sendJSON(self.cmd({
                functionCall: 'stride'
            }), 'string'), 'string');
        }
        else {
            let strides = lib_1.assertType(await controller.sendJSON(self.cmd({
                functionCall: 'stride',
                tensorIndexParams: [dim]
            }), 'string'), 'string');
            return strides.split(' ');
        }
    }
    async sqrt() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sqrt'
        }), self.type), self.constructor);
    }
    async sqrt_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'sqrt_'
        }));
        return self;
    }
    async trace() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'trace'
        }), self.type), self.constructor);
    }
    async trunc() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'trunc'
        }), self.type), self.constructor);
    }
    async view(...args) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'view',
            tensorIndexParams: args
        }), self.type), self.constructor);
    }
    async view_(...args) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'view_',
            tensorIndexParams: args
        }));
        return self;
    }
    async view_as(x) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'view_as',
            tensorIndexParams: [x.id]
        }), self.type), self.constructor);
    }
    async view_as_(x) {
        let self = this;
        await Promise.all([
            self.ready(),
            x.ready()
        ]);
        await controller.sendJSON(self.cmd({
            functionCall: 'view_as_',
            tensorIndexParams: [x.id]
        }));
        return self;
    }
    async T() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'transpose'
        }), self.type), self.constructor);
    }
    async triu(k = 0) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'triu',
            tensorIndexParams: [k]
        }), self.type), self.constructor);
    }
    async triu_(k = 0) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'triu_',
            tensorIndexParams: [k]
        }));
        return self;
    }
    async unsqueeze(dim) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'unsqueeze',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async unsqueeze_(dim) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'unsqueeze_',
            tensorIndexParams: [dim]
        }));
        return self;
    }
    async zero_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'zero_'
        }));
        return self;
    }
    async toString() {
        let self = this;
        self.ready();
        let shape = await self.shape();
        let data = await self.to_numpy();
        return `${self.type}<${shape.join('x')}>(id: ${self.id}) [${data}]`;
    }
    async cpu() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'cpu'
        }), self.type), self.constructor);
    }
    async gpu() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'gpu'
        }), self.type), self.constructor);
    }
    async arithmetic_operation(x, name, inline = false) {
        let self = this;
        self.ready();
        let operation_cmd = name;
        let parameter;
        if (x instanceof Tensor) {
            await x.ready();
            operation_cmd += '_elem';
            parameter = x.id;
        }
        else {
            operation_cmd += '_scalar';
            parameter = String(x);
        }
        if (inline) {
            operation_cmd += '_';
            await controller.sendJSON(self.cmd({
                functionCall: operation_cmd,
                tensorIndexParams: [parameter]
            }));
            return self;
        }
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: operation_cmd,
            tensorIndexParams: [parameter]
        }), self.type), self.constructor);
    }
    async add(x) {
        let self = this;
        return self.arithmetic_operation(x, 'add');
    }
    async add_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'add', true);
    }
    async sub(x) {
        let self = this;
        return self.arithmetic_operation(x, 'sub');
    }
    async sub_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'sub', true);
    }
    async mul(x) {
        let self = this;
        return self.arithmetic_operation(x, 'mul');
    }
    async mul_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'mul', true);
    }
    async div(x) {
        let self = this;
        return self.arithmetic_operation(x, 'div');
    }
    async div_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'div', true);
    }
    async mod(x) {
        let self = this;
        return self.arithmetic_operation(x, 'mod');
    }
    async mod_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'mod', true);
    }
    async sinh() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sinh'
        }), self.type), self.constructor);
    }
    async sinh_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'sinh_'
        }));
        return self;
    }
    async log() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'log'
        }), self.type), self.constructor);
    }
    async log_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'log_'
        }));
        return self;
    }
    async log1p_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'log1p_'
        }));
        return self;
    }
    async log1p() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'log1p'
        }), self.type), self.constructor);
    }
    async frac() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'frac'
        }), self.type), self.constructor);
    }
    async frac_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'frac_'
        }));
        return self;
    }
    async reciprocal() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'reciprocal'
        }), self.type), self.constructor);
    }
    async reciprocal_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'reciprocal_'
        }));
        return self;
    }
    async rsqrt() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'rsqrt'
        }), self.type), self.constructor);
    }
    async rsqrt_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'rsqrt_'
        }));
        return self;
    }
    async remainder(x) {
        let self = this;
        return self.arithmetic_operation(x, 'remainder');
    }
    async remainder_(x) {
        let self = this;
        return self.arithmetic_operation(x, 'remainder', true);
    }
    async sample(dim) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sample',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async tan() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'tan'
        }), self.type), self.constructor);
    }
    async tan_() {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'tan_'
        }));
        return self;
    }
    async tanh() {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'tanh'
        }), self.type), self.constructor);
    }
    async squeeze(dim = -1) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'squeeze',
            tensorIndexParams: [dim]
        }), self.type), self.constructor);
    }
    async squeeze_(dim = -1) {
        let self = this;
        self.ready();
        await controller.sendJSON(self.cmd({
            functionCall: 'squeeze_',
            tensorIndexParams: [dim]
        }));
        return self;
    }
    async min(dim = -1, keepdim = false) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'min',
            tensorIndexParams: [dim, keepdim]
        }), self.type), self.constructor);
    }
    async max(dim = -1, keepdim = false) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'max',
            tensorIndexParams: [dim, keepdim]
        }), self.type), self.constructor);
    }
    async sum(dim = -1, keepdim = false) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'sum',
            tensorIndexParams: [dim, keepdim]
        }), self.type), self.constructor);
    }
    async prod(dim = -1, keepdim = false) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'prod',
            tensorIndexParams: [dim, keepdim]
        }), self.type), self.constructor);
    }
    async mean(dim = -1, keepdim = false) {
        let self = this;
        self.ready();
        return lib_1.assertType(await controller.sendJSON(self.cmd({
            functionCall: 'mean',
            tensorIndexParams: [dim, keepdim]
        }), self.type), self.constructor);
    }
}
exports.Tensor = Tensor;
class IntTensor extends Tensor {
    constructor() {
        super(...arguments);
        this.type = 'IntTensor';
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(arr, autograd = false) {
        let data;
        if (Array.isArray(arr)) {
            data = new lib_1.FloatDimArray(arr);
        }
        else {
            data = arr;
        }
        let id = lib_1.assertType(await controller.sendJSON({
            objectType: 'IntTensor',
            tensorIndexParams: [],
            functionCall: 'create',
            data: Array.from(data.data),
            shape: Array.from(data.shape)
        }, 'string'), 'string');
        let tensor = new this(lib_1.AsyncInstance, id);
        if (autograd) {
            await tensor.autograd(autograd);
        }
        return tensor;
    }
}
IntTensor.$ = IntTensor;
exports.IntTensor = IntTensor;
class FloatTensor extends Tensor {
    constructor() {
        super(...arguments);
        this.type = 'FloatTensor';
    }
    static async get(id) {
        return new this(lib_1.AsyncInstance, id);
    }
    static async create(arr, autograd = false) {
        let data;
        if (Array.isArray(arr)) {
            data = new lib_1.FloatDimArray(arr);
        }
        else {
            data = arr;
        }
        let id = lib_1.assertType(await controller.sendJSON({
            objectType: 'FloatTensor',
            tensorIndexParams: [],
            functionCall: 'create',
            data: Array.from(data.data),
            shape: Array.from(data.shape)
        }, 'string'), 'string');
        let tensor = new this(lib_1.AsyncInstance, id);
        if (autograd) {
            await tensor.autograd(autograd);
        }
        return tensor;
    }
}
FloatTensor.$ = FloatTensor;
exports.FloatTensor = FloatTensor;
Tensor.IntTensor = IntTensor;
Tensor.FloatTensor = FloatTensor;
//# sourceMappingURL=Tensor.js.map