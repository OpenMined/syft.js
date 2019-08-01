import { slice, nullStepSlice, start, end, step } from '../dummy/slice';

describe('Slice', () => {
  test('can be properly constructed', () => {
    expect(slice.start).toStrictEqual(start);
    expect(slice.end).toStrictEqual(end);
    expect(slice.step).toStrictEqual(step);
  });

  test('can be properly constructed with no step', () => {
    expect(nullStepSlice.start).toStrictEqual(start);
    expect(nullStepSlice.end).toStrictEqual(end);
    expect(nullStepSlice.step).toStrictEqual(null);
  });
});
