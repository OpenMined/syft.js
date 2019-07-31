/*
  TODO: There are currently two known issues with simplifiers:
  - The "shape" property inside of PointerTensor insists on being converted to a list, but this isn't done in PySyft
  - PySyft seems to have some way of deciding between square brackets ("[]") and parentheses ("()"), it's unclear which we should use and when

  TODO: There is one known bug in how PySyft is coercing string values:
  - Currently, PySyft is inserting "b" before a string and occasionally "," after a string because of how MsgPack is serializing data
  - Neither of these characters are necessary, and hopefully at some point we can remove these extraneous details
  - Upon fixing this in the SIMPLIFIERS array, we will also need to fix this in the REPLACERS array
*/

// Import our types
import Range from './custom-types/range';
import Slice from './custom-types/slice';
import Tuple from 'immutable-tuple';
import TorchTensor from './custom-types/torch-tensor';
import Plan from './custom-types/plan';
import PointerTensor from './custom-types/pointer-tensor';

// Import our helpers
import { getArgs } from './_helpers';

// Import our errors
import { NO_SIMPLIFIER, NO_DETAILER } from './_errors';

// These are the replace functions we will run to convert Javascript to Python
const SIMPLIFY_REPLACERS = [
  [/null/g, 'None'], // Convert all nulls to Nones
  [/false/g, 'False'], // Convert all false to False
  [/true/g, 'True'] // Convert all true to True
];

// These are the replace functions we will run to convert Python to Javascript
const DETAIL_REPLACERS = [
  [/\(/g, '['], // Convert all Python tuples into a Javascript Array
  [/\)/g, ']'],
  [/b'/g, "'"], // Convert all undefined 'b' functions everywhere, remove them
  [/'/g, '"'], // Convert all single quotes to double quotes
  [/None/g, null], // Convert all Nones to nulls
  [/False/g, false], // Convert all False to false
  [/True/g, true], // Convert all True to true
  [/,]/g, ']'] // Trim all Arrays with an extra comma
];

// A simple function to run the above replacers
const runReplacers = (data, replacers) => {
  for (let i = 0; i < replacers.length; i++) {
    data = data.replace(...replacers[i]);
  }

  return data;
};

// To simplify, we must take a Javascript object and turn it into a serialized Python string that can be interpreted by PySyft
// This involves the following steps in order:
// 1. Recursively parse the data
// 2. Depending on the data type, we may run it through a simplifier function to convert that value into a string
// 3. Run the replacers, which will convert any Javascript values into Python (null, false, true, etc.)
export const simplify = data => {
  const SIMPLIFIERS = [
    d =>
      `(0, [${Array.from(d)
        .map(([key, value]) => `(${parse(key)}, ${parse(value)})`)
        .join()}])`, // 0 = dict
    d => `(1, [${d.map(i => parse(i)).join()}])`, // 1 = list
    d => `(2, (${d.start}, ${d.end}, ${d.step}))`, // 2 = range
    d => `(3, [${[...d].map(i => parse(i)).join()}])`, // 3 = set
    d => `(4, (${d.start}, ${d.end}, ${d.step}))`, // 4 = slice
    d => `(5, (b'${d}',))`, // 5 = str
    d => `(6, [${d.map(i => parse(i)).join()}])`, // 6 = tuple
    null, // 7
    null, // 8
    null, // 9
    null, // 10
    null, // 11
    d =>
      `(12, (${getArgs(TorchTensor)
        .map(i => parse(d[i]))
        .join()}))`, // 12 = torch-tensor
    null, // 13
    null, // 14
    null, // 15
    null, // 16
    d => {
      const args = getArgs(Plan),
        operations = d[args[0]].map(i => parse(i)),
        rest = args.slice(1).map(i => parse(d[i]));

      return `(17, ((${operations}), ${rest.join()}))`;
    }, // 17 = plan
    d =>
      `(18, (${getArgs(PointerTensor)
        .map(i => parse(d[i]))
        .join()}))` // 18 = pointer-tensor
  ];

  const parse = d => {
    if (d === null) return 'null';

    let simplifierId = null;

    if (d instanceof Map) simplifierId = 0;
    else if (d instanceof Array) simplifierId = 1;
    else if (d instanceof Range) simplifierId = 2;
    else if (d instanceof Set) simplifierId = 3;
    else if (d instanceof Slice) simplifierId = 4;
    else if (typeof d === 'string') simplifierId = 5;
    else if (d instanceof Tuple) simplifierId = 6;
    else if (d instanceof TorchTensor) simplifierId = 12;
    else if (d instanceof Plan) simplifierId = 17;
    else if (d instanceof PointerTensor) simplifierId = 18;

    if (simplifierId !== null) {
      const simplifier = SIMPLIFIERS[simplifierId];

      if (simplifier) {
        return simplifier(d);
      }

      throw new Error(NO_SIMPLIFIER(simplifierId, d));
    }

    return d;
  };

  return runReplacers(parse(data), SIMPLIFY_REPLACERS);
};

// To detail, we must take a Python string serialized in PySyft and turn it into a Javascript object that we can manipulate and store
// This involves the following steps in order:
// 1. Run the replacers, which will convert any Python values into Javascript (() => [], None, True, False, etc.)
// 2. Parse the string as JSON
// 3. Recursively parse the data
// 4. Depending on the data type, we may run it through a detailer function to convert that value into the appropriate JAvascript type
export const detail = data => {
  const DETAILERS = [
    d => new Map(d.map(i => i.map(j => parse(j)))), // 0 = dict
    d => d.map(i => parse(i)), // 1 = list
    d => new Range(...d), // 2 = range
    d => new Set(d.map(i => parse(i))), // 3 = set
    d => new Slice(...d), // 4 = slice
    d => d[0], // 5 = str
    d => Tuple(...d.map(i => parse(i))), // 6 = tuple
    null, // 7
    null, // 8
    null, // 9
    null, // 10
    null, // 11
    d => new TorchTensor(...d.map(i => parse(i))), // 12 = torch-tensor
    null, // 13
    null, // 14
    null, // 15
    null, // 16
    d => new Plan(d[0].map(j => parse(j)), ...d.slice(1).map(i => parse(i))), // 17 = plan
    d => new PointerTensor(...d.map(i => parse(i))) // 18 = pointer-tensor
  ];

  const parse = d => {
    if (
      Array.isArray(d) &&
      d.length === 2 &&
      typeof d[0] === 'number' &&
      Array.isArray(d[1])
    ) {
      const detailer = DETAILERS[d[0]];

      if (detailer) {
        return detailer(d[1]);
      }

      throw new Error(NO_DETAILER(d));
    }

    return d;
  };

  return parse(JSON.parse(runReplacers(data, DETAIL_REPLACERS)));
};
