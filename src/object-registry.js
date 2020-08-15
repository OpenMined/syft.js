import * as tf from '@tensorflow/tfjs-core';

/**
 * ObjectRegistry stores a map of {id -> object} and a map of {id -> gc},
 * where gc denotes if we want the object of a given id to be garbage collected.
 *
 * @property {Object.<string, Plan>} objects
 * @property {Object.<string, Protocol>} gc
 */
export default class ObjectRegistry {
  constructor() {
    this.objects = {};
    this.gc = {};
  }

  set(id, obj, gc = false) {
    // We want to get rid of the current id and object in the objects map before replacing them
    if (this.objects[id] instanceof tf.Tensor) {
      this.objects[id].dispose();
      delete this.objects[id];
    }
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

  /**
   * Load the objects from an existing ObjectRegistry and store them in this.objects
   * @param {ObjectRegistry} objectRegistry
   */
  load(objectRegistry) {
    for (let key of Object.keys(objectRegistry.objects)) {
      this.set(key, objectRegistry.get(key));
    }
  }
}
