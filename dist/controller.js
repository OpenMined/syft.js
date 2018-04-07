"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const zmq = require("zmq");
const syft_1 = require("./syft");
const lib_1 = require("./lib");
let verbose = !!process.argv[2];
function setVerbose(val) {
    verbose = val;
}
exports.setVerbose = setVerbose;
const identity = uuid.v4();
const socket = zmq.socket('dealer');
socket.identity = identity;
socket.connect('tcp://localhost:5555');
function log(...args) {
    if (verbose) {
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
async function numModels() {
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'num_models'
    }), 'int'), 'number');
}
exports.numModels = numModels;
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
async function numTensors() {
    return lib_1.assertType(await sendJSON(cmd({
        functionCall: 'num_tensors'
    }), 'int'), 'number');
}
exports.numTensors = numTensors;
async function newTensorsAllowed(allowed) {
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
exports.newTensorsAllowed = newTensorsAllowed;
async function sendJSON(message, returnType) {
    let data = JSON.stringify(message);
    let res = await wq.queue(data);
    if (returnType == null) {
        return;
    }
    else if (returnType === 'FloatTensor') {
        if (res !== '-1' && res !== '') {
            return new syft_1.FloatTensor(lib_1.AsyncInstance, res);
        }
        return;
    }
    else if (returnType === 'IntTensor') {
        if (res !== '-1' && res !== '') {
            return new syft_1.IntTensor(lib_1.AsyncInstance, res);
        }
        return;
    }
    else if (returnType === 'FloatTensor_list') {
        let tensors = [];
        if (res !== '') {
            let ids = res.split(',');
            for (let strId of ids) {
                if (strId) {
                    tensors.push(new syft_1.FloatTensor(lib_1.AsyncInstance, strId));
                }
            }
        }
        return tensors;
    }
    else if (returnType === 'Model_list') {
        let models = [];
        if (res !== '') {
            let ids = res.split(',');
            for (let strId of ids) {
                if (strId) {
                    models.push(await syft_1.Model.getModel(strId));
                }
            }
        }
        return models;
    }
    else if (returnType === 'int' || returnType === 'float') {
        return Number(res);
    }
    else if (returnType === 'string') {
        return String(res);
    }
    else if (returnType === 'bool') {
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