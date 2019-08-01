export default class Plan {
  constructor(operations, id, args, results, name, tags, description, isBuilt) {
    this.operations = operations;
    this.id = id;
    this.args = args;
    this.results = results;
    this.name = name;
    this.tags = tags;
    this.description = description;
    this.isBuilt = isBuilt;
  }
}
