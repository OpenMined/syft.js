import {
  detailedPlan,
  operations,
  id,
  args,
  results,
  name,
  tags,
  description,
  isBuilt
} from '../dummy/plan';

describe('Plan', () => {
  test('can be properly constructed', () => {
    expect(detailedPlan.operations).toStrictEqual(operations);
    expect(detailedPlan.id).toStrictEqual(id);
    expect(detailedPlan.args).toStrictEqual(args);
    expect(detailedPlan.results).toStrictEqual(results);
    expect(detailedPlan.name).toStrictEqual(name);
    expect(detailedPlan.tags).toStrictEqual(tags);
    expect(detailedPlan.description).toStrictEqual(description);
    expect(detailedPlan.isBuilt).toStrictEqual(isBuilt);
  });
});
