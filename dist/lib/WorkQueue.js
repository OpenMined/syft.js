"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Job {
    constructor(id, data, resolve, reject) {
        this.id = id;
        this.data = data;
        this.resolve = resolve;
        this.reject = reject;
    }
}
exports.Job = Job;
class WorkQueue {
    constructor(worker, limit = 256) {
        this.iddleWorkers = [];
        this.waiting = [];
        this.working = {};
        this.worker = worker;
        this.limit = limit;
        let idLength = this.idLength = (limit - 1).toString(16).length;
        for (let i = 0; i < limit; i++) {
            let id = i.toString(16);
            this.iddleWorkers[i] = '0'.repeat(idLength - id.length) + id;
        }
    }
    queue(data) {
        let p = new Promise((res, rej) => {
            this.waiting.push(new Job('', data, this.wrap(res), this.wrap(rej)));
        });
        this.drain();
        return p;
    }
    drain() {
        if (this.iddleWorkers.length === 0 ||
            this.waiting.length === 0)
            return;
        let id = this.iddleWorkers.shift();
        let job = this.waiting.shift();
        if (!job || !id)
            return;
        job.id = id;
        this.working[id] = job;
        this.worker(job);
    }
    wrap(func) {
        let thisWorkQueue = this;
        return function (data) {
            func(data);
            thisWorkQueue.iddleWorkers.push(this.id);
            delete thisWorkQueue.working[this.id];
            thisWorkQueue.drain();
        };
    }
}
exports.WorkQueue = WorkQueue;
//# sourceMappingURL=WorkQueue.js.map