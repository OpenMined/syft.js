import { addition } from './helper';
import { getConnection } from './connection';

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

  get data() {
    return this._data;
  }

  set data(data) {
    this._data = data;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get owners() {
    return this._owners;
  }

  set owners(owners) {
    this._owners = owners;
  }

  get is_pointer() {
    return this._is_pointer;
  }

  set is_pointer(is_pointer) {
    this._is_pointer = is_pointer;
  }

  show() {
    console.log(addition(this.id));
  }
}

export const connect = url => {
  getConnection(url, console.log);
};
