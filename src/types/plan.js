import { getPbId, unbufferize } from '../protobuf';

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
}

export class State {
  constructor(placeholders = null, tensors = null) {
    this.placeholders = placeholders;
    this.tensors = tensors;
  }

  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map(stateTensor => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }
}
