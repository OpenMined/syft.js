const DATA = new Int32Array(0)

export class DimArray {
  shape: Uint32Array
  data: Int32Array|Float64Array = DATA
  size: number

  constructor(
    $: any,
    data: any[]
  ) {

    if ($ !== DimArray) {
      throw new Error('CANNOT construct DimArray directly.')
    }

    let shape = []
    let size = 1
    let d = data

    while (Array.isArray(d)) {
      let dim = d.length
      shape.push(dim)
      size *= dim
      d = d[0]
    }

    this.size = size
    this.shape = new Uint32Array(shape)
  }

  __fillData__(data: any[]) {
    let size = this.size
    let shape = this.shape
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

      this.data[i] = v
    }
  }
}

export class IntDimArray extends DimArray {
  data: Int32Array

  constructor(data: any[]) {
    super(DimArray, data)

    this.data = new Int32Array(this.size)
    this.__fillData__(data)
  }
}

export class FloatDimArray extends DimArray {
  data: Float64Array

  constructor(data: any[]) {
    super(DimArray, data)

    this.data = new Float64Array(this.size)
    this.__fillData__(data)
  }
}
