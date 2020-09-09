import { protobuf, getPbId, pbId } from '../protobuf';

/**
 * PlaceholderId identifies which Placeholder tensors should be used as
 * inputs and outputs of Actions inside a Plan.
 *
 * @property {string} id - Unbufferized, unique id for a Placeholder object.
 */
export class PlaceholderId {
  constructor(id) {
    this.id = id;
  }

  /**
   * Reconstructs a PlaceholderId object from the protobuf message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.types.syft.v1.Id} pb - Protobuf object for Id.
   * @returns {PlaceholderId}
   */
  static unbufferize(worker, pb) {
    return new PlaceholderId(getPbId(pb.id));
  }

  /**
   * Save the Id string into a protobuf PlaceholderId message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @returns {protobuf.syft_proto.execution.v1.PlaceholderId}
   */
  bufferize(/* worker */) {
    return protobuf.syft_proto.execution.v1.PlaceholderId.create({
      id: pbId(this.id),
    });
  }
}

/**
 * Placeholder acts as a tensor. It is replaced by actual tensors after actions
 * are acted on it and can be used to trace the actions from a Plan. A Placeholder
 * has a PlaceholderId that uniquely identifies itself.
 *
 * @property {string} id - Unbufferized Id object.
 */
export class Placeholder {
  constructor(id, tags = [], description = null, expected_shape = null) {
    this.id = id;
    this.tags = tags;
    this.description = description;
    this.expected_shape = expected_shape;
  }

  /**
   * Reconstructs a Placeholder object from the protobuf message.
   * Note that this method might take a worker-specific argument in the future.
   *
   * @static
   * @param {*} worker - Reserved placeholder for worker-specific arguments.
   * @param {protobuf.syft_proto.execution.v1.Placeholder} pb - Protobuf object for Placeholder.
   * @returns {Placeholder}
   */
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

  /**
   * Bufferizes the Placeholder object to a protobuf Placeholder object.
   * Note that this method should take a worker-specific argument in the future.
   *
   * @returns {protobuf.syft_proto.execution.v1.Placeholder}
   */
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
}
