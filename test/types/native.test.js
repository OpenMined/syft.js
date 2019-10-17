import { range, slice, nullStepSlice, start, end, step } from '../dummy/native';

// NOTE: We would test the "Dict" implementation here, but since it's a copy of a JS primitive, there's no need to test

// NOTE: We would test the "List" implementation here, but since it's a copy of a JS primitive, there's no need to test

describe('Range', () => {
  test('can be properly constructed', () => {
    expect(range.start).toStrictEqual(start);
    expect(range.end).toStrictEqual(end);
    expect(range.step).toStrictEqual(step);
  });
});

// NOTE: We would test the "Set" implementation here, but since it's a copy of a JS primitive, there's no need to test

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

// NOTE: We would test the "String" implementation here, but since it's a copy of a JS primitive, there's no need to test

// NOTE: We would test the "Tuple" implementation here, but since it's a copy a tested, external library, there's no need to test
