"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IDManager {
    constructor(max = Number.MAX_SAFE_INTEGER) {
        this.__id__ = 0;
        this.__rs__ = [];
        if (0 < max && max <= Number.MAX_SAFE_INTEGER) {
            this.__max__ = max;
        }
    }
    next() {
        let rs = this.__rs__;
        if (rs.length) {
            return rs.shift();
        }
        if (this.__id__ >= this.__max__) {
            throw new Error('All IDs are issued -- release unused ones if you need more.');
        }
        return this.__id__++;
    }
    release(id) {
        if (0 <= id && id < this.__id__ && !this.__rs__.includes(id)) {
            this.__rs__.push(id);
        }
    }
}
exports.IDManager = IDManager;
//# sourceMappingURL=IDManager.js.map