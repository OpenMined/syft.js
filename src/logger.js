// A simple logging function
export default class Logger {
  constructor(verbose) {
    this.verbose = verbose;
  }

  log(message, data) {
    // Only log if verbose is turned on
    if (this.verbose) {
      const output = `${Date.now()}: syft.js - ${message}`;

      // Have the passed additional data?
      if (data) {
        console.log(output, data);
      } else {
        console.log(output);
      }
    }
  }
}
