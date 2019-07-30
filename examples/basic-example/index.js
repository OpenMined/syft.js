import syft from 'syft.js';

const fromPySyft = `
(17,
 ([[6,
    [1,
     [6,
      [[6,
        [[5, [b'__add__']],
         [18, [86740191509, 21352736503, 18986127193, None, [2], False]],
         [6,
          [[18, [86740191509, 21352736503, 18986127193, None, [2], False]]]],
         [0, []]]],
       [1, [42195613209]]]]]],
   [6,
    [1,
     [6,
      [[6,
        [[5, [b'torch.abs']],
         None,
         [6,
          [[18, [75885061374, 42195613209, 18986127193, None, None, True]]]],
         [0, []]]],
       [1, [23105997167]]]]]],
   [6, [9, 42195613209]]],
  18986127193,
  (1, [21352736503]),
  (1, [23105997167]),
  (5, (b'plan_double_abs',)),
  None,
  None,
  True))
`;

const mySyft = new syft({ verbose: true });

const detailed = mySyft.detail(fromPySyft);

console.log('FINAL', detailed);

console.log('OPERATION', detailed.operations[2]);
