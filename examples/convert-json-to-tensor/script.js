class FloatTensor {
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

var tensorObject = {
  torch_type: 'torch.FloatTensor',
  data: [1.0, 2.0, 3.0, 4.0, 5.0],
  id: 1476041248,
  owners: [0],
  is_pointer: false
};

var floatTensor = new FloatTensor(tensorObject);
floatTensor.torch_type = 'test';

console.log(floatTensor.torch_type);

floatTensor.show();
