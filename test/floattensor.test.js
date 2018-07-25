const FloatTensor = require('./floattensor');
const addition = require('./floattensor');


test('Adds 2.9 + 1.0 to equal 3.9', () => {
    expect(addition(2.9, 1.0)).toBe(3.9);
});

