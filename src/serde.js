import { default as proto } from './proto';

// Import our types
import { Dict, List, Range, Slice, Tuple } from './types/native';
import { TorchTensor, TorchSize } from './types/torch';
import { Plan, Procedure, State } from './types/plan';
import Protocol from './types/protocol';
import PointerTensor from './types/pointer-tensor';
import {
  Message,
  Operation,
  ObjectMessage,
  ObjectRequestMessage,
  IsNoneMessage,
  GetShapeMessage,
  ForceObjectDeleteMessage,
  SearchMessage,
  PlanCommandMessage
} from './types/message';

// Import our errors
import { NO_DETAILER } from './_errors';

// These are the replace functions we will run to convert Javascript to Python
export const SIMPLIFY_REPLACERS = [
  [/null/g, 'None'], // Convert all nulls to Nones
  [/false/g, 'False'], // Convert all false to False
  [/true/g, 'True'] // Convert all true to True
];

// These are the replace functions we will run to convert Python to Javascript
export const DETAIL_REPLACERS = [
  [/\(/g, '['], // Convert all Python tuples into a Javascript Array
  [/\)/g, ']'],
  [/b'(.*?)'/g, "'$1'"], // Convert all undefined 'b' functions everywhere, remove them
  [/'/g, '"'], // Convert all single quotes to double quotes so JSON can parse correctly
  [/None/g, null], // Convert all Nones to nulls
  [/False/g, false], // Convert all False to false
  [/True/g, true], // Convert all True to true
  [/,]/g, ']'] // Trim all Arrays with an extra comma
];

// A simple function to run the above replacers
export const runReplacers = (data, replacers) => {
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
  const parse = d => {
    if (d === null) return 'null';

    if (d.serdeSimplify && typeof d.serdeSimplify === 'function') {
      return d.serdeSimplify(parse);
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
  // prettier-ignore
  const DETAILERS = {
    [proto['dict']]: d => new Dict(d.map(i => i.map(j => parse(j)))),
    [proto['list']]: d => new List(...d.map(i => parse(i))),
    [proto['range']]: d => new Range(...d),
    [proto['set']]: d => new Set(d.map(i => parse(i))),
    [proto['slice']]: d => new Slice(...d),
    [proto['str']]: d => d[0],
    [proto['tuple']]: d => new Tuple(...d.map(i => parse(i))),
    [proto['torch.Tensor']]: d => new TorchTensor(...d.map(i => parse(i))),
    [proto['torch.Size']]: d => new TorchSize(d),
    [proto['syft.messaging.plan.plan.Plan']]: d => new Plan(...d.map(i => parse(i))),
    [proto['syft.messaging.plan.state.State']]: d => new State(...d.map(i => parse(i))),
    [proto['syft.messaging.plan.procedure.Procedure']]: d => new Procedure(d[0].map(i => parse(i)), ...d.slice(1).map(i => parse(i))),
    [proto['syft.messaging.protocol.Protocol']]: d => new Protocol(...d.map(i => parse(i))),
    [proto['syft.generic.pointers.pointer_tensor.PointerTensor']]: d => new PointerTensor(...d.map(i => parse(i))),
    [proto['syft.messaging.message.Message']]: d => new Message(...d.map(i => parse(i))),
    [proto['syft.messaging.message.Operation']]: d => new Operation(...d.map(i => parse(i))),
    [proto['syft.messaging.message.ObjectMessage']]: d => new ObjectMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.ObjectRequestMessage']]: d => new ObjectRequestMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.IsNoneMessage']]: d => new IsNoneMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.GetShapeMessage']]: d => new GetShapeMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.ForceObjectDeleteMessage']]: d => new ForceObjectDeleteMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.SearchMessage']]: d => new SearchMessage(...d.map(i => parse(i))),
    [proto['syft.messaging.message.PlanCommandMessage']]: d => new PlanCommandMessage(...d.map(i => parse(i)))
  };

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
