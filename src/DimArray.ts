function flatten(data: any[], arr: any[] = []) {
  for (let item of data) {
      if (Array.isArray(item)) {
        flatten(item, arr)
      } else {
        arr.push(item)
      }
    }
  return arr
}

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

  __fillData__(data: any[], arr: any[] = []) {
    let self = this

    let d = flatten(data)

    if (d.length !== self.size) {
      throw new Error('Invalid Data Structure')
    }

    for (let i in d) {
      let v = d[i]
      if (typeof v !== 'number') {
        throw new Error('Invalid Data Type')
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
