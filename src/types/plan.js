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

/**
 * Object that describes Plan input.
 *
 * @param type {string} Input argument type
 * @param name {string} Optional argument name
 * @param index {number} Optional argument index (to take from array)
 * @param value {*} Argument value
 */
export class PlanInputSpec {
  static TYPE_DATA = 'data';
  static TYPE_TARGET = 'target';
  static TYPE_BATCH_SIZE = 'batchSize';
  static TYPE_VALUE = 'value';
  static TYPE_MODEL_PARAM = 'modelParam';

  constructor(type, name = null, index = null, value = null) {
    this.type = type;
    this.name = name;
    this.index = index;
    this.value = value;
  }

  /**
   * Creates list of Plan arguments according to specified `specs`.
   *
   * @param specs {[PlanInputSpec]} Plan arguments specifications
   * @param data {Object} Dictionary containing Plan arguments
   * @returns {[]}
   */
  static resolve(specs, data) {
    const args = [];
    for (const spec of specs) {
      if (spec.type === this.TYPE_VALUE) {
        args.push(spec.value);
      } else if (spec.index !== null) {
        args.push(data[spec.type][spec.index]);
      } else {
        args.push(data[spec.type]);
      }
    }
    return args;
  }
}

/**
 * Object that describes Plan output.
 *
 * @param type {string} Output variable type
 * @param name {string} Optional name
 * @param index {number} Optional index (to put into array)
 */
export class PlanOutputSpec {
  static TYPE_LOSS = 'loss';
  static TYPE_METRIC = 'metric';
  static TYPE_MODEL_PARAM = 'modelParam';

  constructor(type, name = null, index = null) {
    this.type = type;
    this.name = name;
    this.index = index;
  }

  /**
   * Creates dictionary of Plan output values according to `specs`.
   *
   * @param specs {[PlanOutputSpec]} Specifications of Plan output variables
   * @param data {[*]} Plan output (array)
   * @returns {Object}
   */
  static resolve(specs, data) {
    const out = {};
    let i = 0;
    for (const spec of specs) {
      if (spec.index !== null) {
        if (typeof out[spec.type] === 'undefined') {
          out[spec.type] = [];
        }
        out[spec.type][spec.index] = data[i];
      } else if (spec.name !== null) {
        if (typeof out[spec.type] === 'undefined') {
          out[spec.type] = {};
        }
        out[spec.type][spec.name] = data[i];
      } else {
        out[spec.type] = data[i];
      }
      i++;
    }
    return out;
  }
}
