import { getArgs } from '../src/_helpers';

class MyClass {
  constructor(first, second, third) {
    this.first = first;
    this.second = second;
    this.third = third;
  }
}

describe('Helper functions', () => {
  test('can get the correct number of arguments', () => {
    const args = getArgs(MyClass);

    expect(args.length).toBe(3);
    expect(args[0]).toBe('first');
    expect(args[1]).toBe('second');
    expect(args[2]).toBe('third');
  });
});
