import EventObserver from './events';
import Job from './job';
import SyftModel from './syft_model';
import Logger from './logger';

export default class SyftWorker {
  constructor({ id, gridClient, logger }) {
    this.id = id;
    // models registry
    this.models = new Map();
    this.grid = gridClient;
    this.logger = logger || new Logger('SyftWorker', true);
    this.observer = new EventObserver();
  }

  static create({ gridClient, logger }) {
    return gridClient.authenticate().then(response => {
      return new SyftWorker({
        id: response.worker_id,
        gridClient,
        logger
      });
    });
  }

  newJob({ modelId, modelVersion }) {
    return new Job({
      worker: this,
      modelId,
      modelVersion,
      gridClient: this.grid,
      logger: this.logger
    });
  }

  /**
   * Load the model into worker's models registry
   * @param requestKey
   * @param modelId
   * @returns {Promise<SyftModel>}
   */
  loadModel({ requestKey, modelId }) {
    return this.grid.getModel(this.id, requestKey, modelId).then(data => {
      const model = new SyftModel({ worker: this, data });
      this.models.set(modelId, model);
      return model;
    });
  }

  getConnectionInfo() {
    // TODO
    return Promise.resolve({
      ping: '8ms',
      download: '46.3mbps',
      upload: '23.7mbps'
    });
  }
}
