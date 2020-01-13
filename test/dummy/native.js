import { default as proto } from '../../src/proto';
import { Dict, List, Range, Slice, Tuple } from '../../src/types/native';

// ----- DICT ----- //
export const dict = new Dict([
  [1, 'hello'],
  ['key2', 999]
]);
export const simplifiedDict = `(${proto['dict']}, ((${proto['list']}, (${proto['str']}, (b'hello',))), ((${proto['str']}, (b'key2',)), 999)))`; // prettier-ignore

// ----- LIST ----- //
export const list = new List('apple', 'cherry', 'banana');
export const simplifiedList = `(${proto['list']}, ((${proto['str']}, (b'apple',)), (${proto['str']}, (b'cherry',)), (${proto['str']}, (b'banana',))))`; // prettier-ignore

// ----- RANGE ----- //
export const start = 0;
export const end = 10;
export const step = 1;

export const range = new Range(start, end, step);
export const simplifiedRange = `(${proto['range']}, (${start}, ${end}, ${step}))`; // prettier-ignore

// ----- SET ----- //
// NOTE: Sets are unordered in Python, so we had to rearrange the order in the simplifiedSet string below
export const set = new Set(['apple', 'cherry', 'banana']);
export const simplifiedSet = `(${proto['set']}, ((${proto['str']}, (b'apple',)), (${proto['str']}, (b'cherry',)), (${proto['str']}, (b'banana',))))`; // prettier-ignore

// ----- SLICE ----- //
export const slice = new Slice(start, end, step);
export const nullStepSlice = new Slice(start, end);
export const simplifiedSlice = `(${proto['slice']}, (${start}, ${end}, ${step}))`; // prettier-ignore

// ----- STRING ----- //
export const string = 'hello';
export const simplifiedString = `(${proto['str']}, (b'hello',))`; // prettier-ignore

// ----- TUPLE ----- //
export const tuple = new Tuple('apple', 'cherry', 'banana');
export const simplifiedTuple = `(${proto['tuple']}, ((${proto['str']}, (b'apple',)), (${proto['str']}, (b'cherry',)), (${proto['str']}, (b'banana',))))`; // prettier-ignore
