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
        let self = this;
        self.worker = worker;
        self.limit = limit;
        let idLength = self.idLength = (limit - 1).toString(16).length;
        for (let i = 0; i < limit; i++) {
            let id = i.toString(16);
            self.iddleWorkers[i] = '0'.repeat(idLength - id.length) + id;
        }
    }
    queue(data) {
        let self = this;
        let p = new Promise((res, rej) => {
            self.waiting.push(new Job('', data, self.wrap(res), self.wrap(rej)));
        });
        self.drain();
        return p;
    }
    drain() {
        let self = this;
        if (self.iddleWorkers.length === 0 ||
            self.waiting.length === 0)
            return;
        let id = self.iddleWorkers.shift();
        let job = self.waiting.shift();
        if (!job || !id)
            return;
        job.id = id;
        self.working[id] = job;
        self.worker(job);
    }
    wrap(func) {
        let self = this;
        return function (data) {
            func(data);
            self.iddleWorkers.push(this.id);
            delete self.working[this.id];
            self.drain();
        };
    }
}
exports.WorkQueue = WorkQueue;
//# sourceMappingURL=WorkQueue.js.map