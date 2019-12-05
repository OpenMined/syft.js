global.tf = {
  tensor: (value, shape, type) => {
    console.log('Created a tensor!', value, shape, type);
  },
  add: jest.fn(),
  abs: jest.fn()
};
