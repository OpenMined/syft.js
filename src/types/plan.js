import { getPbId, unbufferize } from '../protobuf';
import { NOT_ENOUGH_ARGS } from '../_errors';

export class Plan {
  constructor(
    id,
    name,
    operations = [],
    state = null,
    placeholders = [],
    tags = [],
    description = null
  ) {
    this.id = id;
    this.name = name;
    this.operations = operations;
    this.state = state;
    this.placeholders = placeholders;
    this.tags = tags;
    this.description = description;
  }

  static unbufferize(worker, pb) {
    const id = getPbId(pb.id);
    if (!pb.is_built) {
      throw new Error(`Plan #${id} is not built`);
    }

    return new Plan(
      id,
      pb.name,
      unbufferize(worker, pb.operations),
      unbufferize(worker, pb.state),
      unbufferize(worker, pb.placeholders),
      pb.tags,
      pb.description
    );
  }

  findPlaceholders(tagRegex) {
    return this.placeholders.filter(
      placeholder =>
        placeholder.tags && placeholder.tags.some(tag => tagRegex.test(tag))
    );
  }

  getInputPlaceholders() {
    return this.findPlaceholders(/^#input/).sort(
      (a, b) => a.getOrderFromTags('#input') - b.getOrderFromTags('#input')
    );
  }

  getOutputPlaceholders() {
    return this.findPlaceholders(/^#output/).sort(
      (a, b) => a.getOrderFromTags('#output') - b.getOrderFromTags('#output')
    );
  }

  /**
   * Execute the plan with given worker
   * @param {Syft} worker
   * @param data
   * @returns {Promise<Array>}
   */
  async execute(worker, ...data) {
    const inputPlaceholders = this.getInputPlaceholders(),
      argsLength = inputPlaceholders.length;

    // If the number of arguments supplied does not match the number of arguments required...
    if (data.length !== argsLength)
      throw new Error(NOT_ENOUGH_ARGS(data.length, argsLength));

    // For each argument supplied, store them in worker's objects
    data.forEach((datum, i) => {
      worker.objects.set(inputPlaceholders[i].id, datum);
    });

    // load state tensors to worker
    if (this.state && this.state.tensors) {
      this.state.tensors.forEach(tensor => {
        worker.objects.set(tensor.id, tensor);
      });
    }

    // Execute the plan
    for (const currentOp of this.operations) {
      // The result of the current operation
      //console.log(currentOp);
      const result = await currentOp.execute(worker);

      // Place the result of the current operation into this.objects at the 0th item in returnIds
      if (result) {
        if (currentOp.returnIds.length > 0) {
          worker.objects.set(currentOp.returnIds[0], result);
        } else if (currentOp.returnPlaceholders.length > 0) {
          worker.objects.set(currentOp.returnPlaceholders[0].id, result);
        }
      }
    }

    // Resolve all of the requested resultId's as specific by the plan
    const resolvedResultingTensors = [];
    const outputPlaceholders = this.getOutputPlaceholders();
    outputPlaceholders.forEach(placeholder => {
      resolvedResultingTensors.push(worker.objects.get(placeholder.id));
    });

    // Return them to the worker
    return resolvedResultingTensors;
  }
}

export class State {
  constructor(placeholders = null, tensors = null) {
    this.placeholders = placeholders;
    this.tensors = tensors;
  }

  getTfTensors() {
    return this.tensors.map(t => t._tfTensor);
  }

  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map(stateTensor => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }
}
