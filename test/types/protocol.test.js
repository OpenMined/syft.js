import {
  id,
  tags,
  description,
  plans,
  workersResolved,
  detailedProtocol
} from '../dummy/protocol';

describe('Protocol', () => {
  test('can be properly constructed', () => {
    expect(detailedProtocol.id).toStrictEqual(id);
    expect(detailedProtocol.tags).toStrictEqual(tags);
    expect(detailedProtocol.description).toStrictEqual(description);
    expect(detailedProtocol.plans).toStrictEqual(plans);
    expect(detailedProtocol.workersResolved).toStrictEqual(workersResolved);
  });
});
