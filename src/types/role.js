import { getPbId, unbufferize } from '../protobuf';
import ObjectRegistry from '../object-registry';
import { NOT_ENOUGH_ARGS } from '../_errors';

/**
 * Role encapsulates a list of ComputationActions that are executed in a Plan.
 *
 * Concretely, a worker is assigned a Role, which includes actions that the
 * worker should perform.
 */
export class Role {
  /**
   * @param {string} id - Id of the Role.
   * @param {Array.<ComputationAction>} [actions=[]] - Array of actions to be executed.
   * @param {State} [state=null]
   * @param {Object.<string,Placeholder>} [placeholders={}] - Array of Placeholders that contain tensors.
   * @param {Array.<PlaceholderId>} [input_placeholder_ids=[]] - Array of PlaceholderIds for input values.
   * @param {Array.<PlaceholderId>} [output_placeholder_ids=[]] - Array of PlaceholderIds for output values.
   * @param {Array.<string>} [tags=[]] - Tags for Role.
   * @param {string|null} [description=null] Description for Role.
   */
  constructor(
    id,
    actions = [],
    state = null,
    placeholders = {},
    input_placeholder_ids = [],
    output_placeholder_ids = [],
    tags = [],
    description = null
  ) {
    this.id = id;
    this.actions = actions;
    this.state = state;
    this.placeholders = placeholders;
    this.input_placeholder_ids = input_placeholder_ids;
    this.output_placeholder_ids = output_placeholder_ids;
    this.tags = tags;
    this.description = description;
  }

  /**
   * Reconstructs a Role object from the protobuf message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.Role} pb - Protobuf object for Role.
   * @returns {Role}
   */
  static unbufferize(worker, pb) {
    let placeholdersArray = unbufferize(worker, pb.placeholders);
    let placeholders = {};
    for (let ph of placeholdersArray) {
      placeholders[ph.id] = ph;
    }

    return new Role(
      getPbId(pb.id),
      unbufferize(worker, pb.actions),
      unbufferize(worker, pb.state),
      placeholders,
      pb.input_placeholder_ids.map(getPbId),
      pb.output_placeholder_ids.map(getPbId),
      pb.tags,
      pb.description
    );
  }

  /**
   * @returns {Array.<Placeholder>} - Input Placeholders
   */
  getInputPlaceholders() {
    return this.input_placeholder_ids.map((id) => this.placeholders[id]);
  }

  /**
   * @returns {Array.<Placeholder>} - Output Placeholders
   */
  getOutputPlaceholders() {
    return this.output_placeholder_ids.map((id) => this.placeholders[id]);
  }

  /**
   * Executes the actions in the Role with a given worker.
   * @param {Syft} worker
   * @param {...(tf.Tensor)} data
   * @returns {Promise<Array>}
   */
  async execute(worker, ...data) {
    // Create local scope
    const planScope = new ObjectRegistry();
    planScope.load(worker.objects);

    const inputPlaceholders = this.getInputPlaceholders(),
      outputPlaceholders = this.getOutputPlaceholders(),
      argsLength = inputPlaceholders.length;

    // If the number of arguments supplied does not match the number of arguments required
    if (data.length !== argsLength)
      throw new Error(NOT_ENOUGH_ARGS(data.length, argsLength));

    // Add each argument to local scope
    data.forEach((datum, i) => {
      planScope.set(inputPlaceholders[i].id, datum);
    });

    // Load state tensors to worker
    if (this.state && this.state.tensors) {
      this.state.placeholders.forEach((ph, idx) => {
        planScope.set(ph.id, this.state.tensors[idx]);
      });
    }

    // Execute the plan
    for (const action of this.actions) {
      // The result of the current operation
      const result = await action.execute(planScope);

      // Place the result of the current operation into this.objects at the 0th item in returnIds
      // All intermediate tensors will be garbage collected by default
      if (result) {
        if (action.returnIds.length > 0) {
          planScope.set(action.returnIds[0], result, true);
        } else if (action.returnPlaceholderIds.length > 0) {
          planScope.set(action.returnPlaceholderIds[0].id, result, true);
        }
      }
    }

    // Resolve all of the requested resultId's as specified by the Plan
    const resolvedResultingTensors = [];
    outputPlaceholders.forEach((placeholder) => {
      resolvedResultingTensors.push(planScope.get(placeholder.id));
      // Do not gc output tensors
      planScope.setGc(placeholder.id, false);
    });

    // Clean up intermediate plan variables.
    planScope.clear();

    // Return resolved tensors to the worker
    return resolvedResultingTensors;
  }
}
