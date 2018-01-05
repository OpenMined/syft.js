export class Job<D, R> {
  id: string
  data: D
  resolve: (data: R) => void
  reject: (data: any) => void

  constructor(
    id: string,
    data: D,
    resolve: (data: R) => void,
    reject: (data: any) => void
  ) {
    this.id = id
    this.data = data
    this.resolve = resolve
    this.reject = reject
  }
}

export class WorkQueue<D, R> {
  limit: number
  worker: (job: Job<D, R>) => void

  iddleWorkers: string[] = []
  waiting: Job<D, R>[] = []
  working: {[id: string]: Job<D, R>} = {}

  idLength: number

  constructor(
    worker: (job: Job<D, R>) => void,
    limit: number = 256
  ) {
    let self = this
    self.worker = worker
    self.limit = limit

    let idLength = self.idLength = (limit - 1).toString(16).length

    for (let i = 0; i < limit; i++) {
      let id = i.toString(16)
      self.iddleWorkers[i] = '0'.repeat(idLength - id.length) + id
    }
  }

  queue(data: D) {
    let self = this
    let p = new Promise<R>((res, rej) => {
      self.waiting.push(new Job<D, R>('', data, self.wrap(res), self.wrap(rej)))
    })

    self.drain()

    return p
  }

  drain() {
    let self = this

    if (
      self.iddleWorkers.length == 0 ||
      self.waiting.length == 0
    ) return

    let id = self.iddleWorkers.shift()
    let job = self.waiting.shift()

    if (!job || !id) return

    job.id = id

    self.working[id] = job

    self.worker(job)
  }

  wrap(func: (data: any) => void) {
    let self = this

    return function (this: Job<D, R>, data: any) {
      func(data)
      self.iddleWorkers.push(this.id)
      delete self.working[this.id]
      self.drain()
    }
  }
}
