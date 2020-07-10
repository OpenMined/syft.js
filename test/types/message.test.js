import { Message, ObjectMessage } from '../../src/types/message';
import { TorchTensor } from '../../src/types/torch';

describe('Message', () => {
  test('can be properly constructed', () => {
    const content = 'abc';
    const obj = new Message(content);
    expect(obj.contents).toBe(content);
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
