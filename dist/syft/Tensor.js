"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller = require("../controller");
const lib_1 = require("../lib");
class Tensor extends lib_1.AsyncInstance {
    constructor() {
        super(...arguments);
        this.type = '';
    }
    async delete() {
        this.__delete__();
        this.ready();
        if (this.id) {
            await controller.sendJSON(this.cmd({
                functionCall: 'delete'
            }));
        }
    }
    async autograd(state) {
        this.ready();
    }
    async get(paramName = 'size', responseAsTensor = false) {
        this.ready();
        if (responseAsTensor) {
            return lib_1.assertType(await controller.sendJSON(this.cmd({
                functionCall: 'get',
                tensorIndexParams: [paramName]
            }), this.type), this.constructor);
        }
        else {
            return lib_1.assertType(await controller.sendJSON(this.cmd({
                functionCall: 'get',
                tensorIndexParams: [paramName]
            }), 'string'), 'string');
        }
    }
    cmd(options) {
        return Object.assign({ objectType: this.type, objectIndex: this.id, tensorIndexParams: [], hyperParams: [] }, options);
    }
    async isContiguous() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'is_contiguous'
        }), 'bool'), 'boolean');
    }
    async getData() {
        this.ready();
        let res;
        if (await this.isContiguous()) {
            res = lib_1.assertType(await controller.sendJSON(this.cmd({
                functionCall: 'to_numpy'
            }), 'string'), 'string');
            return res.split(' ').map(a => Number(a));
        }
        else {
            return ' - non-contiguous - ';
        }
    }
    async __repr__(verbose = true) {
        this.ready();
        let tensorStr = await this.getData();
        let typeStr = (await this.shape()).join('x');
        let grad = await this.get('grad');
        if (grad === '') {
            grad = 'None';
        }
        let co = String(await this.creationOp());
        let desc = `[syft.${this.type}: ${this.id} grad: ${grad} size: ${typeStr} init: ${co}]\n`;
        if (verbose) {
            let children = await this.children();
            let creators = await this.creators();
            if (children.length > 0) {
                desc += '\n\t-----------children-----------\n';
            }
            for (let childId of children) {
                let child = new FloatTensor(lib_1.AsyncInstance, childId);
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
            for (let parentId of creators) {
                let parent = new FloatTensor(lib_1.AsyncInstance, parentId);
                desc += '\t' + await parent.__repr__(false);
            }
            if (creators.length > 0) {
                desc += '\t------------------------------\n\n\n';
            }
            return tensorStr + '\n' + desc;
        }
        return desc;
    }
    async batchify(dim, batchSize) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'batchify',
            tensorIndexParams: [dim, batchSize]
        }), 'FloatTensor_list'), Array);
    }
    async clamp(min, max) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'clamp',
            tensorIndexParams: [min, max]
        }), this.type), this.constructor);
    }
    async equal(x) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'equal',
            tensorIndexParams: [x.id]
        }), 'bool'), 'boolean');
    }
    async lt(x) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'lt',
            tensorIndexParams: [x.id]
        }), this.type), this.constructor);
    }
    async lt_(x) {
        this.ready();
        lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'lt_',
            tensorIndexParams: [x.id]
        }), this.type), this.constructor);
        return this;
    }
    async norm(dim = -1, keepdim = false, p = 2) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'norm',
            tensorIndexParams: [dim, keepdim, p]
        }), this.type), this.constructor);
    }
    async random_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'random_'
        }), this.type);
        return this;
    }
    async split(splitSizeOrSections, dim = 0) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'split_by_size',
            tensorIndexParams: [splitSizeOrSections, dim]
        }), 'FloatTensor_list'), Array);
    }
    async abs() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'abs'
        }), this.type), this.constructor);
    }
    async abs_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'abs_'
        }));
        return this;
    }
    async acos() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'acos'
        }), this.type), this.constructor);
    }
    async acos_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'acos_'
        }));
        return this;
    }
    async addmm_(x, y) {
        await Promise.all([
            this.ready(),
            x.ready(),
            y.ready()
        ]);
        await controller.sendJSON(this.cmd({
            functionCall: 'addmm_',
            tensorIndexParams: [x.id, y.id]
        }));
        return this;
    }
    async addmm(x, y) {
        await Promise.all([
            this.ready(),
            x.ready(),
            y.ready()
        ]);
        let copy = await this.copy();
        await copy.addmm_(x, y);
        return copy;
    }
    async addmv_(x, y) {
        await Promise.all([
            this.ready(),
            x.ready(),
            y.ready()
        ]);
        await controller.sendJSON(this.cmd({
            functionCall: 'addmv_',
            tensorIndexParams: [x.id, y.id]
        }));
        return this;
    }
    async addmv(x, y) {
        await Promise.all([
            this.ready(),
            x.ready(),
            y.ready()
        ]);
        let copy = await this.copy();
        await copy.addmv_(x, y);
        return copy;
    }
    async asin() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'asin'
        }), this.type), this.constructor);
    }
    async asin_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'asin_'
        }));
        return this;
    }
    async atan() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'atan'
        }), this.type), this.constructor);
    }
    async atan_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'atan_'
        }));
        return this;
    }
    async backward(grad) {
        this.ready();
        if (grad == null) {
            await controller.sendJSON(this.cmd({
                functionCall: 'backward'
            }));
        }
        else {
            await controller.sendJSON(this.cmd({
                functionCall: 'backward',
                tensorIndexParams: [grad.id]
            }));
        }
    }
    async ceil() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'ceil'
        }), this.type), this.constructor);
    }
    async ceil_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'ceil_'
        }));
        return this;
    }
    async contiguous() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'contiguous'
        }), this.type), this.constructor);
    }
    async copy() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'copy'
        }), this.type), this.constructor);
    }
    async cos() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'cos'
        }), this.type), this.constructor);
    }
    async cos_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'cos_'
        }));
        return this;
    }
    async cosh() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'cosh'
        }), this.type), this.constructor);
    }
    async cosh_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'cosh_'
        }));
        return this;
    }
    async children() {
        this.ready();
        let res = await this.get('children');
        if (res && typeof res === 'string') {
            return [];
        }
        return [];
    }
    async creationOp() {
        this.ready();
        return this.get('creation_op');
    }
    async creators() {
        this.ready();
        let res = await this.get('creators');
        if (typeof res === 'string' && res.length > 0) {
            return res.split(',').slice(0, -1);
        }
        return [];
    }
    async cumsum(dim = 0) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'cumsum',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async dataOnGpu() {
        this.ready();
        if (await this.get('dataOnGpu') === '1') {
            return true;
        }
        return false;
    }
    async exp() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'exp'
        }), this.type), this.constructor);
    }
    async exp_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'exp_'
        }));
        return this;
    }
    async expand(...args) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'expand',
            tensorIndexParams: args
        }), this.type), this.constructor);
    }
    async indexAdd(indices, dim, x) {
        await Promise.all([
            this.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'index_add',
            tensorIndexParams: [indices.id, dim, x.id]
        }), this.type), this.constructor);
    }
    async indexAdd_(indices, dim, x) {
        await Promise.all([
            this.ready(),
            x.ready()
        ]);
        await controller.sendJSON(this.cmd({
            functionCall: 'index_add_',
            tensorIndexParams: [indices.id, dim, x.id]
        }), this.type);
        return this;
    }
    async indexSelect(dim, indices) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'index_select',
            tensorIndexParams: [indices.id, dim]
        }), this.type), this.constructor);
    }
    async keepgrad() {
        this.ready();
        if (await this.get('keepgrad') === '1') {
            return true;
        }
        else {
            return false;
        }
    }
    async pow(x) {
        return this.arithmeticOperation(x, 'pow', false);
    }
    async pow_(x) {
        return this.arithmeticOperation(x, 'pow', true);
    }
    async floor() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'floor'
        }), this.type), this.constructor);
    }
    async floor_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'floor_'
        }));
        return this;
    }
    async round() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'round'
        }), this.type), this.constructor);
    }
    async round_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'round_'
        }));
        return this;
    }
    async mm(x) {
        await Promise.all([
            this.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'mm',
            tensorIndexParams: [x.id]
        }), this.type), this.constructor);
    }
    async grad() {
        this.ready();
        return this.get('grad', true);
    }
    async neg() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'neg'
        }), this.type), this.constructor);
    }
    async neg_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'neg_'
        }));
        return this;
    }
    async relu() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'relu'
        }), this.type), this.constructor);
    }
    async save(filename) {
        this.ready();
        return lib_1.assertType(controller.sendJSON(this.cmd({
            functionCall: 'save',
            tensorIndexParams: [filename]
        }), 'bool'), 'boolean');
    }
    async set(paramName = 'size', params = []) {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'set',
            tensorIndexParams: [...paramName, params]
        }));
    }
    async sigmoid_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'sigmoid_'
        }));
        return this;
    }
    async sigmoid() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sigmoid'
        }), this.type), this.constructor);
    }
    async sign() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sign'
        }), this.type), this.constructor);
    }
    async sign_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'sign_'
        }));
        return this;
    }
    async sin() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sin'
        }), this.type), this.constructor);
    }
    async sin_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'sin_'
        }));
        return this;
    }
    async size() {
        this.ready();
        return this.get('size');
    }
    async shape(asList = true) {
        this.ready();
        let res = lib_1.assertType(await this.get('shape'), 'string');
        return res.split(',').slice(0, -1).map(a => Number(a));
    }
    async softmax(dim = -1) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'softmax',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async std(dim = -1) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'std',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async stride(dim = -1) {
        this.ready();
        if (dim === -1) {
            return lib_1.assertType(await controller.sendJSON(this.cmd({
                functionCall: 'stride'
            }), 'int'), 'number');
        }
        else {
            let strides = lib_1.assertType(await controller.sendJSON(this.cmd({
                functionCall: 'stride',
                tensorIndexParams: [dim]
            }), 'int'), 'number');
            return strides.split(' ').map(Number);
        }
    }
    async sqrt() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sqrt'
        }), this.type), this.constructor);
    }
    async sqrt_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'sqrt_'
        }));
        return this;
    }
    async trace() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'trace'
        }), this.type), this.constructor);
    }
    async trunc() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'trunc'
        }), this.type), this.constructor);
    }
    async view(...args) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'view',
            tensorIndexParams: args
        }), this.type), this.constructor);
    }
    async view_(...args) {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'view_',
            tensorIndexParams: args
        }));
        return this;
    }
    async viewAs(x) {
        await Promise.all([
            this.ready(),
            x.ready()
        ]);
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'view_as',
            tensorIndexParams: [x.id]
        }), this.type), this.constructor);
    }
    async viewAs_(x) {
        await Promise.all([
            this.ready(),
            x.ready()
        ]);
        await controller.sendJSON(this.cmd({
            functionCall: 'view_as_',
            tensorIndexParams: [x.id]
        }));
        return this;
    }
    async T() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'transpose'
        }), this.type), this.constructor);
    }
    async triu(k = 0) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'triu',
            tensorIndexParams: [k]
        }), this.type), this.constructor);
    }
    async triu_(k = 0) {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'triu_',
            tensorIndexParams: [k]
        }));
        return this;
    }
    async unsqueeze(dim) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'unsqueeze',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async unsqueeze_(dim) {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'unsqueeze_',
            tensorIndexParams: [dim]
        }));
        return this;
    }
    async zero_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'zero_'
        }));
        return this;
    }
    async toString() {
        this.ready();
        let shape = await this.shape();
        let data = await this.getData();
        return `${this.type}<${shape.join('x')}>(id: ${this.id}) [${data}]`;
    }
    async cpu() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'cpu'
        }), this.type), this.constructor);
    }
    async gpu() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'gpu'
        }), this.type), this.constructor);
    }
    async arithmeticOperation(x, name, inline = false) {
        this.ready();
        let operationCmd = name;
        let parameter;
        if (x instanceof Tensor) {
            await x.ready();
            operationCmd += '_elem';
            parameter = x.id;
        }
        else {
            operationCmd += '_scalar';
            parameter = String(x);
        }
        if (inline) {
            operationCmd += '_';
            await controller.sendJSON(this.cmd({
                functionCall: operationCmd,
                tensorIndexParams: [parameter]
            }));
            return this;
        }
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: operationCmd,
            tensorIndexParams: [parameter]
        }), this.type), this.constructor);
    }
    async add(x) {
        return this.arithmeticOperation(x, 'add');
    }
    async add_(x) {
        return this.arithmeticOperation(x, 'add', true);
    }
    async sub(x) {
        return this.arithmeticOperation(x, 'sub');
    }
    async sub_(x) {
        return this.arithmeticOperation(x, 'sub', true);
    }
    async mul(x) {
        return this.arithmeticOperation(x, 'mul');
    }
    async mul_(x) {
        return this.arithmeticOperation(x, 'mul', true);
    }
    async div(x) {
        return this.arithmeticOperation(x, 'div');
    }
    async div_(x) {
        return this.arithmeticOperation(x, 'div', true);
    }
    async mod(x) {
        return this.arithmeticOperation(x, 'mod');
    }
    async mod_(x) {
        return this.arithmeticOperation(x, 'mod', true);
    }
    async sinh() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sinh'
        }), this.type), this.constructor);
    }
    async sinh_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'sinh_'
        }));
        return this;
    }
    async log() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'log'
        }), this.type), this.constructor);
    }
    async log_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'log_'
        }));
        return this;
    }
    async log1p_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'log1p_'
        }));
        return this;
    }
    async log1p() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'log1p'
        }), this.type), this.constructor);
    }
    async frac() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'frac'
        }), this.type), this.constructor);
    }
    async frac_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'frac_'
        }));
        return this;
    }
    async reciprocal() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'reciprocal'
        }), this.type), this.constructor);
    }
    async reciprocal_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'reciprocal_'
        }));
        return this;
    }
    async rsqrt() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'rsqrt'
        }), this.type), this.constructor);
    }
    async rsqrt_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'rsqrt_'
        }));
        return this;
    }
    async remainder(x) {
        return this.arithmeticOperation(x, 'remainder');
    }
    async remainder_(x) {
        return this.arithmeticOperation(x, 'remainder', true);
    }
    async sample(dim) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sample',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async tan() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'tan'
        }), this.type), this.constructor);
    }
    async tan_() {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'tan_'
        }));
        return this;
    }
    async tanh() {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'tanh'
        }), this.type), this.constructor);
    }
    async squeeze(dim = -1) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'squeeze',
            tensorIndexParams: [dim]
        }), this.type), this.constructor);
    }
    async squeeze_(dim = -1) {
        this.ready();
        await controller.sendJSON(this.cmd({
            functionCall: 'squeeze_',
            tensorIndexParams: [dim]
        }));
        return this;
    }
    async min(dim = -1, keepdim = false) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'min',
            tensorIndexParams: [dim, keepdim]
        }), this.type), this.constructor);
    }
    async max(dim = -1, keepdim = false) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'max',
            tensorIndexParams: [dim, keepdim]
        }), this.type), this.constructor);
    }
    async sum(dim = -1, keepdim = false) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'sum',
            tensorIndexParams: [dim, keepdim]
        }), this.type), this.constructor);
    }
    async prod(dim = -1, keepdim = false) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'prod',
            tensorIndexParams: [dim, keepdim]
        }), this.type), this.constructor);
    }
    async mean(dim = -1, keepdim = false) {
        this.ready();
        return lib_1.assertType(await controller.sendJSON(this.cmd({
            functionCall: 'mean',
            tensorIndexParams: [dim, keepdim]
        }), this.type), this.constructor);
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
            data = new lib_1.IntDimArray(arr);
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