import { unserialize, getPbId } from '../src/protobuf';
import { protobuf } from '../src/proto';
import { ObjectMessage } from '../src/types/message';
import Protocol from '../src/types/protocol';
import { fromNumber } from 'long';

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
      'CgcIzuzNqtECKhQKBwi91JDfnQISCRIHd29ya2VyMQ==',
      protobuf.syft_proto.messaging.v1.Protocol
    );
    expect(protocol).toBeInstanceOf(Protocol);
  });

  test('gets id from types.syft.Id', () => {
    const protocolWithIntId = protobuf.syft_proto.messaging.v1.Protocol.fromObject(
      {
        id: {
          id_int: 123
        }
      }
    );
    const protocolWithStrId = protobuf.syft_proto.messaging.v1.Protocol.fromObject(
      {
        id: {
          id_str: '321'
        }
      }
    );
    expect(fromNumber(123).eq(getPbId(protocolWithIntId.id))).toBe(true);
    expect(getPbId(protocolWithStrId.id)).toBe('321');
  });
});
