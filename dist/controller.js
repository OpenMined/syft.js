"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const uuid = require("uuid");
const zmq = require("zmq");
const Tensor_1 = require("./Tensor");
const WorkQueue_1 = require("./WorkQueue");
const Model_1 = require("./Model");
const verbose = false;
const identity = uuid.v4();
const socket = zmq.socket('dealer');
socket.identity = identity;
socket.connect('tcp://localhost:5555');
function log(message) {
    if (verbose) {
        console.log(message);
    }
}
exports.log = log;
function cmd(options) {
    return Object.assign({ objectType: 'controller', objectIndex: '-1', tensorIndexParams: [] }, options);
}
exports.cmd = cmd;
const wq = new WorkQueue_1.WorkQueue(job => {
    console.log('sending:', job.data);
    socket.send(job.data);
}, 1);
socket.on('message', (res) => {
    let job;
    for (let id in wq.working) {
        job = wq.working[id];
    }
    if (job) {
        let r = res.toString();
        console.log('receiving:', r);
        if (r.startsWith('Unity Error:')) {
            job.reject(new Error(r));
        }
        else {
            job.resolve(r);
        }
    }
});
function num_models() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return sendJSON(cmd({
            functionCall: 'num_models'
        }), 'int');
    });
}
exports.num_models = num_models;
function load(filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return sendJSON(cmd({
            functionCall: 'load_floattensor',
            tensorIndexParams: [filename]
        }), 'FloatTensor');
    });
}
exports.load = load;
function save(x, filename) {
    return x.save(filename);
}
exports.save = save;
function concatenate(tensors, axis = 0) {
    let ids = tensors.map(t => t.id);
    return sendJSON(cmd({
        functionCall: 'concatenate',
        tensorIndexParams: [axis, ...ids]
    }), 'FloatTensor');
}
exports.concatenate = concatenate;
function num_tensors() {
    return sendJSON(cmd({
        functionCall: 'num_tensors'
    }), 'int');
}
exports.num_tensors = num_tensors;
function new_tensors_allowed(allowed) {
    if (allowed == void 0) {
        return sendJSON(cmd({
            functionCall: 'new_tensors_allowed'
        }), 'bool');
    }
    else if (allowed) {
        return sendJSON(cmd({
            functionCall: 'new_tensors_allowed',
            tensorIndexParams: ['True']
        }), 'bool');
    }
    else {
        return sendJSON(cmd({
            functionCall: 'new_tensors_allowed',
            tensorIndexParams: ['False']
        }), 'bool');
    }
}
exports.new_tensors_allowed = new_tensors_allowed;
function get_tensor(id) {
    return new Tensor_1.FloatTensor(id, true);
}
exports.get_tensor = get_tensor;
function __getitem__(id) {
    return get_tensor(id);
}
exports.__getitem__ = __getitem__;
function sendJSON(message, return_type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let data = JSON.stringify(message);
        let res = yield wq.queue(data);
        log(res);
        if (return_type == void 0) {
            return;
        }
        else if (return_type == 'FloatTensor') {
            if (res != '-1' && res != '') {
                log('FloatTensor.__init__: ' + res);
                return new Tensor_1.FloatTensor(res, true);
            }
            return;
        }
        else if (return_type == 'IntTensor') {
            if (res != '-1' && res != '') {
                log('IntTensor.__init__: ' + res);
                return new Tensor_1.IntTensor(res, true);
            }
            return;
        }
        else if (return_type == 'FloatTensor_list') {
            let tensors = [];
            if (res != '') {
                let ids = res.split(',');
                for (let str_id in ids) {
                    if (str_id) {
                        tensors.push(get_tensor(str_id));
                    }
                }
            }
            return tensors;
        }
        else if (return_type == 'Model_list') {
            let models = [];
            if (res != '') {
                let ids = res.split(',');
                for (let str_id in ids) {
                    if (str_id) {
                        models.push(yield Model_1.Model.getModel(str_id));
                    }
                }
            }
            return models;
        }
        else if (return_type == 'int') {
            return Number(res);
        }
        else if (return_type == 'string') {
            return String(res);
        }
        else if (return_type == 'bool') {
            if (res == 'True') {
                return true;
            }
            else if (res == 'False') {
                return false;
            }
        }
        return res;
    });
}
exports.sendJSON = sendJSON;
//# sourceMappingURL=controller.js.map