export default class FloatTensor {
  constructor(obj) {
    this.torch_type = obj.torch_type;
    this.data = obj.data;
    this.id = obj.id;
    this.owners = obj.owners;
    this.is_pointer = obj.is_pointer;
  }

  get torch_type() {
    return this._torch_type;
  }

  set torch_type(torch_type) {
    this._torch_type = torch_type;
  }

  show() {
    alert(this.id);
  }
}
