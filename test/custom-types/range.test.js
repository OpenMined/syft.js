import { range, start, end, step } from '../dummy/range';

describe('Range', () => {
  test('can be properly constructed', () => {
    expect(range.start).toStrictEqual(start);
    expect(range.end).toStrictEqual(end);
    expect(range.step).toStrictEqual(step);
  });
});
