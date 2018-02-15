"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
var TSTypes;
(function (TSTypes) {
    TSTypes[TSTypes["int8"] = 0] = "int8";
    TSTypes[TSTypes["uint8"] = 0] = "uint8";
    TSTypes[TSTypes["int16"] = 1] = "int16";
    TSTypes[TSTypes["uint16"] = 1] = "uint16";
    TSTypes[TSTypes["int32"] = 2] = "int32";
    TSTypes[TSTypes["uint32"] = 2] = "uint32";
    TSTypes[TSTypes["int64"] = 3] = "int64";
    TSTypes[TSTypes["uint64"] = 3] = "uint64";
    TSTypes[TSTypes["int128"] = 4] = "int128";
    TSTypes[TSTypes["uint128"] = 4] = "uint128";
    TSTypes[TSTypes["float16"] = 5] = "float16";
    TSTypes[TSTypes["float32"] = 6] = "float32";
    TSTypes[TSTypes["float64"] = 7] = "float64";
    TSTypes[TSTypes["float128"] = 8] = "float128";
})(TSTypes = exports.TSTypes || (exports.TSTypes = {}));
function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
class TensorSerializer {
    encodeType(props) {
        return props.shapeLengthSetting +
            props.dataShapeLengthSetting * 5 +
            props.dataLengthSetting * 25 +
            props.shapeTypeSetting * 125 +
            props.dataShapeTypeSetting * 625 +
            props.dataTypeSetting * 3125;
    }
    decodeType(type) {
        return {
            shapeLengthSetting: type % 5,
            dataShapeLengthSetting: Math.floor(type / 5) % 5,
            dataLengthSetting: Math.floor(type / 25) % 5,
            shapeTypeSetting: Math.floor(type / 125) % 5,
            dataShapeTypeSetting: Math.floor(type / 625) % 5,
            dataTypeSetting: Math.floor(type / 3125) % 9
        };
    }
    dataType(data) {
        let max = data[0];
        let min = data[0];
        let len = data.length;
        for (let i = 1; i < len; i++) {
            let val = data[i];
            max = max > val ? max : val;
            min = min < val ? min : val;
        }
        if (-128 <= min && max <= 127) {
            return TSTypes.int8;
        }
        if (-32768 <= min && max <= 32767) {
            return TSTypes.int16;
        }
        return TSTypes.int32;
    }
    lenType(data) {
        let max = -1;
        if (typeof data === 'number') {
            max = data;
        }
        else {
            max = data[0];
            let len = data.length;
            for (let i = 1; i < len; i++) {
                let val = data[i];
                max = max > val ? max : val;
            }
        }
        if (max < 256) {
            return TSTypes.uint8;
        }
        if (max < 65536) {
            return TSTypes.uint16;
        }
        return TSTypes.uint32;
    }
    byteSize(n) {
        switch (n) {
            case TSTypes.int8:
                return 1;
            case TSTypes.int16:
            case TSTypes.float16:
                return 2;
            case TSTypes.int32:
            case TSTypes.float32:
                return 4;
            case TSTypes.int64:
            case TSTypes.float64:
                return 8;
            case TSTypes.int128:
            case TSTypes.float128:
                return 16;
        }
    }
    calcContentLength(props, t) {
        let self = this;
        let typeBytes = 2;
        let shapeLengthBytes = self.byteSize(props.shapeLengthSetting);
        let dataLengthShapeBytes = self.byteSize(props.dataShapeLengthSetting);
        let dataLengthBytes = self.byteSize(props.dataLengthSetting);
        let shapeTypeBytes = self.byteSize(props.shapeTypeSetting);
        let dataShapeTypeBytes = self.byteSize(props.dataShapeTypeSetting);
        let dataTypeBytes = self.byteSize(props.dataTypeSetting);
        return typeBytes
            + shapeLengthBytes
            + dataLengthShapeBytes
            + dataLengthBytes
            + shapeTypeBytes * t.shape.length
            + dataShapeTypeBytes * t.shape.length
            + dataTypeBytes * t.data.length;
    }
    serialize(t, optimizeStorage = false) {
        let self = this;
        let dataType = t instanceof lib_1.IntDimArray ? TSTypes.int32 : TSTypes.float32;
        let props = {
            shapeLengthSetting: TSTypes.uint32,
            dataShapeLengthSetting: TSTypes.uint32,
            dataLengthSetting: TSTypes.uint32,
            shapeTypeSetting: TSTypes.uint32,
            dataShapeTypeSetting: TSTypes.uint32,
            dataTypeSetting: dataType
        };
        if (optimizeStorage) {
            props.shapeLengthSetting = self.lenType(t.shape.length);
            props.dataShapeLengthSetting = self.lenType(t.shape.length);
            props.dataLengthSetting = self.lenType(t.data.length);
            props.shapeTypeSetting = self.lenType(t.shape);
            props.dataShapeTypeSetting = self.lenType(t.shape);
            if (t instanceof lib_1.IntDimArray) {
                props.dataTypeSetting = self.dataType(t.data);
            }
        }
        let size = self.calcContentLength(props, t);
        let data = new ArrayBuffer(size);
        let view = new DataView(data);
        let offset = 0;
        view.setUint16(offset, self.encodeType(props));
        offset += 2;
        switch (props.shapeLengthSetting) {
            case TSTypes.uint8:
                view.setUint8(offset, t.shape.length);
                break;
            case TSTypes.uint16:
                view.setUint16(offset, t.shape.length);
                break;
            case TSTypes.uint32:
                view.setUint32(offset, t.shape.length);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.shapeLengthSetting]}`);
        }
        offset += self.byteSize(props.shapeLengthSetting);
        switch (props.dataShapeLengthSetting) {
            case TSTypes.uint8:
                view.setUint8(offset, t.shape.length);
                break;
            case TSTypes.uint16:
                view.setUint16(offset, t.shape.length);
                break;
            case TSTypes.uint32:
                view.setUint32(offset, t.shape.length);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeLengthSetting]}`);
        }
        offset += self.byteSize(props.dataShapeLengthSetting);
        switch (props.dataLengthSetting) {
            case TSTypes.uint8:
                view.setUint8(offset, t.data.length);
                break;
            case TSTypes.uint16:
                view.setUint16(offset, t.data.length);
                break;
            case TSTypes.uint32:
                view.setUint32(offset, t.data.length);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.dataLengthSetting]}`);
        }
        offset += self.byteSize(props.dataLengthSetting);
        for (let i = 0; i < t.shape.length; i++) {
            sw: switch (props.shapeTypeSetting) {
                case TSTypes.uint8:
                    view.setUint8(offset, t.shape[i]);
                    break sw;
                case TSTypes.uint16:
                    view.setUint16(offset, t.shape[i]);
                    break sw;
                case TSTypes.uint32:
                    view.setUint32(offset, t.shape[i]);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.shapeTypeSetting]}`);
            }
            offset += self.byteSize(props.shapeTypeSetting);
        }
        for (let i = 0; i < t.shape.length; i++) {
            sw: switch (props.dataShapeTypeSetting) {
                case TSTypes.uint8:
                    view.setUint8(offset, t.shape[i]);
                    break sw;
                case TSTypes.uint16:
                    view.setUint16(offset, t.shape[i]);
                    break sw;
                case TSTypes.uint32:
                    view.setUint32(offset, t.shape[i]);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeTypeSetting]}`);
            }
            offset += self.byteSize(props.dataShapeTypeSetting);
        }
        for (let i = 0; i < t.data.length; i++) {
            sw: switch (props.dataTypeSetting) {
                case TSTypes.int8:
                    view.setInt8(offset, t.data[i]);
                    break sw;
                case TSTypes.int16:
                    view.setInt16(offset, t.data[i]);
                    break sw;
                case TSTypes.int32:
                    view.setInt32(offset, t.data[i]);
                    break sw;
                case TSTypes.float32:
                    view.setFloat32(offset, t.data[i]);
                    break sw;
                case TSTypes.float64:
                    view.setFloat64(offset, t.data[i]);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.dataTypeSetting]}`);
            }
            offset += self.byteSize(props.dataTypeSetting);
        }
        return { data, view, toString: Buffer.prototype.toString.bind(new Buffer(data)) };
    }
    async deserialize(str) {
        let self = this;
        let buf = toArrayBuffer(new Buffer(str, 'base64'));
        let view = new DataView(buf);
        let offset = 0;
        let props = self.decodeType(view.getUint16(offset));
        offset += 2;
        let shapeLength = 0;
        switch (props.shapeLengthSetting) {
            case TSTypes.uint8:
                shapeLength = view.getUint8(offset);
                break;
            case TSTypes.uint16:
                shapeLength = view.getUint16(offset);
                break;
            case TSTypes.uint32:
                shapeLength = view.getUint32(offset);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.shapeLengthSetting]}`);
        }
        offset += self.byteSize(props.shapeLengthSetting);
        let dataShapeLength = 0;
        switch (props.dataShapeLengthSetting) {
            case TSTypes.uint8:
                dataShapeLength = view.getUint8(offset);
                break;
            case TSTypes.uint16:
                dataShapeLength = view.getUint16(offset);
                break;
            case TSTypes.uint32:
                dataShapeLength = view.getUint32(offset);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeLengthSetting]}`);
        }
        offset += self.byteSize(props.dataShapeLengthSetting);
        let dataLength = 0;
        switch (props.dataLengthSetting) {
            case TSTypes.uint8:
                dataLength = view.getUint8(offset);
                break;
            case TSTypes.uint16:
                dataLength = view.getUint16(offset);
                break;
            case TSTypes.uint32:
                dataLength = view.getUint32(offset);
                break;
            default:
                throw new Error(`Unsupported Type: ${TSTypes[props.dataLengthSetting]}`);
        }
        offset += self.byteSize(props.dataLengthSetting);
        let shape = new Uint32Array(shapeLength);
        for (let i = 0; i < shapeLength; i++) {
            sw: switch (props.shapeTypeSetting) {
                case TSTypes.uint8:
                    shape[i] = view.getUint8(offset);
                    break sw;
                case TSTypes.uint16:
                    shape[i] = view.getUint16(offset);
                    break sw;
                case TSTypes.uint32:
                    shape[i] = view.getUint32(offset);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.shapeTypeSetting]}`);
            }
            offset += self.byteSize(props.shapeTypeSetting);
        }
        let dataShape = new Uint32Array(dataShapeLength);
        for (let i = 0; i < dataShapeLength; i++) {
            sw: switch (props.dataShapeTypeSetting) {
                case TSTypes.uint8:
                    dataShape[i] = view.getUint8(offset);
                    break sw;
                case TSTypes.uint16:
                    dataShape[i] = view.getUint16(offset);
                    break sw;
                case TSTypes.uint32:
                    dataShape[i] = view.getUint32(offset);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeTypeSetting]}`);
            }
            offset += self.byteSize(props.dataShapeTypeSetting);
        }
        let data;
        let dimData;
        if (props.dataTypeSetting >= TSTypes.float16) {
            data = new Float64Array(dataLength);
            dimData = new lib_1.FloatDimArray([]);
        }
        else {
            data = new Int32Array(dataLength);
            dimData = new lib_1.IntDimArray([]);
        }
        dimData.size = dataLength;
        dimData.shape = shape;
        dimData.data = data;
        for (let i = 0; i < dataLength; i++) {
            sw: switch (props.dataTypeSetting) {
                case TSTypes.int8:
                    data[i] = view.getInt8(offset);
                    break sw;
                case TSTypes.int16:
                    data[i] = view.getInt16(offset);
                    break sw;
                case TSTypes.int32:
                    data[i] = view.getInt32(offset);
                    break sw;
                case TSTypes.float32:
                    data[i] = view.getFloat32(offset);
                    break sw;
                case TSTypes.float64:
                    data[i] = view.getFloat64(offset);
                    break sw;
                default:
                    throw new Error(`Unsupported Type: ${TSTypes[props.dataTypeSetting]}`);
            }
            offset += self.byteSize(props.dataTypeSetting);
        }
        return dimData;
    }
}
exports.TensorSerializer = TensorSerializer;
//# sourceMappingURL=TensorSerializer.js.map