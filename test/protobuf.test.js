import { protobuf, unserialize, getPbId, serialize } from '../src/protobuf';
import { ObjectMessage } from '../src/types/message';
import Protocol from '../src/types/protocol';
import { Plan, State } from '../src/types/plan';
import { PLAN, MODEL, PROTOCOL } from './data/dummy';
import { TorchTensor } from '../src/types/torch';
import * as tf from '@tensorflow/tfjs-core';
import Placeholder from '../src/types/placeholder';

describe('Protobuf', () => {
  test('can unserialize an ObjectMessage', () => {
    const obj = unserialize(
      null,
      'CjcKBwi91JDfnQISKgoECgICAxIHZmxvYXQzMrIBGAAAgD8AAABAAABAQAAAgEAAAKBAMzPDQEAE',
      protobuf.syft_proto.messaging.v1.ObjectMessage
    );
    expect(obj).toBeInstanceOf(ObjectMessage);
  });

  test('can unserialize a Protocol', () => {
    const protocol = unserialize(
      null,
      PROTOCOL,
      protobuf.syft_proto.execution.v1.Protocol
    );
    expect(protocol).toBeInstanceOf(Protocol);
  });

  test('can unserialize a Plan', () => {
    const plan = unserialize(null, PLAN, protobuf.syft_proto.execution.v1.Plan);
    expect(plan).toBeInstanceOf(Plan);
  });

  test('can unserialize a State', () => {
    const state = unserialize(
      null,
      MODEL,
      protobuf.syft_proto.execution.v1.State
    );
    expect(state).toBeInstanceOf(State);
  });

  test('can serialize a State', async () => {
    const placeholders = [
      new Placeholder('123', ['tag1', 'tag2'], 'placeholder')
    ];
    const tensors = [
      await TorchTensor.fromTfTensor(
        tf.tensor([
          [1.1, 2.2],
          [3.3, 4.4]
        ])
      )
    ];
    const state = new State(placeholders, tensors);
    const serialized = serialize(null, state);

    // unserialize back to check
    const unserState = unserialize(
      null,
      serialized,
      protobuf.syft_proto.execution.v1.State
    );
    expect(unserState).toBeInstanceOf(State);
    expect(unserState.id).toStrictEqual(state.id);
    expect(unserState.placeholders).toStrictEqual(placeholders);
    expect(
      tf
        .equal(unserState.tensors[0].toTfTensor(), tensors[0].toTfTensor())
        .all()
        .dataSync()[0]
    ).toBe(1);
  });

  test('can serialize TorchTensor', async () => {
    const tensor = tf.tensor([
      [1.1, 2.2],
      [3.3, 4.4]
    ]);
    const torchTensor = await TorchTensor.fromTfTensor(tensor);
    torchTensor.tags = ['tag1', 'tag2'];
    torchTensor.description = 'description of tensor';

    // serialize
    const bin = serialize(null, torchTensor);
    expect(bin).toBeInstanceOf(ArrayBuffer);

    // check unserialized matches to original
    const unserTorchTensor = unserialize(
      null,
      bin,
      protobuf.syft_proto.types.torch.v1.TorchTensor
    );
    expect(unserTorchTensor.shape).toStrictEqual(torchTensor.shape);
    expect(unserTorchTensor.dtype).toStrictEqual(torchTensor.dtype);
    expect(unserTorchTensor.contents).toStrictEqual(torchTensor.contents);
    // resulting TF tensors are equal
    expect(
      tf
        .equal(unserTorchTensor.toTfTensor(), tensor)
        .all()
        .dataSync()[0]
    ).toBe(1);
    expect(unserTorchTensor.tags).toStrictEqual(torchTensor.tags);
    expect(unserTorchTensor.description).toStrictEqual(torchTensor.description);
  });

  test('can serialize TorchTensor', async () => {
    const tensor = tf.tensor([
      [1.1, 2.2],
      [3.3, 4.4]
    ]);
    const torchTensor = await TorchTensor.fromTfTensor(tensor);
    torchTensor.tags = ['tag1', 'tag2'];
    torchTensor.description = 'description of tensor';

    // serialize
    const bin = serialize(null, torchTensor);
    expect(bin).toBeInstanceOf(ArrayBuffer);

    // check unserialized matches to original
    const unserTorchTensor = unserialize(
      null,
      bin,
      protobuf.syft_proto.types.torch.v1.TorchTensor
    );
    expect(unserTorchTensor.shape).toStrictEqual(torchTensor.shape);
    expect(unserTorchTensor.dtype).toStrictEqual(torchTensor.dtype);
    expect(unserTorchTensor.contents).toStrictEqual(torchTensor.contents);
    // resulting TF tensors are equal
    expect(
      tf
        .equal(unserTorchTensor.toTfTensor(), tensor)
        .all()
        .dataSync()[0]
    ).toBe(1);
    expect(unserTorchTensor.tags).toStrictEqual(torchTensor.tags);
    expect(unserTorchTensor.description).toStrictEqual(torchTensor.description);
  });

  test('gets id from types.syft.Id', () => {
    const protocolWithIntId = protobuf.syft_proto.execution.v1.Protocol.fromObject(
      {
        id: {
          id_int: 123
        }
      }
    );
    const protocolWithStrId = protobuf.syft_proto.execution.v1.Protocol.fromObject(
      {
        id: {
          id_str: '321'
        }
      }
    );
    expect(getPbId(protocolWithIntId.id)).toBe('123');
    expect(getPbId(protocolWithStrId.id)).toBe('321');
  });
});
