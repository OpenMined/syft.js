export class NoDetailerError extends Error {
  constructor(d) {
    super(
      `Serialized object contains type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${d}.`
    );
    this.name = 'NoDetailerError';
  }
}

export class NotEnoughArgsError extends Error {
  constructor(passed, expected) {
    super(
      `You have passed ${passed} argument(s) when the plan requires ${expected} argument(s).`
    );
    this.name = 'NotEnoughArgsError';
  }
}

export class MissingVariableError extends Error {
  constructor() {
    super(`Command requires variable that is missing.`);
    this.name = 'MissingVariableError';
  }
}

export class NoPlanError extends Error {
  constructor() {
    super(
      `The operation you're attempting to run requires a plan before being called.`
    );
    this.name = 'NoPlanError';
  }
}

export class PlanAlreadyCompletedError extends Error {
  constructor(name, id) {
    super(
      `You have already executed the plan named "${name}" with id "${id}".`
    );
    this.name = 'PlanAlreadyCompletedError';
  }
}

export class CannotFindCommandError extends Error {
  constructor(command) {
    super(`Command ${command} not found in in TensorFlow.js.`);
    this.name = 'CannotFindCommandError';
  }
}

export class GridUnknownCycleStatusError extends Error {
  constructor(status) {
    super(`Unknown cycle status: ${status}`);
    this.name = 'GridUnknownCycleStatusError';
  }
}

export class GridError extends Error {
  constructor(status) {
    super(`Grid error: ${status}`);
    this.name = 'GridError';
  }
}

export class ModelLoadFailedError extends Error {
  constructor(status) {
    super(`Failed to load Model: ${status}`);
    this.name = 'ModelLoadFailedError';
  }
}

export class PlanLoadFailedError extends Error {
  constructor(planName, status) {
    super(`Failed to load '${planName}' Plan: ${status}`);
    this.name = 'PlanLoadFailedError';
  }
}

export class ProtobufUnserializeFailedError extends Error {
  constructor(pbType, status) {
    super(
      `Failed to unserialize binary protobuf data into ${pbType}: ${status}`
    );
    this.name = 'ProtobufUnserializeFailedError';
  }
}
