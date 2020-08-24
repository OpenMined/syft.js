import { getPbId } from '../protobuf';

export default class Protocol {
  constructor(id, tags, description, planAssigments, workersResolved) {
    this.id = id;
    this.tags = tags;
    this.description = description;
    this.plans = planAssigments;
    this.workersResolved = workersResolved;
  }

  static unbufferize(worker, pb) {
    const planAssignments = [];
    if (pb.plan_assignments) {
      pb.plan_assignments.forEach((item) => {
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
