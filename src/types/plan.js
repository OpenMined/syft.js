import { getPbId, unbufferize } from '../protobuf';

/**
 * PySyft Plan.
 */
export class Plan {
  /**
   * @hideconstructor
   */
  constructor(id, name, role = [], tags = [], description = null) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.tags = tags;
    this.description = description;
  }

  /**
   * @private
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
