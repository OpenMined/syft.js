import syft from 'syft.js';

const fromPySyft = `
(19,
 (((24,
    (1,
     (6,
      ((6,
        ((5, (b'__add__',)),
         (20,
          (23885703668, 30300883787, 85156589176, None, (13, (2,)), False)),
         (6,
          ((20,
            (23885703668,
             30300883787,
             85156589176,
             None,
             (13, (2,)),
             False)),)),
         (0, ()))),
       (6, (53361601662,)))))),
   (24,
    (1,
     (6,
      ((6,
        ((5, (b'torch.abs',)),
         None,
         (6,
          ((20, (50671613206, 53361601662, 85156589176, None, None, True)),)),
         (0, ()))),
       (6, (68554228008,)))))),
   (24, (9, 53361601662))),
  85156589176,
  (1, (30300883787,)),
  (6, (68554228008,)),
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
