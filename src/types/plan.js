import { default as proto } from '../proto';

export class Plan {
  constructor(
    id,
    procedure,
    state,
    includeState,
    isBuilt,
    inputShape,
    outputShape,
    name,
    tags,
    description
  ) {
    this.id = id;
    this.procedure = procedure;
    this.state = state;
    this.includeState = includeState;
    this.isBuilt = isBuilt;
    this.inputShape = inputShape;
    this.outputShape = outputShape;
    this.name = name;
    this.tags = tags;
    this.description = description;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.plan.plan.Plan'];
    const args = ['id', 'procedure', 'state', 'includeState', 'isBuilt', 'inputShape', 'outputShape', 'name', 'tags', 'description']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}

export class Procedure {
  constructor(operations, argIds, resultIds, promiseOutId) {
    this.operations = operations;
    this.argIds = argIds;
    this.resultIds = resultIds;
    this.promiseOutId = promiseOutId;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.plan.procedure.Procedure'];
    const args = ['operations', 'argIds', 'resultIds', 'promiseOutId']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}

export class State {
  constructor(stateIds, tensors) {
    this.stateIds = stateIds;
    this.tensors = tensors;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.plan.state.State'];
    const args = ['stateIds', 'tensors']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}
