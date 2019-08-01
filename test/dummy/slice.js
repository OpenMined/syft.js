import Slice from '../../src/custom-types/slice';

export const start = 0;
export const end = 10;
export const step = 1;

export const slice = new Slice(start, end, step);
export const nullStepSlice = new Slice(start, end);

export const simplifiedSlice = `(4, (${start}, ${end}, ${step}))`;
