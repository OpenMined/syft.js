import { getPbId } from '../protobuf';

export default class Placeholder {
  constructor(id, tags = [], description = null) {
    this.id = id;
    this.tags = tags;
    this.description = description;
  }

  static unbufferize(worker, pb) {
    return new Placeholder(getPbId(pb.id), pb.tags || [], pb.description);
  }

  getOrderFromTags(prefix) {
    const regExp = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    for (let tag of this.tags) {
      let tagMatch = regExp[Symbol.match](tag);
      if (tagMatch) {
        return Number(tagMatch[1]);
      }
    }
    throw new Error(`Placeholder ${this.id} doesn't have order tag ${prefix}`);
  }
}
