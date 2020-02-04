import {
  contents,
  detailedMessage,
  message,
  returnIds,
  detailedOperation,
  detailedObjectMessage,
  detailedObjectRequestMessage,
  detailedIsNoneMessage,
  detailedGetShapeMessage,
  detailedForceObjectDeleteMessage,
  detailedSearchMessage,
  commandName,
  detailedPlanCommandMessage
} from '../dummy/message';

describe('Message', () => {
  test('can be properly constructed', () => {
    expect(detailedMessage.contents).toStrictEqual(contents);
  });
});

describe('Operation', () => {
  test.skip('can be properly constructed', () => {
    expect(detailedOperation.message).toStrictEqual(message);
    expect(detailedOperation.returnIds).toStrictEqual(returnIds);
  });

  test('can execute a plan', () => {
    // TODO: Gotta do this one...
  });
});

describe('ObjectMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedObjectMessage.contents).toStrictEqual(contents);
  });
});

describe('ObjectRequestMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedObjectRequestMessage.contents).toStrictEqual(contents);
  });
});

describe('IsNoneMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedIsNoneMessage.contents).toStrictEqual(contents);
  });
});

describe('GetShapeMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedGetShapeMessage.contents).toStrictEqual(contents);
  });
});

describe('ForceObjectDeleteMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedForceObjectDeleteMessage.contents).toStrictEqual(contents);
  });
});

describe('SearchMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedSearchMessage.contents).toStrictEqual(contents);
  });
});

describe('PlanCommandMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedPlanCommandMessage.commandName).toStrictEqual(commandName);
    expect(detailedPlanCommandMessage.message).toStrictEqual(message);
  });
});
