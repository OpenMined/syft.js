import { NoDetailerError, NotEnoughArgsError,
         MissingVariableError, NoPlanError, PlanAlreadyCompletedError,
         CannotFindCommandError, GridUnknownCycleStatusError, GridError,
         ModelLoadFailedError, PlanLoadFailedError,
         ProtobufUnserializeFailedError } from '../src/_errors';

describe('Event Observer', () => {
  jest.spyOn(console, 'log');

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('NoDetailerError', () => {
    const t = () => throw new NoDetailerError(123);
    expect(t).toThrow(NoDetailerError);
  });

  test('NotEnoughArgsError', () => {
    const t = () => throw new NotEnoughArgsError(1, 2);
    expect(t).toThrow(NotEnoughArgsError);
  });

  test('MissingVariableError', () => {
    const t = () => throw new MissingVariableError();
    expect(t).toThrow(MissingVariableError);
  });

  test('NoPlanError', () => {
    const t = () => throw new NoPlanError();
    expect(t).toThrow(NoPlanError);
  });

  test('PlanAlreadyCompletedError', () => {
    const t = () => throw new PlanAlreadyCompletedError("plan", 1);
    expect(t).toThrow(PlanAlreadyCompletedError);
  });

  test('CannotFindCommandError', () => {
    const t = () => throw new CannotFindCommandError("command");
    expect(t).toThrow(CannotFindCommandError);
  });

  test('GridUnknownCycleStatusError', () => {
    const t = () => throw new GridUnknownCycleStatusError("test status");
    expect(t).toThrow(GridUnknownCycleStatusError);
  });

  test('GridError', () => {
    const t = () => throw new GridError("test status");
    expect(t).toThrow(GridError);
  });

  test('ModelLoadFailedError', () => {
    const t = () => throw new ModelLoadFailedError("test status");
    expect(t).toThrow(ModelLoadFailedError);
  });

  test('PlanLoadFailedError', () => {
    const t = () => throw new PlanLoadFailedError("plan", "test status");
    expect(t).toThrow(PlanLoadFailedError);
  });

  test('ProtobufUnserializeFailedError', () => {
    const t = () => throw new ProtobufUnserializeFailedError("pbtype", "test");
    expect(t).toThrow(ProtobufUnserializeFailedError);
  });
});