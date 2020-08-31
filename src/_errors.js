export const NO_DETAILER = (d) =>
  `Serialized object contains type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${d}.`;

export const NOT_ENOUGH_ARGS = (passed, expected) =>
  `You have passed ${passed} argument(s) when the plan requires ${expected} argument(s).`;

export const MISSING_VARIABLE = () =>
  `Command requires variable that is missing.`;

export const NO_PLAN = `The operation you're attempting to run requires a plan before being called.`;

export const PLAN_ALREADY_COMPLETED = (name, id) =>
  `You have already executed the plan named "${name}" with id "${id}".`;

export const CANNOT_FIND_COMMAND = (command) =>
  `Command ${command} not found in in TensorFlow.js.`;

export const GRID_UNKNOWN_CYCLE_STATUS = (status) =>
  `Unknown cycle status: ${status}`;

export const GRID_ERROR = (status) => `Grid error: ${status}`;

export const MODEL_LOAD_FAILED = (status) => `Failed to load Model: ${status}`;

export const PLAN_LOAD_FAILED = (planName, status) =>
  `Failed to load '${planName}' Plan: ${status}`;

export const PROTOBUF_UNSERIALIZE_FAILED = (pbType, status) =>
  `Failed to unserialize binary protobuf data into ${pbType}: ${status}`;

export class NoDetailerError extends Error {
  constructor(d) {
    super(NO_DETAILER(d));
    this.name = 'NoDetailerError';
  }
}

export class NotEnoughArgsError extends Error {
  constructor(passed, expected) {
    super(NOT_ENOUGH_ARGS(passed, expected));
    this.name = 'NotEnoughArgsError';
  }
}

export class MissingVariableError extends Error {
  constructor() {
    super(MISSING_VARIABLE());
    this.name = 'MissingVariableError';
  }
}

export class NoPlanError extends Error {
  constructor() {
    super(NO_PLAN);
    this.name = 'NoPlanError';
  }
}

export class PlanAlreadyCompletedError extends Error {
  constructor(name, id) {
    super(PLAN_ALREADY_COMPLETED(name, id));
    this.name = 'PlanAlreadyCompletedError';
  }
}

export class CannotFindCommandError extends Error {
  constructor(command) {
    super(CANNOT_FIND_COMMAND(command));
    this.name = 'CannotFindCommandError';
  }
}

export class GridUnknownCycleStatusError extends Error {
  constructor(status) {
    super(GRID_UNKNOWN_CYCLE_STATUS(status));
    this.name = 'GridUnknownCycleStatusError';
  }
}

export class GridError extends Error {
  constructor(status) {
    super(GRID_ERROR(status));
    this.name = 'GridError';
  }
}

export class ModelLoadFailedError extends Error {
  constructor(status) {
    super(MODEL_LOAD_FAILED(status));
    this.name = 'ModelLoadFailedError';
  }
}

export class PlanLoadFailedError extends Error {
  constructor(planName, status) {
    super(PLAN_LOAD_FAILED(planName, status));
    this.name = 'PlanLoadFailedError';
  }
}

export class ProtobufUnserializeFailedError extends Error {
  constructor(pbType, status) {
    super(PROTOBUF_UNSERIALIZE_FAILED(pbType, status));
    this.name = 'ProtobufUnserializeFailedError';
  }
}
