import EventObserver from './events';
import Logger from './logger';
import GridAPIClient from './grid-api-client';
import Job from './job';
import ObjectRegistry from './object-registry';

/**
 * Syft client for static federated learning.
 *
 * @param {Object} options
 * @param {string} options.url Full URL to PyGrid app (`ws` and `http` schemas supported).
 * @param {boolean} options.verbose Whether to enable logging and allow unsecured PyGrid connection.
 * @param {string} options.authToken PyGrid authentication token.
 * @param {Object} options.peerConfig [not implemented] WebRTC peer config used with RTCPeerConnection.
 *
 * @example
 *
 * const client = new Syft({url: "ws://localhost:5000", verbose: true})
 * const job = client.newJob({modelName: "mnist", modelVersion: "1.0.0"})
 * job.on('accepted', async ({model, clientConfig}) => {
 *   // execute training
 *   const [...newParams] = await this.plans['...'].execute(...)
 *   const diff = await model.createSerializedDiff(newParams)
 *   await this.report(diff)
 * })
 * job.on('rejected', ({timeout}) => {
 *   // re-try later or stop
 * })
 * job.on('error', (err) => {
 *   // handle errors
 * })
 * job.start()
 */
export default class Syft {
  constructor({ url, verbose, authToken, peerConfig }) {
    // For creating verbose logging should the worker desire
    this.logger = new Logger('syft.js', verbose);

    // Forcing connection to be secure if verbose value is false.
    this.verbose = verbose;

    this.gridClient = new GridAPIClient({ url, allowInsecureUrl: verbose });

    // objects registry
    this.objects = new ObjectRegistry();

    // For creating event listeners
    this.observer = new EventObserver();

    this.worker_id = null;
    this.peerConfig = peerConfig;
    this.authToken = authToken;
  }

  /**
   * Authenticates the client against PyGrid and instantiates new Job with given options.
   *
   * @throws Error
   * @param {Object} options
   * @param {string} options.modelName FL Model name.
   * @param {string} options.modelVersion FL Model version.
   * @returns {Promise<Job>}
   */
  async newJob({ modelName, modelVersion }) {
    if (!this.worker_id) {
      // authenticate
      const authResponse = await this.gridClient.authenticate(this.authToken);
      this.worker_id = authResponse.worker_id;
    }

    return new Job({
      worker: this,
      modelName,
      modelVersion,
      gridClient: this.gridClient
    });
  }
}
