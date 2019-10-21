import { simplify, detail } from '../src/serde';
import {
  simplifiedDict,
  dict,
  simplifiedList,
  list,
  simplifiedRange,
  range,
  simplifiedSet,
  set,
  simplifiedSlice,
  slice,
  simplifiedString,
  string,
  simplifiedTuple,
  tuple
} from './dummy/native';
import {
  simplifiedTorchTensor,
  torchTensor,
  simplifiedTorchSize,
  torchSize2
} from './dummy/torch';
import {
  simplifiedPlan,
  detailedPlan,
  simplifiedState,
  detailedState,
  simplifiedProcedure,
  detailedProcedure
} from './dummy/plan';
import { simplifiedProtocol, detailedProtocol } from './dummy/protocol';
import {
  simplifiedPointerTensor,
  firstPointerTensor
} from './dummy/pointer-tensor';
import {
  simplifiedMessage,
  detailedMessage,
  simplifiedOperation,
  detailedOperation,
  simplifiedObjectMessage,
  detailedObjectMessage,
  simplifiedObjectRequestMessage,
  detailedObjectRequestMessage,
  simplifiedIsNoneMessage,
  detailedIsNoneMessage,
  simplifiedGetShapeMessage,
  detailedGetShapeMessage,
  simplifiedForceObjectDeleteMessage,
  detailedForceObjectDeleteMessage,
  simplifiedSearchMessage,
  detailedSearchMessage,
  simplifiedPlanCommandMessage,
  detailedPlanCommandMessage
} from './dummy/message';

// NOTE: There's a few things we need to get PySyft and syft.js on equal footing.
// Python appears to add extraneous commas to the end of a lot of different Python objects, we should remove these from tests since they aren't syntactically significant
// Likewise, let's trim all white space so that we can ensure there are no issues related to indention or spacing as that is also syntatically insignificant
const EQUALIZERS = [
  [/\s/g, ''], // Remove all extra spaces
  [/,\)/g, ')'] // Remove all extra commas
];

const runEqualizers = data => {
  for (let i = 0; i < EQUALIZERS.length; i++) {
    data = data.replace(...EQUALIZERS[i]);
  }

  return data;
};

describe('Serde', () => {
  test('can simplify a Dict', () => {
    const equalizedPresetDict = runEqualizers(simplifiedDict);
    const equalizedSimplifiedDict = runEqualizers(simplify(dict));

    expect(equalizedPresetDict).toBe(equalizedSimplifiedDict);
  });

  test('can detail a Dict', () => {
    const computedDetailedDict = detail(simplifiedDict);

    expect(dict).toStrictEqual(computedDetailedDict);
  });

  test('can simplify a List', () => {
    const equalizedPresetList = runEqualizers(simplifiedList);
    const equalizedSimplifiedList = runEqualizers(simplify(list));

    expect(equalizedPresetList).toBe(equalizedSimplifiedList);
  });

  test('can detail a List', () => {
    const computedDetailedList = detail(simplifiedList);

    expect(list).toStrictEqual(computedDetailedList);
  });

  test('can simplify a Range', () => {
    const equalizedPresetRange = runEqualizers(simplifiedRange);
    const equalizedSimplifiedRange = runEqualizers(simplify(range));

    expect(equalizedPresetRange).toBe(equalizedSimplifiedRange);
  });

  test('can detail a Range', () => {
    const computedDetailedRange = detail(simplifiedRange);

    expect(range).toStrictEqual(computedDetailedRange);
  });

  test('can simplify a Set', () => {
    const equalizedPresetSet = runEqualizers(simplifiedSet);
    const equalizedSimplifiedSet = runEqualizers(simplify(set));

    expect(equalizedPresetSet).toBe(equalizedSimplifiedSet);
  });

  test('can detail a Set', () => {
    const computedDetailedSet = detail(simplifiedSet);

    expect(set).toStrictEqual(computedDetailedSet);
  });

  test('can simplify a Slice', () => {
    const equalizedPresetSlice = runEqualizers(simplifiedSlice);
    const equalizedSimplifiedSlice = runEqualizers(simplify(slice));

    expect(equalizedPresetSlice).toBe(equalizedSimplifiedSlice);
  });

  test('can detail a Slice', () => {
    const computedDetailedSlice = detail(simplifiedSlice);

    expect(slice).toStrictEqual(computedDetailedSlice);
  });

  test('can simplify a String', () => {
    const equalizedPresetString = runEqualizers(simplifiedString);
    const equalizedSimplifiedString = runEqualizers(simplify(string));

    expect(equalizedPresetString).toBe(equalizedSimplifiedString);
  });

  test('can detail a String', () => {
    const computedDetailedString = detail(simplifiedString);

    expect(string).toStrictEqual(computedDetailedString);
  });

  test('can simplify a Tuple', () => {
    const equalizedPresetTuple = runEqualizers(simplifiedTuple);
    const equalizedSimplifiedTuple = runEqualizers(simplify(tuple));

    expect(equalizedPresetTuple).toBe(equalizedSimplifiedTuple);
  });

  test('can detail a Tuple', () => {
    const computedDetailedTuple = detail(simplifiedTuple);

    expect(tuple).toStrictEqual(computedDetailedTuple);
  });

  test('can simplify a TorchTensor', () => {
    const equalizedPresetTorchTensor = runEqualizers(simplifiedTorchTensor);
    const equalizedSimplifiedTorchTensor = runEqualizers(simplify(torchTensor));

    expect(equalizedPresetTorchTensor).toBe(equalizedSimplifiedTorchTensor);
  });

  test('can detail a TorchTensor', () => {
    const computedDetailedTorchTensor = detail(simplifiedTorchTensor);

    expect(torchTensor).toStrictEqual(computedDetailedTorchTensor);
  });

  test('can simplify a TorchSize', () => {
    const equalizedPresetTorchSize = runEqualizers(simplifiedTorchSize);
    const equalizedSimplifiedTorchSize = runEqualizers(simplify(torchSize2));

    expect(equalizedPresetTorchSize).toBe(equalizedSimplifiedTorchSize);
  });

  test('can detail a TorchSize', () => {
    const computedDetailedTorchSize = detail(simplifiedTorchSize);

    expect(torchSize2).toStrictEqual(computedDetailedTorchSize);
  });

  test('can simplify a Plan', () => {
    const equalizedPresetPlan = runEqualizers(simplifiedPlan);
    const equalizedSimplifiedPlan = runEqualizers(simplify(detailedPlan));

    expect(equalizedPresetPlan).toBe(equalizedSimplifiedPlan);
  });

  test('can detail a Plan', () => {
    const computedDetailedPlan = detail(simplifiedPlan);

    expect(detailedPlan).toStrictEqual(computedDetailedPlan);
  });

  test('can simplify a State', () => {
    const equalizedPresetState = runEqualizers(simplifiedState);
    const equalizedSimplifiedState = runEqualizers(simplify(detailedState));

    expect(equalizedPresetState).toBe(equalizedSimplifiedState);
  });

  test('can detail a State', () => {
    const computedDetailedState = detail(simplifiedState);

    expect(detailedState).toStrictEqual(computedDetailedState);
  });

  test('can simplify a Procedure', () => {
    const equalizedPresetProcedure = runEqualizers(simplifiedProcedure);
    const equalizedSimplifiedProcedure = runEqualizers(
      simplify(detailedProcedure)
    );

    expect(equalizedPresetProcedure).toBe(equalizedSimplifiedProcedure);
  });

  test('can detail a Procedure', () => {
    const computedDetailedProcedure = detail(simplifiedProcedure);

    expect(detailedProcedure).toStrictEqual(computedDetailedProcedure);
  });

  test('can simplify a Protocol', () => {
    const equalizedPresetProtocol = runEqualizers(simplifiedProtocol);
    const equalizedSimplifiedProtocol = runEqualizers(
      simplify(detailedProtocol)
    );

    expect(equalizedPresetProtocol).toBe(equalizedSimplifiedProtocol);
  });

  test('can detail a Protocol', () => {
    const computedDetailedProtocol = detail(simplifiedProtocol);

    expect(detailedProtocol).toStrictEqual(computedDetailedProtocol);
  });

  test('can simplify a PointerTensor', () => {
    const equalizedPresetPointerTensor = runEqualizers(simplifiedPointerTensor);
    const equalizedSimplifiedPointerTensor = runEqualizers(
      simplify(firstPointerTensor)
    );

    expect(equalizedPresetPointerTensor).toBe(equalizedSimplifiedPointerTensor);
  });

  test('can detail a PointerTensor', () => {
    const computedDetailedPointerTensor = detail(simplifiedPointerTensor);

    expect(firstPointerTensor).toStrictEqual(computedDetailedPointerTensor);
  });

  test('can simplify a Message', () => {
    const equalizedPresetMessage = runEqualizers(simplifiedMessage);
    const equalizedSimplifiedMessage = runEqualizers(simplify(detailedMessage));

    expect(equalizedPresetMessage).toBe(equalizedSimplifiedMessage);
  });

  test('can detail a Message', () => {
    const computedDetailedMessage = detail(simplifiedMessage);

    expect(detailedMessage).toStrictEqual(computedDetailedMessage);
  });

  test('can simplify an Operation', () => {
    const equalizedPresetOperation = runEqualizers(simplifiedOperation);
    const equalizedSimplifiedOperation = runEqualizers(
      simplify(detailedOperation)
    );

    expect(equalizedPresetOperation).toBe(equalizedSimplifiedOperation);
  });

  test('can detail an Operation', () => {
    const computedDetailedOperation = detail(simplifiedOperation);

    expect(detailedOperation).toStrictEqual(computedDetailedOperation);
  });

  test('can simplify an ObjectMessage', () => {
    const equalizedPresetObjectMessage = runEqualizers(simplifiedObjectMessage);
    const equalizedSimplifiedObjectMessage = runEqualizers(
      simplify(detailedObjectMessage)
    );

    expect(equalizedPresetObjectMessage).toBe(equalizedSimplifiedObjectMessage);
  });

  test('can detail an ObjectMessage', () => {
    const computedDetailedObjectMessage = detail(simplifiedObjectMessage);

    expect(detailedObjectMessage).toStrictEqual(computedDetailedObjectMessage);
  });

  test('can simplify an ObjectRequestMessage', () => {
    const equalizedPresetObjectRequestMessage = runEqualizers(
      simplifiedObjectRequestMessage
    );
    const equalizedSimplifiedObjectRequestMessage = runEqualizers(
      simplify(detailedObjectRequestMessage)
    );

    expect(equalizedPresetObjectRequestMessage).toBe(
      equalizedSimplifiedObjectRequestMessage
    );
  });

  test('can detail an ObjectRequestMessage', () => {
    const computedDetailedObjectRequestMessage = detail(
      simplifiedObjectRequestMessage
    );

    expect(detailedObjectRequestMessage).toStrictEqual(
      computedDetailedObjectRequestMessage
    );
  });

  test('can simplify an IsNoneMessage', () => {
    const equalizedPresetIsNoneMessage = runEqualizers(simplifiedIsNoneMessage);
    const equalizedSimplifiedIsNoneMessage = runEqualizers(
      simplify(detailedIsNoneMessage)
    );

    expect(equalizedPresetIsNoneMessage).toBe(equalizedSimplifiedIsNoneMessage);
  });

  test('can detail an IsNoneMessage', () => {
    const computedDetailedIsNoneMessage = detail(simplifiedIsNoneMessage);

    expect(detailedIsNoneMessage).toStrictEqual(computedDetailedIsNoneMessage);
  });

  test('can simplify a GetShapeMessage', () => {
    const equalizedPresetGetShapeMessage = runEqualizers(
      simplifiedGetShapeMessage
    );
    const equalizedSimplifiedGetShapeMessage = runEqualizers(
      simplify(detailedGetShapeMessage)
    );

    expect(equalizedPresetGetShapeMessage).toBe(
      equalizedSimplifiedGetShapeMessage
    );
  });

  test('can detail a GetShapeMessage', () => {
    const computedDetailedGetShapeMessage = detail(simplifiedGetShapeMessage);

    expect(detailedGetShapeMessage).toStrictEqual(
      computedDetailedGetShapeMessage
    );
  });

  test('can simplify a ForceObjectDeleteMessage', () => {
    const equalizedPresetForceObjectDeleteMessage = runEqualizers(
      simplifiedForceObjectDeleteMessage
    );
    const equalizedSimplifiedForceObjectDeleteMessage = runEqualizers(
      simplify(detailedForceObjectDeleteMessage)
    );

    expect(equalizedPresetForceObjectDeleteMessage).toBe(
      equalizedSimplifiedForceObjectDeleteMessage
    );
  });

  test('can detail a ForceObjectDeleteMessage', () => {
    const computedDetailedForceObjectDeleteMessage = detail(
      simplifiedForceObjectDeleteMessage
    );

    expect(detailedForceObjectDeleteMessage).toStrictEqual(
      computedDetailedForceObjectDeleteMessage
    );
  });

  test('can simplify a SearchMessage', () => {
    const equalizedPresetSearchMessage = runEqualizers(simplifiedSearchMessage);
    const equalizedSimplifiedSearchMessage = runEqualizers(
      simplify(detailedSearchMessage)
    );

    expect(equalizedPresetSearchMessage).toBe(equalizedSimplifiedSearchMessage);
  });

  test('can detail a SearchMessage', () => {
    const computedDetailedSearchMessage = detail(simplifiedSearchMessage);

    expect(detailedSearchMessage).toStrictEqual(computedDetailedSearchMessage);
  });

  test('can simplify a PlanCommandMessage', () => {
    const equalizedPresetPlanCommandMessage = runEqualizers(
      simplifiedPlanCommandMessage
    );
    const equalizedSimplifiedPlanCommandMessage = runEqualizers(
      simplify(detailedPlanCommandMessage)
    );

    expect(equalizedPresetPlanCommandMessage).toBe(
      equalizedSimplifiedPlanCommandMessage
    );
  });

  test('can detail a PlanCommandMessage', () => {
    const computedDetailedPlanCommandMessage = detail(
      simplifiedPlanCommandMessage
    );

    expect(detailedPlanCommandMessage).toStrictEqual(
      computedDetailedPlanCommandMessage
    );
  });

  // NOTE: We don't need to test if a simplifier is not found because it will never happen

  test('will throw an error if no detailer is found', () => {
    const unknownSimplifiedItem = "(999, (b'hello'))";

    expect(() => {
      detail(unknownSimplifiedItem);
    }).toThrow();
  });
});
