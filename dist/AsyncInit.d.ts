export interface IAsyncInit {
    finish(res: any): void;
    __init__: {
        error: Error | null;
        ready: boolean;
        waits: {
            res: (val?: any) => void;
            rej: (val?: any) => void;
        }[];
        evict: boolean;
    };
}
export declare class AsyncInit {
    __init__: {
        error: Error | null;
        ready: boolean;
        waits: {
            res: (val?: any) => void;
            rej: (val?: any) => void;
        }[];
        evict: boolean;
    };
    protected __finish__(this: AsyncInit & IAsyncInit, res: string): void;
    protected __error__(res: string): void;
    protected __delete__(): void;
    ready(): Promise<void>;
}
