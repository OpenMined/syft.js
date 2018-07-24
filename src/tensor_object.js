var message='{"torch_type": "torch.FloatTensor", "data": [1.0, 2.0, 3.0, 4.0, 5.0], "id": 1476041248, "owners": [0], "is_pointer": false}';
var myObj = JSON.parse(message);


class FloatTensor{
  constructor(torch_type,data,id,owners,is_pointer){
    this.torch_type=torch_type;
    this.data=data;
    this.id=id;
    this.owners=owners;
    this.is_pointer=is_pointer;
  }

  get torch_type() {
    return this._torch_type;
  }

  set torch_type(torch_type){
    this._torch_type=torch_type;
  }

  get data() {
    return this._data;
  }

  set data(data){
    this._data=data;
  }

  get id() {
    return this._id;
  }

  set id(id){
    this._id=id;
  }

  get owners() {
    return this._owners;
  }

  set owners(owners){
    this._owners=owners;
  }

  get is_pointer() {
    return this._is_pointer;
  }

  set is_pointer(is_pointer){
    this._is_pointer=is_pointer;
  }


}

var floatTensor=new FloatTensor("harsh",[1,2],1,[0],false);
floatTensor.torch_type="test";
console.log(floatTensor.torch_type);


exports.getFloatTensor=function() {
  return floatTensor;
}
