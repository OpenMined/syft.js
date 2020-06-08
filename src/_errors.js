export const NO_DETAILER = d =>
  `Serialized object contains type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${d}.`;

export const NOT_ENOUGH_ARGS = (passed, expected) =>
  `You have passed ${passed} argument(s) when the plan requires ${expected} argument(s).`;

export const MISSING_VARIABLE = () =>
  `Command requires variable that is missing.`;

export const NO_PLAN = `The operation you're attempting to run requires a plan before being called.`;

export const PLAN_ALREADY_COMPLETED = (name, id) =>
  `You have already executed the plan named "${name}" with id "${id}".`;

export const CANNOT_FIND_COMMAND = command =>
  `We cannot find function ${command} in TensorFlow.js, performing a manual lookup.`;

export const GRID_UNKNOWN_CYCLE_STATUS = status =>
  `Unknown cycle status: ${status}`;
