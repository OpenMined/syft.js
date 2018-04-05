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
    this.worker = worker
    this.limit = limit

    let idLength = this.idLength = (limit - 1).toString(16).length

    for (let i = 0; i < limit; i++) {
      let id = i.toString(16)
      this.iddleWorkers[i] = '0'.repeat(idLength - id.length) + id
    }
  }

  queue(data: D) {
    let p = new Promise<R>((res, rej) => {
      this.waiting.push(new Job<D, R>('', data, this.wrap(res), this.wrap(rej)))
    })

    this.drain()

    return p
  }

  drain() {

    if (
      this.iddleWorkers.length === 0 ||
      this.waiting.length === 0
    ) return

    let id = this.iddleWorkers.shift()
    let job = this.waiting.shift()

    if (!job || !id) return

    job.id = id

    this.working[id] = job

    this.worker(job)
  }

  wrap(func: (data: any) => void) {
    let thisWorkQueue = this

    return function (this: Job<D, R>, data: any) {
      func(data)
      thisWorkQueue.iddleWorkers.push(this.id)
      delete thisWorkQueue.working[this.id]
      thisWorkQueue.drain()
    }
  }
}
