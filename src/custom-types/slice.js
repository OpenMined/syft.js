export default class Slice {
  constructor(start, end, step = null) {
    this.start = start;
    this.end = end;
    this.step = step;

    // TODO: Fill out slice further
    // Keep in mind, we don't want to generate the slice in memory because that's exactly what makes Python ranges so efficient
  }
}
