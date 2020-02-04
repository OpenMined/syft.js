import { default as proto } from '../proto';
import { getPbId } from '../protobuf';

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

  static unbufferize(worker, pb) {
    const planAssignments = [];
    if (pb.plan_assignments) {
      pb.plan_assignments.forEach(item => {
        planAssignments.push([getPbId(item.worker_id), getPbId(item.plan_id)]);
      });
    }
    return new Protocol(
      getPbId(pb.id),
      pb.tags,
      pb.description,
      planAssignments,
      pb.workers_resolved
    );
  }
}
