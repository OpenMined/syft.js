import EventObserver from './events';
import Logger from './logger';
import GridAPIClient from './grid-api-client';
import Job from './job';
import ObjectRegistry from './object-registry';

/**
 * Syft client for model-centric federated learning.
 *
 * @param {Object} options
 * @param {string} options.url - Full URL to PyGrid app (`ws` and `http` schemas supported).
 * @param {boolean} options.verbose - Whether to enable logging and allow unsecured PyGrid connection.
 * @param {string} options.authToken - PyGrid authentication token.
 * @param {Object} options.peerConfig - [not implemented] WebRTC peer config used with RTCPeerConnection.
 *
 * @example
 *
 * const client = new Syft({url: "ws://localhost:5000", verbose: true})
 * const job = client.newJob({modelName: "mnist", modelVersion: "1.0.0"})
 * job.on('accepted', async ({model, clientConfig}) => {
 *   // Execute training
 *   const [...newParams] = await this.plans['...'].execute(...)
 *   const diff = await model.createSerializedDiff(newParams)
 *   await this.report(diff)
 * })
 * job.on('rejected', ({timeout}) => {
 *   // Retry later or stop
 * })
 * job.on('error', (err) => {
 *   // Handle errors
 * })
 * job.start()
 */
export default class Syft {
  constructor({ url, verbose, authToken, peerConfig }) {
    // Create verbose logging if verbose value is true
    this.logger = new Logger('syft.js', verbose);

    // Force connection to be secure if verbose value is false
    this.verbose = verbose;
    this.gridClient = new GridAPIClient({ url, allowInsecureUrl: verbose });

    // Create objects registry
    this.objects = new ObjectRegistry();

    // Create event listeners
    this.observer = new EventObserver();

    this.worker_id = null;
    this.requires_speed_test = false;
    this.peerConfig = peerConfig;
    this.authToken = authToken;
  }

  /**
   * Authenticates the client against PyGrid and instantiates new Job with given options.
   *
   * @throws Error if grid client authentication failed.
   * @param {Object} options
   * @param {string} options.modelName - FL Model name.
   * @param {string} options.modelVersion - FL Model version.
   * @returns {Promise<Job>}
   */
  async newJob({ modelName, modelVersion }) {
    if (!this.worker_id) {
      // Authenticate the client
      const authResponse = await this.gridClient.authenticate(
        modelName,
        modelVersion,
        this.authToken
      );
      this.worker_id = authResponse.worker_id;
      // True if PyGrid requested to meter the speed
      this.requires_speed_test = authResponse.requires_speed_test || false;
    }

    return new Job({
      worker: this,
      modelName,
      modelVersion,
      gridClient: this.gridClient,
    });
  }
}
