import { protobuf, unserialize, getPbId } from '../src/protobuf';
import { ObjectMessage } from '../src/types/message';
import Protocol from '../src/types/protocol';
import { Plan, State } from '../src/types/plan';
import { PLAN, MODEL, PROTOCOL } from './data/dummy';

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
    const plan = unserialize(
      null,
      MODEL,
      protobuf.syft_proto.execution.v1.State
    );
    expect(plan).toBeInstanceOf(State);
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
