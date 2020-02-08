import Protocol from '../../src/types/protocol';

describe('Protocol', () => {
  test('can be properly constructed', () => {
    const planAssignments = [
      ['worker1', '1234'],
      ['worker2', '3456']
    ];
    const obj = new Protocol(
      123,
      ['tag1', 'tag2'],
      'desc',
      planAssignments,
      true
    );
    expect(obj.id).toStrictEqual(123);
    expect(obj.tags).toStrictEqual(['tag1', 'tag2']);
    expect(obj.description).toStrictEqual('desc');
    expect(obj.plans).toStrictEqual(planAssignments);
    expect(obj.workersResolved).toStrictEqual(true);
  });
});
