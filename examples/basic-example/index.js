import syft from 'syft.js';

const fromPySyft = `
(17,
 ([[6,
    [1,
     [6,
      [[6,
        [[5, [b'__add__',]],
         [18, [71560559247, 2472411137, 28099456635, None, [2], False]],
         [6, [[18, [71560559247, 2472411137, 28099456635, None, [2], False]]]],
         [0, []]]],
       [1, [99020234254]]]]]],
   [6,
    [1,
     [6,
      [[6,
        [[5, [b'torch.abs',]],
         None,
         [6,
          [[18, [32408443280, 99020234254, 28099456635, None, None, True]]]],
         [0, []]]],
       [1, [9449593509]]]]]],
   [6, [9, 99020234254]]],
  28099456635,
  (1, [2472411137]),
  (1, [9449593509]),
  (5, (b'plan_double_abs',)),
  None,
  None,
  True))
`;

const mySyft = new syft({ verbose: true });

const detailed = mySyft.detail(fromPySyft);
const simplified = mySyft.simplify(detailed);

console.log('DETAILED', detailed);

console.log('ORIG', fromPySyft.replace(/\s/g, ''));
console.log('SIMP', simplified.replace(/\s/g, ''));
