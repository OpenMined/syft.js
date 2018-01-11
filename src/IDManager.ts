export class IDManager {
  __id__ = 0
  __rs__: number [] = []

  __max__: number

  constructor(
    max = Number.MAX_SAFE_INTEGER
  ) {
    if (0 < max && max <= Number.MAX_SAFE_INTEGER) {
      this.__max__ = max
    }
  }

  next() {
    let rs = this.__rs__

    if (rs.length) {
      return rs.shift()
    }

    if (this.__id__ >= this.__max__) {
      throw new Error('All IDs are issued -- release unused ones if you need more.')
    }

    return this.__id__++
  }

  release(
    id: number
  ) {
    if (0 <= id && id < this.__id__ && !this.__rs__.includes(id)) {
      this.__rs__.push(id)
    }
  }
}
