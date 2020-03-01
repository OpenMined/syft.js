import { protobuf, unserialize, getPbId } from '../src/protobuf';
import { ObjectMessage } from '../src/types/message';
import Protocol from '../src/types/protocol';
import { Plan } from '../src/types/plan';

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
      'CgcI5Ii/nbYBKhQKBwi3ucnu3gESCRIHd29ya2VyMSoUCgcI6cyxl/IBEgkSB3dvcmtlcjIqFAoHCP/QmdOjAhIJEgd3b3JrZXIz',
      protobuf.syft_proto.execution.v1.Protocol
    );
    expect(protocol).toBeInstanceOf(Protocol);
  });

  test('can unserialize a Plan', () => {
    const plan = unserialize(
      null,
      'CgcIt7nJ7t4BEkkKB19fYWRkX18aFwoHCPbiu97nARICIzISCCNpbnB1dC0wKhdKFQoHCLurk5KoARICIzESBiNzdGF0ZUIMCgYIzcymkA4SAiMzEjQKCXRvcmNoLmFicyoOSgwKBgjNzKaQDhICIzNCFwoGCMnx1YZ6EgIjNBIJI291dHB1dC0wGkEKFQoHCLurk5KoARICIzESBiNzdGF0ZRIoCiYKBwi7q5OSqAESGQoDCgECEgdmbG9hdDMysgEIZmaGQJqZ6UBABCABKAEyB2JvYlBsYW5KFQoHCLurk5KoARICIzESBiNzdGF0ZUoXCgcI9uK73ucBEgIjMhIII2lucHV0LTBKDAoGCM3MppAOEgIjM0oXCgYIyfHVhnoSAiM0Egkjb3V0cHV0LTA=',
      protobuf.syft_proto.execution.v1.Plan
    );
    expect(plan).toBeInstanceOf(Plan);
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
