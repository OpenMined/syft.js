import {
  Tensor,
  IntTensor,
  FloatTensor
} from './Tensor'

import {
  IntDimArray,
  FloatDimArray
} from './DimArray'

export enum TSTypes {
  int8 = 0,
  uint8 = 0,
  int16 = 1,
  uint16 = 1,
  int32 = 2,
  uint32 = 2,
  int64 = 3,
  uint64 = 3,
  int128 = 4,
  uint128 = 4,
  float16 = 5,
  float32 = 6,
  float64 = 7,
  float128 = 8
}

function toArrayBuffer(buf: Buffer) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export class TensorSerializer {
  encodeType(
    props: {
      shapeLengthSetting     : number
      dataShapeLengthSetting : number
      dataLengthSetting      : number
      shapeTypeSetting       : number
      dataShapeTypeSetting   : number
      dataTypeSetting        : number
    }
  ) {
    return props.shapeLengthSetting +
    props.dataShapeLengthSetting    * 5 +
    props.dataLengthSetting         * 25 +
    props.shapeTypeSetting          * 125 +
    props.dataShapeTypeSetting      * 625 +
    props.dataTypeSetting           * 3125
  }

  decodeType(
    type: number
  ) {
    return {
      shapeLengthSetting     : type % 5,
      dataShapeLengthSetting : Math.floor(type / 5) % 5,
      dataLengthSetting      : Math.floor(type / 25) % 5,
      shapeTypeSetting       : Math.floor(type / 125) % 5,
      dataShapeTypeSetting   : Math.floor(type / 625) % 5,
      dataTypeSetting        : Math.floor(type / 3125) % 9
    }
  }

  dataType(data: ArrayLike<number>) {
    let max = data[0]
    let min = data[0]
    let len = data.length

    for (let i = 1; i < len; i++) {
      let val = data[i]
      max = max > val ? max : val
      min = min < val ? min : val
    }

    if (-128 <= min && max <= 127) {
      return TSTypes.int8
    }

    if (-32768 <= min && max <= 32767) {
      return TSTypes.int16
    }

    return TSTypes.int32
  }

  lenType(data: number|ArrayLike<number>) {
    let max = -1
    if (typeof data == 'number') {
      max = data
    } else {
      max = data[0]
      let len = data.length

      for (let i = 1; i < len; i++) {
        let val = data[i]
        max = max > val ? max : val
      }
    }

    if (max < 256) {
      return TSTypes.uint8
    }

    if (max < 65536) {
      return TSTypes.uint16
    }

    return TSTypes.uint32
  }

  byteSize(n: TSTypes) {
    switch(n) {
    case TSTypes.int8:
      return 1
    case TSTypes.int16:
    case TSTypes.float16:
      return 2
    case TSTypes.int32:
    case TSTypes.float32:
      return 4
    case TSTypes.int64:
    case TSTypes.float64:
      return 8
    case TSTypes.int128:
    case TSTypes.float128:
      return 16
    }
  }

  calcContentLength(
    props: {
      shapeLengthSetting     : TSTypes
      dataShapeLengthSetting : TSTypes
      dataLengthSetting      : TSTypes
      shapeTypeSetting       : TSTypes
      dataShapeTypeSetting   : TSTypes
      dataTypeSetting        : TSTypes
    },
    t: Tensor
  ) {
    let self = this

    let typeBytes = 2 // type header
    let shapeLengthBytes = self.byteSize(props.shapeLengthSetting)
    let dataLengthShapeBytes = self.byteSize(props.dataShapeLengthSetting)
    let dataLengthBytes = self.byteSize(props.dataLengthSetting)
    let shapeTypeBytes = self.byteSize(props.shapeTypeSetting)
    let dataShapeTypeBytes = self.byteSize(props.dataShapeTypeSetting)
    let dataTypeBytes = self.byteSize(props.dataTypeSetting)

    return typeBytes
      + shapeLengthBytes
      + dataLengthShapeBytes
      + dataLengthBytes
      + shapeTypeBytes * t.data.shape.length
      + dataShapeTypeBytes * t.data.shape.length
      + dataTypeBytes * t.data.data.length
  }

  serialize(
    t: Tensor,
    optimizeStorage = false
  ) {
    let self = this

    let dataType = t.type == 'IntTensor' ? TSTypes.int32 : TSTypes.float32

    let props = {
      shapeLengthSetting     : TSTypes.uint32,
      dataShapeLengthSetting : TSTypes.uint32,
      dataLengthSetting      : TSTypes.uint32,
      shapeTypeSetting       : TSTypes.uint32,
      dataShapeTypeSetting   : TSTypes.uint32,
      dataTypeSetting        : dataType
    }

    if (optimizeStorage) {
      props.shapeLengthSetting     = self.lenType(t.data.shape.length)
      props.dataShapeLengthSetting = self.lenType(t.data.shape.length)
      props.dataLengthSetting      = self.lenType(t.data.data.length)
      props.shapeTypeSetting       = self.lenType(t.data.shape)
      props.dataShapeTypeSetting   = self.lenType(t.data.shape)

      if (t.type == 'IntTensor') {
        props.dataTypeSetting = self.dataType(t.data.data)
      }
    }

    let size = self.calcContentLength(props, t)
    let data = new ArrayBuffer(size)
    let view = new DataView(data)

    let offset = 0

    // type header
    view.setUint16(offset, self.encodeType(props))
    offset += 2

    // shape length header
    switch(props.shapeLengthSetting) {
    case TSTypes.uint8:
      view.setUint8(offset, t.data.shape.length)
      break
    case TSTypes.uint16:
      view.setUint16(offset, t.data.shape.length)
      break
    case TSTypes.uint32:
      view.setUint32(offset, t.data.shape.length)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   view.setUint64(offset, t.data.shape.length)
    //   break
    // case TSTypes.uint128:
    //   view.setUint128(offset, t.data.shape.length)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.shapeLengthSetting]}`)
    }
    offset += self.byteSize(props.shapeLengthSetting)

    // data shape length header
    switch(props.dataShapeLengthSetting) {
    case TSTypes.uint8:
      view.setUint8(offset, t.data.shape.length)
      break
    case TSTypes.uint16:
      view.setUint16(offset, t.data.shape.length)
      break
    case TSTypes.uint32:
      view.setUint32(offset, t.data.shape.length)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   view.setUint64(offset, t.data.shape.length)
    //   break
    // case TSTypes.uint128:
    //   view.setUint128(offset, t.data.shape.length)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeLengthSetting]}`)
    }
    offset += self.byteSize(props.dataShapeLengthSetting)

    // data length header
    switch(props.dataLengthSetting) {
    case TSTypes.uint8:
      view.setUint8(offset, t.data.data.length)
      break
    case TSTypes.uint16:
      view.setUint16(offset, t.data.data.length)
      break
    case TSTypes.uint32:
      view.setUint32(offset, t.data.data.length)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   view.setUint64(offset, t.data.data.length)
    //   break
    // case TSTypes.uint128:
    //   view.setUint128(offset, t.data.data.length)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.dataLengthSetting]}`)
    }
    offset += self.byteSize(props.dataLengthSetting)

    // shape data
    for (let i = 0; i < t.data.shape.length; i++) {
      // data shape length header
      sw: switch(props.shapeTypeSetting) {
      case TSTypes.uint8:
        view.setUint8(offset, t.data.shape[i])
        break sw
      case TSTypes.uint16:
        view.setUint16(offset, t.data.shape[i])
        break sw
      case TSTypes.uint32:
        view.setUint32(offset, t.data.shape[i])
        break sw
      // NOTE: not supported
      // case TSTypes.uint64:
      //   view.setUint64(offset, t.data.shape[i])
      //   break sw
      // case TSTypes.uint128:
      //   view.setUint128(offset, t.data.shape[i])
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.shapeTypeSetting]}`)
      }
      offset += self.byteSize(props.shapeTypeSetting)
    }

    // data shape data
    for (let i = 0; i < t.data.shape.length; i++) {
      // data shape length header
      sw: switch(props.dataShapeTypeSetting) {
      case TSTypes.uint8:
        view.setUint8(offset, t.data.shape[i])
        break sw
      case TSTypes.uint16:
        view.setUint16(offset, t.data.shape[i])
        break sw
      case TSTypes.uint32:
        view.setUint32(offset, t.data.shape[i])
        break sw
      // NOTE: not supported
      // case TSTypes.uint64:
      //   view.setUint64(offset, t.data.shape[i])
      //   break sw
      // case TSTypes.uint128:
      //   view.setUint128(offset, t.data.shape[i])
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeTypeSetting]}`)
      }
      offset += self.byteSize(props.dataShapeTypeSetting)
    }

    // data data
    for (let i = 0; i < t.data.data.length; i++) {
      // data shape length header
      sw: switch(props.dataTypeSetting) {
      case TSTypes.int8:
        view.setInt8(offset, t.data.data[i])
        break sw
      case TSTypes.int16:
        view.setInt16(offset, t.data.data[i])
        break sw
      case TSTypes.int32:
        view.setInt32(offset, t.data.data[i])
        break sw
      // NOTE: not supported
      // case TSTypes.int64:
      //   view.setInt64(offset, t.data.data[i])
      //   break sw
      // case TSTypes.int128:
      //   view.setInt128(offset, t.data.data[i])
      //   break sw
      // case TSTypes.float16:
      //   view.setFloat16(offset, t.data.data[i])
      //   break sw
      case TSTypes.float32:
        view.setFloat32(offset, t.data.data[i])
        break sw
      case TSTypes.float64:
        view.setFloat64(offset, t.data.data[i])
        break sw
      // NOTE: not supported
      // case TSTypes.float128:
      //   view.setFloat128(offset, t.data.data[i])
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.dataTypeSetting]}`)
      }
      offset += self.byteSize(props.dataTypeSetting)
    }

    return {data, view, toString: Buffer.prototype.toString.bind(new Buffer(data))}
  }

  deserialize(
    str: string
  ) {
    let self = this

    let buf = toArrayBuffer(new Buffer(str, 'base64'))
    let view = new DataView(buf)
    let offset = 0

    let props = self.decodeType(view.getUint16(offset))
    offset += 2

    // shape length header
    let shapeLength = 0
    switch(props.shapeLengthSetting) {
    case TSTypes.uint8:
      shapeLength = view.getUint8(offset)
      break
    case TSTypes.uint16:
      shapeLength = view.getUint16(offset)
      break
    case TSTypes.uint32:
      shapeLength = view.getUint32(offset)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   shapeLength = view.getUint64(offset)
    //   break
    // case TSTypes.uint128:
    //   shapeLength = view.getUint128(offset)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.shapeLengthSetting]}`)
    }
    offset += self.byteSize(props.shapeLengthSetting)

    // data shape length header
    let dataShapeLength = 0
    switch(props.dataShapeLengthSetting) {
    case TSTypes.uint8:
      dataShapeLength = view.getUint8(offset)
      break
    case TSTypes.uint16:
      dataShapeLength = view.getUint16(offset)
      break
    case TSTypes.uint32:
      dataShapeLength = view.getUint32(offset)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   dataShapeLength = view.getUint64(offset)
    //   break
    // case TSTypes.uint128:
    //   dataShapeLength = view.getUint128(offset)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeLengthSetting]}`)
    }
    offset += self.byteSize(props.dataShapeLengthSetting)

    // data length header
    let dataLength = 0
    switch(props.dataLengthSetting) {
    case TSTypes.uint8:
      dataLength = view.getUint8(offset)
      break
    case TSTypes.uint16:
      dataLength = view.getUint16(offset)
      break
    case TSTypes.uint32:
      dataLength = view.getUint32(offset)
      break
    // NOTE: not supported
    // case TSTypes.uint64:
    //   dataLength = view.getUint64(offset)
    //   break
    // case TSTypes.uint128:
    //   dataLength = view.getUint128(offset)
    //   break
    default:
      throw new Error(`Unsupported Type: ${TSTypes[props.dataLengthSetting]}`)
    }
    offset += self.byteSize(props.dataLengthSetting)

    // shape data
    let shape = new Uint32Array(shapeLength)
    for (let i = 0; i < shapeLength; i++) {
      // data shape length header
      sw: switch(props.shapeTypeSetting) {
      case TSTypes.uint8:
        shape[i] = view.getUint8(offset)
        break sw
      case TSTypes.uint16:
        shape[i] = view.getUint16(offset)
        break sw
      case TSTypes.uint32:
        shape[i] = view.getUint32(offset)
        break sw
      // NOTE: not supported
      // case TSTypes.uint64:
      //   shape[i] = view.getUint64(offset)
      //   break sw
      // case TSTypes.uint128:
      //   shape[i] = view.getUint128(offset)
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.shapeTypeSetting]}`)
      }
      offset += self.byteSize(props.shapeTypeSetting)
    }

    // data shape data
    let dataShape = new Uint32Array(dataShapeLength)
    for (let i = 0; i < dataShapeLength; i++) {
      // data shape length header
      sw: switch(props.dataShapeTypeSetting) {
      case TSTypes.uint8:
        dataShape[i] = view.getUint8(offset)
        break sw
      case TSTypes.uint16:
        dataShape[i] = view.getUint16(offset)
        break sw
      case TSTypes.uint32:
        dataShape[i] = view.getUint32(offset)
        break sw
      // NOTE: not supported
      // case TSTypes.uint64:
      //   dataShape[i] = view.getUint64(offset)
      //   break sw
      // case TSTypes.uint128:
      //   dataShape[i] = view.getUint128(offset)
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.dataShapeTypeSetting]}`)
      }
      offset += self.byteSize(props.dataShapeTypeSetting)
    }

    // data data
    let data
    let dimData
    if (props.dataTypeSetting >= TSTypes.float16) {
      data = new Float64Array(dataLength)
      dimData = new FloatDimArray([])
    } else {
      data = new Int32Array(dataLength)
      dimData = new IntDimArray([])
    }
    dimData.size = dataLength
    dimData.shape = shape
    dimData.data = data

    for (let i = 0; i < dataLength; i++) {
      // data shape length header
      sw: switch(props.dataTypeSetting) {
      case TSTypes.int8:
        data[i] = view.getInt8(offset)
        break sw
      case TSTypes.int16:
        data[i] = view.getInt16(offset)
        break sw
      case TSTypes.int32:
        data[i] = view.getInt32(offset)
        break sw
      // NOTE: not supported
      // case TSTypes.int64:
      //   data[i] = view.getInt64(offset)
      //   break sw
      // case TSTypes.int128:
      //   data[i] = view.getInt128(offset)
      //   break sw
      // case TSTypes.float16:
      //   data[i] = view.getFloat16(offset)
      //   break sw
      case TSTypes.float32:
        data[i] = view.getFloat32(offset)
        break sw
      case TSTypes.float64:
        data[i] = view.getFloat64(offset)
        break sw
      // NOTE: not supported
      // case TSTypes.float128:
      //   data[i] = view.getFloat128(offset)
      //   break sw
      default:
        throw new Error(`Unsupported Type: ${TSTypes[props.dataTypeSetting]}`)
      }
      offset += self.byteSize(props.dataTypeSetting)
    }

    if (dimData instanceof FloatDimArray) {
      return new FloatTensor(dimData)
    }

    return new IntTensor(dimData)
  }
}
