export interface IAsyncInit {
  finish(res: any): void
  __init__ : {
    error: Error|null
    ready: boolean
    waits: {res: (val?: any)=>void, rej: (val?: any)=>void}[]
    evict: boolean
  }
}

export class AsyncInit {
  __init__ : {
    error: Error|null
    ready: boolean
    waits: {res: (val?: any)=>void, rej: (val?: any)=>void}[]
    evict: boolean
  } = {
    error: null,
    ready: false,
    waits: [],
    evict: false
  }

  protected __finish__(this: AsyncInit&IAsyncInit, res: string) {
    let self = this

    self.finish(res)
    self.__init__.ready = true
    self.__init__.waits.forEach(wait => wait.res());
    self.__init__.waits = []
  }

  protected __error__(res: string) {
    let self = this

    let err = new Error(res)
    self.__init__.error = err
    self.__init__.waits.forEach(wait => wait.rej(err));
    self.__init__.waits = []
  }

  protected __delete__() {
    let self = this

    self.__init__.evict = true
    self.__init__.error = new Error('This Tensor Has Been Deleted')
  }

  async ready() {
    let self = this

    if (self.__init__.error || self.__init__.evict) {
      throw self.__init__.error
    } else if (self.__init__.ready) {
      return
    }

    await new Promise((res, rej) => {
      self.__init__.waits.push({res, rej})
    })
  }
}
