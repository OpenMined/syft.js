const syft = require('../lib/index');

test('Syft.js loads', () => {
  expect(typeof syft).toBe('function');
});
