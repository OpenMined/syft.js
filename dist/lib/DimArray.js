"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DATA = new Int32Array(0);
class DimArray {
    constructor($, data) {
        this.data = DATA;
        if ($ !== DimArray) {
            throw new Error('CANNOT construct DimArray directly.');
        }
        let shape = [];
        let size = 1;
        let d = data;
        while (Array.isArray(d)) {
            let dim = d.length;
            shape.push(dim);
            size *= dim;
            d = d[0];
        }
        this.size = size;
        this.shape = new Uint32Array(shape);
    }
    __fillData__(data) {
        let size = this.size;
        let shape = this.shape;
        let shapeLength = shape.length;
        for (let i = 0; i < size; i++) {
            let p = i;
            let z = size;
            let v = data;
            for (let k = 0; k < shapeLength; k++) {
                z = Math.floor(z / shape[k]);
                v = v[Math.floor(p / z)];
                if (v == null) {
                    throw new Error(`Invid Data Format`);
                }
                p %= z;
            }
            if (typeof v !== 'number') {
                throw new Error(`Invid Data Type ${typeof v} ${v}`);
            }
            this.data[i] = v;
        }
    }
}
exports.DimArray = DimArray;
class IntDimArray extends DimArray {
    constructor(data) {
        super(DimArray, data);
        this.data = new Int32Array(this.size);
        this.__fillData__(data);
    }
}
exports.IntDimArray = IntDimArray;
class FloatDimArray extends DimArray {
    constructor(data) {
        super(DimArray, data);
        this.data = new Float64Array(this.size);
        this.__fillData__(data);
    }
}
exports.FloatDimArray = FloatDimArray;
//# sourceMappingURL=DimArray.js.map