import { simplify, detail } from '../src/serde';
import {
  simplifiedDict,
  dict,
  simplifiedList,
  list,
  simplifiedSet,
  set,
  simplifiedString,
  string,
  simplifiedTuple,
  tuple
} from './dummy/native';
import { simplifiedRange, range } from './dummy/range';
import { simplifiedSlice, slice } from './dummy/slice';
import { simplifiedTorchTensor, torchTensor } from './dummy/torch-tensor';
import { simplifiedTorchSize, torchSize2 } from './dummy/torch-size';
import { simplifiedPlan, detailedPlan } from './dummy/plan';
import {
  simplifiedPointerTensor,
  firstPointerTensor
} from './dummy/pointer-tensor';

// NOTE: There's a few things we need to get PySyft and syft.js on equal footing.
// Msgpack in Python appears to add extraneous commas to the end of a lot of different Python objects, we should remove these from tests since they aren't syntactically significant
// Likewise, let's trim all white space so that we can ensure there are no issues related to indention or spacing
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

  // NOTE: We don't need to test if a simplifier is not found because it will never happen

  test('will throw an error if no detailer is found', () => {
    const unknownSimplifiedItem = "(999, (b'hello'))";

    expect(() => {
      detail(unknownSimplifiedItem);
    }).toThrow();
  });
});
