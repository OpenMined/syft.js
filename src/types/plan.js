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
 * Parameters known to `PlanTrainer`
 * (like training data, model parameters, batch size, etc.)
 * are mapped into Plan arguments according to this object.
 *
 * @param {string} type - Input argument type.
 * @param {string} [name] - Optional argument name.
 * @param {number} [index] - Optional argument index (to take from array).
 * @param {*} [value] - Argument value.
 */
export class PlanInputSpec {
  /**
   * Represents training data (substituted with PlanTrainer's `data` batch)
   * @constant
   */
  static TYPE_DATA = 'data';

  /**
   * Represents training targets aka labels (substituted with PlanTrainer's `target` batch)
   * @constant
   */
  static TYPE_TARGET = 'target';

  /**
   * Represents batch size (substituted with PlanTrainer's `batchSize`).
   * @constant
   */
  static TYPE_BATCH_SIZE = 'batchSize';

  /**
   * Represents parameter from client config configured in FL model, `name` argument is required (substituted with parameter from PlanTrainer's `clientConfig`).
   * @constant
   */
  static TYPE_CLIENT_CONFIG_PARAM = 'clientConfigParam';

  /**
   * Represents any value, `value` argument is required.
   * @constant
   */
  static TYPE_VALUE = 'value';

  /**
   * Represents model parameter (substituted with `SyftModel` contents).
   * @constant
   */
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
   * @private
   * @param {[PlanInputSpec]} specs - Plan arguments specifications.
   * @param {Object} data - Dictionary containing Plan arguments.
   * @returns {[]}
   */
  static resolve(specs, data) {
    const args = [];
    for (const spec of specs) {
      if (spec.type === this.TYPE_VALUE) {
        args.push(spec.value);
      } else if (spec.index !== null) {
        args.push(data[spec.type][spec.index]);
      } else if (spec.name !== null) {
        args.push(data[spec.type][spec.name]);
      } else if (spec.type === this.TYPE_CLIENT_CONFIG_PARAM) {
        args.push(data[spec.type][spec.name]);
      } else {
        args.push(data[spec.type]);
      }
    }
    return args;
  }
}

/**
 * Object that describes Plan output.
 * Values returned from Plan
 * (like loss, accuracy, model parameters, etc.)
 * are mapped into `PlanTrainer`'s internal state according to this object.
 *
 * @param {string} type - Output variable type.
 * @param {string} [name] - Optional name.
 * @param {number} [index] - Optional index (to put into array).
 */
export class PlanOutputSpec {
  /**
   * Represents loss value (maps to PlanTrainer's loss).
   * @constant
   */
  static TYPE_LOSS = 'loss';
  /**
   * Represents metric value, name is required (maps to PlanTrainer's metrics dictionary).
   * @constant
   */
  static TYPE_METRIC = 'metric';
  /**
   * Represents model parameter (maps to `SyftModel` parameters)
   * @constant
   */
  static TYPE_MODEL_PARAM = 'modelParam';

  constructor(type, name = null, index = null) {
    this.type = type;
    this.name = name;
    this.index = index;
  }

  /**
   * Creates dictionary of Plan output values according to `specs`.
   *
   * @private
   * @param {[PlanOutputSpec]} specs - Specifications of Plan output variables.
   * @param {[*]} data - Plan output.
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
