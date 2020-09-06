import * as tf from '@tensorflow/tfjs-core';

/**
 * ObjectRegistry stores a map of {id -> object} and a map of {id -> gc},
 * where gc denotes if the object of given id will be garbage collected.
 */
export default class ObjectRegistry {
  /**
   * @property {Object.<string, Object>} objects - a map of {id: object}
   * @property {Object.<string, boolean>} gc - a map of {id: boolean} that determines if the object of id will be garbage collected
   */
  constructor() {
    this.objects = {};
    this.gc = {};
  }

  set(id, obj, gc = false) {
    // Remove the current id and object in the objects map before replacing them
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
   * Loads the objects from an existing ObjectRegistry and store them in this.objects
   * @param {ObjectRegistry} objectRegistry
   */
  load(objectRegistry) {
    for (let key of Object.keys(objectRegistry.objects)) {
      this.set(key, objectRegistry.get(key));
    }
  }
}
