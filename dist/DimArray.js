"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function flatten(data, arr = []) {
    for (let item of data) {
        if (Array.isArray(item)) {
            flatten(item, arr);
        }
        else {
            arr.push(item);
        }
    }
    return arr;
}
class DimArray {
    constructor(data) {
        let self = this;
        let shape = [];
        let size = 1;
        let d = data;
        while (Array.isArray(d)) {
            let dim = d.length;
            shape.push(dim);
            size *= dim;
            d = d[0];
        }
        self.size = size;
        self.shape = new Uint32Array(shape);
    }
    __fillData__(data, arr = []) {
        let self = this;
        let d = flatten(data);
        if (d.length != self.size) {
            throw new Error('Invalid Data Structure');
        }
        for (let i in d) {
            let v = d[i];
            if (typeof v != 'number') {
                throw new Error('Invalid Data Type');
            }
            self.data[i] = v;
        }
    }
}
exports.DimArray = DimArray;
class IntDimArray extends DimArray {
    constructor(data) {
        super(data);
        let self = this;
        self.data = new Int32Array(self.size);
        self.__fillData__(data);
    }
}
exports.IntDimArray = IntDimArray;
class FloatDimArray extends DimArray {
    constructor(data) {
        super(data);
        let self = this;
        self.data = new Float64Array(self.size);
        self.__fillData__(data);
    }
}
exports.FloatDimArray = FloatDimArray;
//# sourceMappingURL=DimArray.js.map