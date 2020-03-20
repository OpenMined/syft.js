import { getPbId, protobuf, unbufferize } from '../protobuf';
import { NOT_ENOUGH_ARGS } from '../_errors';
import ObjectRegistry from '../object-registry';

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
    // Create local scope.
    const planScope = new ObjectRegistry();
    planScope.load(worker.objects);

    const
      inputPlaceholders = this.getInputPlaceholders(),
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
      this.state.tensors.forEach(tensor => {
        planScope.set(tensor.id, tensor);
      });
    }

    // Execute the plan
    for (const currentOp of this.operations) {
      // The result of the current operation
      const result = await currentOp.execute(planScope);

      // Place the result of the current operation into this.objects at the 0th item in returnIds
      // All intermediate tensors will be garbage collected by default
      if (result) {
        if (currentOp.returnIds.length > 0) {
          planScope.set(currentOp.returnIds[0], result, true);
        } else if (currentOp.returnPlaceholders.length > 0) {
          planScope.set(currentOp.returnPlaceholders[0].id, result, true);
        }
      }
    }

    // Resolve all of the requested resultId's as specific by the plan
    const resolvedResultingTensors = [];
    outputPlaceholders.forEach(placeholder => {
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

export class State {
  constructor(placeholders = null, tensors = null) {
    this.placeholders = placeholders;
    this.tensors = tensors;
  }

  getTfTensors() {
    return this.tensors.map(t => t.toTfTensor());
  }

  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map(stateTensor => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }

  bufferize(worker) {
    const tensorsPb = this.tensors.map(tensor =>
      protobuf.syft_proto.execution.v1.StateTensor.create({
        torch_tensor: tensor.bufferize(worker)
      })
    );
    const placeholdersPb = this.placeholders.map(ph => ph.bufferize());
    return protobuf.syft_proto.execution.v1.State.create({
      placeholders: placeholdersPb,
      tensors: tensorsPb
    });
  }
}
