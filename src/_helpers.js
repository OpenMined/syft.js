export const getArgs = func =>
  func
    .toString()
    .match(/function\s.*?\(([^)]*)\)/)[1]
    .split(',')
    .map(arg => arg.replace(/\/\*.*\*\//, '').trim())
    .filter(arg => arg);
