import { simplify, detail } from '../src/serde';
import { simplifiedPlan, detailedPlan } from './dummy/plan';
import { simplifiedTorchTensor, torchTensor } from './dummy/torch-tensor';

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

// d => new Map(d.map(i => i.map(j => parse(j)))), // 0 = dict
// d => d.map(i => parse(i)), // 1 = list
// d => new Range(...d), // 2 = range
// d => new Set(d.map(i => parse(i))), // 3 = set
// d => new Slice(...d), // 4 = slice
// d => d[0], // 5 = str
// d => Tuple(...d.map(i => parse(i))), // 6 = tuple
// d => new TorchSize(d), // 13 = torch.Size
// d => new PointerTensor(...d.map(i => parse(i)));

describe('Serde', () => {
  // TODO: Patrick, do the rest of the tests for Serde detailing and simplifying all other data types (see above comments)

  test('can simplify a TorchTensor', () => {
    const equalizedPresetTorchTensor = runEqualizers(simplifiedTorchTensor);
    const equalizedSimplifiedTorchTensor = runEqualizers(simplify(torchTensor));

    expect(equalizedPresetTorchTensor).toBe(equalizedSimplifiedTorchTensor);
  });

  test('can detail a TorchTensor', () => {
    const computedDetailedTorchTensor = detail(simplifiedTorchTensor);

    expect(torchTensor).toStrictEqual(computedDetailedTorchTensor);
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

  // TODO: Throw error is no simplifier is found

  test('will throw an error if no detailer is found', () => {
    const unknownSimplifiedItem = "(999, (b'hello'))";

    expect(() => {
      detail(unknownSimplifiedItem);
    }).toThrow();
  });
});
