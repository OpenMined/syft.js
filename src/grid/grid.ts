import * as uuid from 'uuid'
import * as Async from 'promasync'

import * as syft from '..'
import * as controller from '../controller'
import { assertType } from '../lib'

import * as fs from 'fs-extra'

export class Grid {
  jobId?: string


  async get(
    key: string
  ) {
    let json = await fs.readJSON('.openmined/grid/experiments.json')

    return json ?
      json[key] ?
      json[key].uuid :
      void 0 :
      void 0
  }

  // TODO: arg types???
  async configuration(
    model: any,
    lr: any,
    criterion: any,
    iters: any
  ) {
    return new GridConfiguration(model, lr, criterion, iters)
  }

  // TODO: arg types???
  async learn(
    input: any,
    target: any,
    configurations: any[],
    name?: any
  ) {
    let configurations_json = configurations.map(item => JSON.stringify(item))

    this.jobId = assertType(
      await controller.sendJSON({
        objectType: 'Grid',
        functionCall: 'learn',
        tensorIndexParams: [input.id, target.id],
        configurations: configurations_json
      }, 'string'),
      'string'
    )

    this.store_job(this.jobId as string, name)
  }

  // TODO: arg types????
  async check_experiment_status(
    experiments: any[],
    status_widgets: any[]
  ) {
    for (let i = 0; i < experiments.length; i++) {
      let experiment = experiments[i]
      let widget = status_widgets[i]

      widget.value = await controller.sendJSON({
        objectType: 'Grid',
        functionCall: 'checkStatus',
        experimentId: experiment.jobId,
        tensorIndexParams: []
      }, 'none')
    }
  }

  // TODO: figure this out
  // async get_experiments() {
  //   let json = await fs.readJSON('.openmined/grid/experiments.json')
  //
  //   let names: any[] = []
  //   let uuids: any[] = []
  //   let status: any[] = []
  //
  //   for (let experiment of json) {
  //     names.push(widget.Label(experiment['name']))
  //     uuids.push(widget.Label(experiment['uuid']))
  //     status.push(widget.Label('Checking...'))
  //   }
  //
  //   let names_column = widget.VBox(names)
  //   let uuid_column = widget.VBox(uuids)
  //   let status_column = widget.VBox(status)
  //
  //   let check_status_thread = threading.Thread(target=this.check_experiment_status, args=(d, status))
  //   check_status_thread.start()
  //
  //   let box = widget.HBox([names_column, uuid_column, status_column])
  //   box.border = '10'
  //   return box
  // }

  async store_job(
    jobId: string,
    name?: string
  ) {
    if (!name) {
      name = `Experiment on ${new Date}`
    }

    let json: any[]

    try {
      await fs.mkdirp('.openmined/grid')
      json = await fs.readJSON('.openmined/grid/experiments.json')
    } finally {}

    if (json == null) {
      json = []
    }

    json.unshift({
      name,
      jobId,
      uuid: uuid.v4()
    })

    await fs.writeJSON('.openmined/grid/experiments.json', json)
  }

  async get_results(
    experiment?: any
  ) {
    let json
    try {
      json = await fs.readJSON('.openmined/grid/experiments.json')
    } catch (error) {
      throw new Error('There are no saved experiments and you have not submitted a job.')
    }

    let usedJob
    if (experiment != null) {
      for (let __experiment of json) {
        if (experiment === __experiment['uuid']) {
          usedJob = __experiment['jobId']
        }
      }
    }

    if (usedJob == null && experiment != null){
      throw new Error (`No experiments matching '${experiment}'`)
    }
    if (usedJob == null && this.jobId != null){
      usedJob = this.jobId
    }
    if (usedJob == null){
      throw new Error ('There are no saved experiments and you have not submitted a job.')
    }
    let results = assertType(
      await controller.sendJSON({
        objectType: 'Grid',
        functionCall: 'getResults',
        experimentId: usedJob,
        tensorIndexParams: []
      }, 'string'),
      'string'
    )


    let modelIds = JSON.parse(results) as string[]
    let res = await Async.map(modelIds, async id => syft.Model.getModel(id))
    return new ExperimentResults(res)
  }

}

export class ExperimentResults {
  results: any[] = []
  constructor(
    models: any[]
  ) {
    this.results = models
  }
}

export class GridConfiguration {
  model: any
  lr: any
  criterion: any
  iters: any
  name?: any

  constructor(
    model: any,
    lr: any,
    criterion: any,
    iters: any,
    name?: any
  ) {
    this.model = model
    this.lr = lr
    this.criterion = criterion
    this.iters = iters
  }

  toJSON() {
    return {
      model: this.model.id,
      lr: this.lr,
      criterion: this.criterion,
      iters: this.iters
    }
  }
}
