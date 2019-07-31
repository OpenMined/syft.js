export const getArgs = func =>
  func
    .toString()
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '') // Remove all comments
    .replace(/\r?\n|\r/, '') // Remove all new lines
    .match(/function\s.*?\(([^)]*)\)/)[1] // Match the function params and get the 1st group
    .split(',') // Split the group by a ","
    .map(arg => arg.replace(/\/\*.*\*\//, '').trim()) // Map the results
    .filter(arg => arg); // Don't allow for null values!
