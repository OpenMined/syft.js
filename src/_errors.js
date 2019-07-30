export const NO_SIMPLIFIER = (id, d) =>
  `You have passed a simplifier type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${id}, with value: ${d}.`;

export const NO_DETAILER = d =>
  `You have passed a detailer type that may exist in PySyft, but is not currently supported in syft.js. Please file a feature request (https://github.com/OpenMined/syft.js/issues) for type ${
    d[0]
  }, with value: ${d[1]}.`;
