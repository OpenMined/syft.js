import Range from '../../src/custom-types/range';

export const start = 0;
export const end = 10;
export const step = 1;

export const range = new Range(start, end, step);

export const simplifiedRange = `(2, (${start}, ${end}, ${step}))`;
