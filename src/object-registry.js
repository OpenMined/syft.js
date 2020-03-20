import * as tf from '@tensorflow/tfjs-core';

export default class ObjectRegistry {
  constructor() {
    this.objects = {};
    this.gc = {};
  }

  set(id, obj, gc = false) {
    this.objects[id] = obj;
    this.gc[id] = gc;
  }

  setGc(id, gc) {
    this.gc[id] = gc;
  }

  get(id) {
    return this.objects[id];
  }

  has(id) {
    return Object.hasOwnProperty.call(this.objects, id);
  }

  clear() {
    for (let key of Object.keys(this.objects)) {
      if (this.gc[key] && this.objects[key] instanceof tf.Tensor) {
        this.objects[key].dispose();
      }
    }
    this.objects = {};
    this.gc = {};
  }

  load(objectRegistry) {
    for (let key of Object.keys(objectRegistry.objects)) {
      this.set(key, objectRegistry.get(key));
    }
  }
}

