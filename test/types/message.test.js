import { Message, Operation, ObjectMessage } from '../../src/types/message';
import Placeholder from '../../src/types/placeholder';
import { TorchTensor } from '../../src/types/torch';

describe('Message', () => {
  test('can be properly constructed', () => {
    const content = 'abc';
    const obj = new Message(content);
    expect(obj.contents).toBe(content);
  });
});

describe('Operation', () => {
  test('can be properly constructed', () => {
    const ph1 = new Placeholder(123);
    const ph2 = new Placeholder(321);
    const ph3 = new Placeholder(555);
    const obj = new Operation('add', ph1, [ph2], null, [], [ph3]);
    expect(obj.command).toStrictEqual('add');
    expect(obj.owner).toStrictEqual(ph1);
    expect(obj.args).toStrictEqual([ph2]);
    expect(obj.kwargs).toStrictEqual(null);
    expect(obj.returnIds).toStrictEqual([]);
    expect(obj.returnPlaceholders).toStrictEqual([ph3]);
  });
});

describe('ObjectMessage', () => {
  test('can be properly constructed', () => {
    const tensor = new TorchTensor(
      123,
      new Float32Array([1, 2, 3, 4]),
      [2, 2],
      'float32'
    );
    const obj = new ObjectMessage(tensor);
    expect(obj.contents).toBe(tensor);
  });
});

describe('ObjectRequestMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});

describe('IsNoneMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});

describe('GetShapeMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});

describe('ForceObjectDeleteMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});

describe('SearchMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});

describe('PlanCommandMessage', () => {
  test('can be properly constructed', () => {
    // TODO when type is available in protobuf
  });
});
