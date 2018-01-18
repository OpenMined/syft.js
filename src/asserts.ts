export function assertType(
  value: any,
  Type: Function|string
) {
  if (
    typeof Type == 'string'
  ) {
    if (typeof value == Type) {
      return value
    }

    throw new TypeError(`Value Is Not Of Type: ${Type}`)
  }

  if (value instanceof Type) {
    return value
  }

  throw new TypeError(`Value Is Not Of Type: ${Type.name}`)
}
