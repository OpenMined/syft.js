// A simple logging function
export default class Logger {
  constructor(system, verbose) {
    if (!Logger.instance) {
      this.system = system;
      this.verbose = verbose;
      Logger.instance = this;
    }
    return Logger.instance;
  }

  log(message, data) {
    // Only log if verbose is turned on
    if (this.verbose) {
      const output = `${Date.now()}: ${this.system} - ${message}`;

      // Have the passed additional data?
      if (data) {
        console.log(output, data);
      } else {
        console.log(output);
      }
    }
  }
}
