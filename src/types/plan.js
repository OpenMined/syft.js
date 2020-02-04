import { default as proto } from '../proto';
import { getPbId, unbufferize } from '../protobuf';

export class Plan {
  constructor(
    id = null,
    operations = [],
    state = null,
    includeState = false,
    isBuilt = false,
    name = null,
    tags = [],
    description = null,
    placeholders = []
  ) {
    this.id = id;
    this.operations = operations;
    this.state = state;
    this.includeState = includeState;
    this.isBuilt = isBuilt;
    this.name = name;
    this.tags = tags;
    this.description = description;
    this.placeholders = placeholders;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.plan.plan.Plan'];
    const args = ['id', 'procedure', 'state', 'includeState', 'isBuilt', 'inputShape', 'outputShape', 'name', 'tags', 'description']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }

  static unbufferize(worker, pb) {
    return new Plan(
      getPbId(pb.id),
      unbufferize(worker, pb.operations),
      unbufferize(worker, pb.state),
      pb.include_state,
      pb.is_built,
      pb.name,
      pb.tags,
      pb.description,
      unbufferize(worker, pb.placeholders)
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

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.plan.state.State'];
    const args = ['placeholders', 'tensors']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }

  static unbufferize(worker, pb) {
    const tensors = pb.tensors.map(stateTensor => {
      // unwrap StateTensor
      return unbufferize(worker, stateTensor[stateTensor.tensor]);
    });

    return new State(unbufferize(worker, pb.placeholders), tensors);
  }
}
