import { getPbId, unbufferize } from '../protobuf';

export class Plan {
  constructor(
    id,
    name,
    role = [],
    tags = [],
    description = null
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
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
      unbufferize(worker, pb.role),
      pb.tags,
      pb.description
    );
  }

  async execute(worker, ...data) {
    return this.role.execute(worker, ...data);
  }
}
