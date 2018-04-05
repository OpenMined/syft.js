
export interface IAsyncConstructor {
  new ($caller$: any, id: string, ...args: any[]): AsyncInstance
  create(...args: any[]): Promise<AsyncInstance>
  get(id: string): Promise<AsyncInstance>
}

export class AsyncInstance {
  id: string
  __error__: Error|null = null

  constructor($: any, id: string) {
    AsyncInstance.assertConstructable($)

    this.id = id
  }

  ready() {
    if (this.__error__) {
      throw this.__error__
    }
  }

  __delete__() {
    this.__error__ = new Error('This Object Has Been Deleted.')
  }

  static assertCallable($: any) {
    if ($ !== AsyncInstance) {
      throw new Error('Cannot Call Constructor Directly.')
    }
  }

  static assertConstructable($: any) {
    if ($ !== AsyncInstance) {
      throw new Error('Cannot Call Constructor Directly.')
    }
  }
}
