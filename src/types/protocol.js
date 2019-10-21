import { default as proto } from '../proto';

export default class Protocol {
  constructor(id, tags, description, plans, workersResolved) {
    this.id = id;
    this.tags = tags;
    this.description = description;
    this.plans = plans;
    this.workersResolved = workersResolved;
  }

  serdeSimplify(f) {
    const TYPE = proto['syft.messaging.protocol.Protocol'];
    const args = ['id', 'tags', 'description', 'plans', 'workersResolved']; // prettier-ignore
    return `(${TYPE}, (${args.map(i => f(this[i])).join()}))`; // prettier-ignore
  }
}
