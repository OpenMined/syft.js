export declare class Job<D, R> {
    id: string;
    data: D;
    resolve: (data: R) => void;
    reject: (data: any) => void;
    constructor(id: string, data: D, resolve: (data: R) => void, reject: (data: any) => void);
}
export declare class WorkQueue<D, R> {
    limit: number;
    worker: (job: Job<D, R>) => void;
    iddleWorkers: string[];
    waiting: Job<D, R>[];
    working: {
        [id: string]: Job<D, R>;
    };
    idLength: number;
    constructor(worker: (job: Job<D, R>) => void, limit?: number);
    queue(data: D): Promise<R>;
    drain(): void;
    wrap(func: (data: any) => void): (this: Job<D, R>, data: any) => void;
}
