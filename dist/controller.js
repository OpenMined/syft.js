"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const zmq = require("zmq");
const syft_1 = require("./syft");
const lib_1 = require("./lib");
exports.verbose = !!process.argv[2];
const identity = uuid.v4();
const socket = zmq.socket('dealer');
socket.identity = identity;
socket.connect('tcp://localhost:5555');
function log(...args) {
    if (exports.verbose) {
        console.log(...args);
    }
}
exports.log = log;
function cmd(options) {
    return Object.assign({ objectType: 'controller', objectIndex: '-1', tensorIndexParams: [] }, options);
}
exports.cmd = cmd;
const wq = new lib_1.WorkQueue(job => {
    log('sending:', job.data);
    socket.send(job.data);
}, 1);
socket.on('message', (res) => {
    let job;
    for (let id in wq.working) {
        job = wq.working[id];
    }
    if (job) {
        let r = res.toString();
        log('receiving:', r);
        if (r.startsWith('Unity Error:')) {
            job.reject(new Error(r));
        }
        else {
            job.resolve(r);
        }
    }
});
async function num_models() {
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'num_models'
    }), 'int'), 'number');
}
exports.num_models = num_models;
async function load(filename) {
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'load_floattensor',
        tensorIndexParams: [filename]
    }), 'FloatTensor'), syft_1.FloatTensor);
}
exports.load = load;
async function save(x, filename) {
    return x.save(filename);
}
exports.save = save;
async function concatenate(tensors, axis = 0) {
    let ids = tensors.map(t => t.id);
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'concatenate',
        tensorIndexParams: [axis, ...ids]
    }), 'FloatTensor'), syft_1.FloatTensor);
}
exports.concatenate = concatenate;
async function num_tensors() {
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'num_tensors'
    }), 'int'), 'number');
}
exports.num_tensors = num_tensors;
async function new_tensors_allowed(allowed) {
    if (allowed == null) {
        return lib_1.assertType(await sendJSON(cmd({
            functionCall: 'new_tensors_allowed'
        }), 'bool'), 'boolean');
    }
    else if (allowed) {
        return lib_1.assertType(await sendJSON(cmd({
            functionCall: 'new_tensors_allowed',
            tensorIndexParams: ['True']
        }), 'bool'), 'boolean');
    }
    else {
        return lib_1.assertType(await sendJSON(cmd({
            functionCall: 'new_tensors_allowed',
            tensorIndexParams: ['False']
        }), 'bool'), 'boolean');
    }
}
exports.new_tensors_allowed = new_tensors_allowed;
async function sendJSON(message, return_type) {
    let data = JSON.stringify(message);
    let res = await wq.queue(data);
    if (return_type == null) {
        return;
    }
    else if (return_type === 'FloatTensor') {
        if (res !== '-1' && res !== '') {
            return new syft_1.FloatTensor(lib_1.AsyncInstance, res);
        }
        return;
    }
    else if (return_type === 'IntTensor') {
        if (res !== '-1' && res !== '') {
            return new syft_1.IntTensor(lib_1.AsyncInstance, res);
        }
        return;
    }
    else if (return_type === 'FloatTensor_list') {
        let tensors = [];
        if (res !== '') {
            let ids = res.split(',');
            for (let str_id of ids) {
                if (str_id) {
                    tensors.push(new syft_1.FloatTensor(lib_1.AsyncInstance, str_id));
                }
            }
        }
        return tensors;
    }
    else if (return_type === 'Model_list') {
        let models = [];
        if (res !== '') {
            let ids = res.split(',');
            for (let str_id of ids) {
                if (str_id) {
                    models.push(await syft_1.Model.getModel(str_id));
                }
            }
        }
        return models;
    }
    else if (return_type === 'int' || return_type === 'float') {
        return Number(res);
    }
    else if (return_type === 'string') {
        return String(res);
    }
    else if (return_type === 'bool') {
        if (res === 'True') {
            return true;
        }
        else if (res === 'False') {
            return false;
        }
    }
    return res;
}
exports.sendJSON = sendJSON;
//# sourceMappingURL=controller.js.map