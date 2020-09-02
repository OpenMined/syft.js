import { getPbId, unbufferize } from '../protobuf';

/**
 * Plan stores a sequence of actions (ComputationAction) in its role.
 * A worker is assigned plans and executes the actions stored in the plans.
 */
export class Plan {
  /**
   * @hideconstructor
   * @param {string} id - Id of the Plan.
   * @param {string} name - Name of the Plan.
   * @param {Array.<Role>} [role=[]] Array of Roles.
   * @param {Array.<string>} [tags=[]] - Tags for Plan.
   * @param {string|null} [description=null] Description for Plan.
   */
  constructor(id, name, role = [], tags = [], description = null) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.tags = tags;
    this.description = description;
  }

  /**
   * Reconstructs a Plan object from the protobuf message.
   * Note that this method take a worker-specific argument in the future.
   * @private
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.Plan} pb - Protobuf object for Role.
   * @returns {Plan}
   */
  static unbufferize(worker, pb) {
    const id = getPbId(pb.id);

    return new Plan(
      id,
      pb.name,
      unbufferize(worker, pb.role),
      pb.tags,
      pb.description
    );
  }

  /**
   * Executes the Plan and returns its output.
   *
   * The order, type and number of arguments must match to arguments defined in the PySyft Plan.
   *
   * @param {Syft} worker
   * @param {...(tf.Tensor|number)} data
   * @returns {Promise<Array.<tf.Tensor>>}
   */
  async execute(worker, ...data) {
    return this.role.execute(worker, ...data);
  }
}
