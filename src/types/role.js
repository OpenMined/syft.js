import { getPbId, unbufferize } from '../protobuf';
import ObjectRegistry from '../object-registry';
import { NOT_ENOUGH_ARGS } from '../_errors';

export class Role {
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

  findPlaceholders(tagRegex) {
    return this.placeholders.filter(
      (placeholder) =>
        placeholder.tags && placeholder.tags.some((tag) => tagRegex.test(tag))
    );
  }

  getInputPlaceholders() {
    return this.input_placeholder_ids.map((id) => this.placeholders[id]);
  }

  getOutputPlaceholders() {
    return this.output_placeholder_ids.map((id) => this.placeholders[id]);
  }

  /**
   * Execute the Role with given worker
   * @param {Syft} worker
   * @param data
   * @returns {Promise<Array>}
   */
  async execute(worker, ...data) {
    // Create local scope.
    const planScope = new ObjectRegistry();
    planScope.load(worker.objects);

    const inputPlaceholders = this.getInputPlaceholders(),
      outputPlaceholders = this.getOutputPlaceholders(),
      argsLength = inputPlaceholders.length;

    // If the number of arguments supplied does not match the number of arguments required...
    if (data.length !== argsLength)
      throw new Error(NOT_ENOUGH_ARGS(data.length, argsLength));

    // For each argument supplied, add them in scope
    data.forEach((datum, i) => {
      planScope.set(inputPlaceholders[i].id, datum);
    });

    // load state tensors to worker
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

    // Resolve all of the requested resultId's as specific by the plan
    const resolvedResultingTensors = [];
    outputPlaceholders.forEach((placeholder) => {
      resolvedResultingTensors.push(planScope.get(placeholder.id));
      // Do not gc output tensors
      planScope.setGc(placeholder.id, false);
    });

    // Cleanup intermediate plan variables.
    planScope.clear();

    // Return them to the worker
    return resolvedResultingTensors;
  }
}
