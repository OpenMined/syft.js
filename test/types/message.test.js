import {
  type,
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
import { CODES } from '../../src/types/message';

describe('Message', () => {
  test('can be properly constructed', () => {
    expect(detailedMessage.type).toStrictEqual(type);
    expect(detailedMessage.contents).toStrictEqual(contents);
  });
});

describe('Operation', () => {
  test('can be properly constructed', () => {
    expect(detailedOperation.type).toStrictEqual(CODES.CMD);
    expect(detailedOperation.message).toStrictEqual(message);
    expect(detailedOperation.returnIds).toStrictEqual(returnIds);
  });
});

describe('ObjectMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedObjectMessage.type).toStrictEqual(CODES.OBJ);
    expect(detailedObjectMessage.contents).toStrictEqual(contents);
  });
});

describe('ObjectRequestMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedObjectRequestMessage.type).toStrictEqual(CODES.OBJ_REQ);
    expect(detailedObjectRequestMessage.contents).toStrictEqual(contents);
  });
});

describe('IsNoneMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedIsNoneMessage.type).toStrictEqual(CODES.IS_NONE);
    expect(detailedIsNoneMessage.contents).toStrictEqual(contents);
  });
});

describe('GetShapeMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedGetShapeMessage.type).toStrictEqual(CODES.GET_SHAPE);
    expect(detailedGetShapeMessage.contents).toStrictEqual(contents);
  });
});

describe('ForceObjectDeleteMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedForceObjectDeleteMessage.type).toStrictEqual(
      CODES.FORCE_OBJ_DEL
    );
    expect(detailedForceObjectDeleteMessage.contents).toStrictEqual(contents);
  });
});

describe('SearchMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedSearchMessage.type).toStrictEqual(CODES.SEARCH);
    expect(detailedSearchMessage.contents).toStrictEqual(contents);
  });
});

describe('PlanCommandMessage', () => {
  test('can be properly constructed', () => {
    expect(detailedPlanCommandMessage.type).toStrictEqual(CODES.PLAN_CMD);
    expect(detailedPlanCommandMessage.commandName).toStrictEqual(commandName);
    expect(detailedPlanCommandMessage.message).toStrictEqual(message);
  });
});
