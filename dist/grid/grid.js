"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const Async = require("promasync");
const syft = require("..");
const controller = require("../controller");
const lib_1 = require("../lib");
const fs = require("fs-extra");
class Grid {
    async get(key) {
        let json = await fs.readJSON('.openmined/grid/experiments.json');
        return json ?
            json[key] ?
                json[key].uuid :
                void 0 :
            void 0;
    }
    async configuration(model, lr, criterion, iters) {
        return new GridConfiguration(model, lr, criterion, iters);
    }
    async learn(input, target, configurations, name) {
        let configurations_json = configurations.map(item => JSON.stringify(item));
        this.jobId = lib_1.assertType(await controller.sendJSON({
            objectType: 'Grid',
            functionCall: 'learn',
            tensorIndexParams: [input.id, target.id],
            configurations: configurations_json
        }, 'string'), 'string');
        this.store_job(this.jobId, name);
    }
    async check_experiment_status(experiments, status_widgets) {
        for (let i = 0; i < experiments.length; i++) {
            let experiment = experiments[i];
            let widget = status_widgets[i];
            widget.value = await controller.sendJSON({
                objectType: 'Grid',
                functionCall: 'checkStatus',
                experimentId: experiment.jobId,
                tensorIndexParams: []
            }, 'none');
        }
    }
    async store_job(jobId, name) {
        if (!name) {
            name = `Experiment on ${new Date}`;
        }
        let json;
        try {
            await fs.mkdirp('.openmined/grid');
            json = await fs.readJSON('.openmined/grid/experiments.json');
        }
        finally { }
        if (json == null) {
            json = [];
        }
        json.unshift({
            name,
            jobId,
            uuid: uuid.v4()
        });
        await fs.writeJSON('.openmined/grid/experiments.json', json);
    }
    async get_results(experiment) {
        let json;
        try {
            json = await fs.readJSON('.openmined/grid/experiments.json');
        }
        catch (error) {
            throw new Error('There are no saved experiments and you have not submitted a job.');
        }
        let usedJob;
        if (experiment != null) {
            for (let __experiment of json) {
                if (experiment === __experiment['uuid']) {
                    usedJob = __experiment['jobId'];
                }
            }
        }
        if (usedJob == null && experiment != null) {
            throw new Error(`No experiments matching '${experiment}'`);
        }
        if (usedJob == null && this.jobId != null) {
            usedJob = this.jobId;
        }
        if (usedJob == null) {
            throw new Error('There are no saved experiments and you have not submitted a job.');
        }
        let results = lib_1.assertType(await controller.sendJSON({
            objectType: 'Grid',
            functionCall: 'getResults',
            experimentId: usedJob,
            tensorIndexParams: []
        }, 'string'), 'string');
        let modelIds = JSON.parse(results);
        let res = await Async.map(modelIds, async (id) => syft.Model.getModel(id));
        return new ExperimentResults(res);
    }
}
exports.Grid = Grid;
class ExperimentResults {
    constructor(models) {
        this.results = [];
        this.results = models;
    }
}
exports.ExperimentResults = ExperimentResults;
class GridConfiguration {
    constructor(model, lr, criterion, iters, name) {
        this.model = model;
        this.lr = lr;
        this.criterion = criterion;
        this.iters = iters;
    }
    toJSON() {
        return {
            model: this.model.id,
            lr: this.lr,
            criterion: this.criterion,
            iters: this.iters
        };
    }
}
exports.GridConfiguration = GridConfiguration;
//# sourceMappingURL=grid.js.map