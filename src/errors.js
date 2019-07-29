export const NO_SIMPLIFIER = d =>
  `You have passed a type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${
    d[0]
  }, with value: ${d[1]}.`;
