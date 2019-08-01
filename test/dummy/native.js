import Tuple from 'immutable-tuple';

// Python Dictionary = Javascript Map()
export const dict = new Map([[1, 'hello'], ['key2', 999]]);
export const simplifiedDict = `(0, ((1, (5, (b'hello',))), ((5, (b'key2',)), 999)))`; // Generated from PySyft based on above

// Python List = Javascript Array
export const list = ['apple', 'cherry', 'banana'];
export const simplifiedList = `(1, ((5, (b'apple',)), (5, (b'cherry',)), (5, (b'banana',))))`; // Generated from PySyft based on above

// Python Set = Javascript Set()
export const set = new Set(['apple', 'cherry', 'banana']);

// NOTE: Sets are unordered in Python, so we had to rearrange the order in the simplifiedSet string below
export const simplifiedSet = `(3, ((5, (b'apple',)), (5, (b'cherry',)), (5, (b'banana',))))`; // Generated from PySyft based on above

// Python String = Javascript String
export const string = 'hello';
export const simplifiedString = `(5, (b'hello',))`; // Generated from PySyft based on above

// Python Tuple = Javascript Tuple (via "immutable-tuple" package)
export const tuple = Tuple('apple', 'cherry', 'banana');
export const simplifiedTuple = `(6, ((5, (b'apple',)), (5, (b'cherry',)), (5, (b'banana',))))`; // Generated from PySyft based on above
