export class DimArray {
  shape: Uint32Array
  data: Int32Array|Float64Array
  size: number

  constructor(data: any[]) {
    let self = this

    let shape = []
    let size = 1
    let d = data

    while (Array.isArray(d)) {
      let dim = d.length
      shape.push(dim)
      size *= dim
      d = d[0]
    }

    self.size = size
    self.shape = new Uint32Array(shape)
  }

  __fillData__(data: any[]) {
    let self = this
    let size = self.size
    let shape = self.shape
    let shapeLength = shape.length

    for (let i = 0; i < size; i++) {
      let p = i
      let z = size
      let v: any = data

      for (let k = 0; k < shapeLength; k++) {
        z = Math.floor(z / shape[k])
        v = v[Math.floor(p / z)]
        if (v == null) {
          throw new Error(`Invid Data Format`)
        }
        p %= z
      }

      if (typeof v !== 'number') {
        throw new Error(`Invid Data Type ${typeof v} ${v}`)
      }

      self.data[i] = v
    }
  }
}

export class IntDimArray extends DimArray {
  data: Int32Array

  constructor(data: any[]) {
    super(data)
    let self = this

    self.data = new Int32Array(self.size)
    self.__fillData__(data)
  }
}

export class FloatDimArray extends DimArray {
  data: Float64Array

  constructor(data: any[]) {
    super(data)
    let self = this

    self.data = new Float64Array(self.size)
    self.__fillData__(data)
  }
}
