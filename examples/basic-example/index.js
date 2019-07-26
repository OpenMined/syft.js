import syft from 'syft.js';

try {
  const mySyft = new syft({ verbose: true });

  const bs = {
    nil: null,
    integer: 1,
    float: Math.PI,
    string: 'Hello, world!',
    binary: Uint8Array.from([1, 2, 3]),
    array: [10, 20, 30],
    map: { foo: 'bar' },
    timestampExt: new Date()
  };

  const encoded = mySyft.encode(bs);
  const decoded = mySyft.decode(encoded);

  console.log(bs, decoded, encoded);
} catch (error) {
  console.error(error);
}
