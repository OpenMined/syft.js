import { getPbId } from '../protobuf';

/**
 * Protocol stores a squence of actions. A Protocol's sequence of actions can
 * be sent to remote workers while the Protocol keeps a reference to the actions.
 * This way, to operate on remote input, only a single message with references
 * of the Protocol as well as the pointers is required for a worker to perform
 * the actions.
 *
 * Protocol contains a mix of ComputationActions and CommunicationActions.
 * Therefore, Protocol can act as a cross-worker and is different from Plan, which
 * contains pure mathematical operations.
 *
 * Note: Protocol is currently not used in syft.js.
 */
export default class Protocol {
  /**
   * @param {number} id - Id of the PointerTensor.
   * @param {Array.<string>} tags - Tags for Protocol.
   * @param {string} description - Description for Protocol.
   * @param {Array.<Plan>} planAssigments - Array of Plans that Protocol should execute.
   * @param {*} workersResolved
   */
  constructor(id, tags, description, planAssigments, workersResolved) {
    this.id = id;
    this.tags = tags;
    this.description = description;
    this.plans = planAssigments;
    this.workersResolved = workersResolved;
  }

  /**
   * Reconstructs a Protocol object from the protobuf message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.Protocol} pb - Protobuf object for Protocol.
   * @returns {Protocol}
   */
  static unbufferize(worker, pb) {
    const planAssignments = [];
    if (pb.plan_assignments) {
      pb.plan_assignments.forEach((item) => {
        planAssignments.push([getPbId(item.worker_id), getPbId(item.plan_id)]);
      });
    }
    return new Protocol(
      getPbId(pb.id),
      pb.tags,
      pb.description,
      planAssignments,
      pb.workers_resolved
    );
  }
}
