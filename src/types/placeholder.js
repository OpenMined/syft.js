import { protobuf, getPbId, pbId } from '../protobuf';

/**
 * PlaceholderId identifies which Placeholder tensors should be used as
 * inputs and outputs of Actions inside a Plan.
 *
 * @property {string} id
 */
export class PlaceholderId {
  constructor(id) {
    this.id = id;
  }

  /**
   * Unbufferizes a protobuf object to a new PlaceholderId object.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments when messaging with PySyft.
   * @param {protobuf.syft_proto.types.syft.v1.Id} pb - Protobuf object.
   * @returns {PlaceholderId}
   */
  static unbufferize(worker, pb) {
    return new PlaceholderId(getPbId(pb.id));
  }

  /**
   * Bufferizes the Id string to a protobuf PlaceholderId object.
   * Note that this method should take a worker-specific argument in the future.
   *
   * @returns {protobuf.syft_proto.execution.v1.PlaceholderId}
   */
  bufferize(/* worker */) {
    return protobuf.syft_proto.execution.v1.PlaceholderId.create({
      id: pbId(this.id),
    });
  }
}

export class Placeholder {
  constructor(id, tags = [], description = null, expected_shape = null) {
    this.id = id;
    this.tags = tags;
    this.description = description;
    this.expected_shape = expected_shape;
  }

  static unbufferize(worker, pb) {
    let expected_shape = null;
    if (
      pb.expected_shape &&
      Array.isArray(pb.expected_shape.dims) &&
      pb.expected_shape.dims.length > 0
    ) {
      // Unwrap Shape
      expected_shape = pb.expected_shape.dims;
    }

    return new Placeholder(
      getPbId(pb.id),
      pb.tags || [],
      pb.description,
      expected_shape
    );
  }

  bufferize(/* worker */) {
    return protobuf.syft_proto.execution.v1.Placeholder.create({
      id: pbId(this.id),
      tags: this.tags,
      description: this.description,
      expected_shape: protobuf.syft_proto.types.syft.v1.Shape.create(
        this.expected_shape
      ),
    });
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
