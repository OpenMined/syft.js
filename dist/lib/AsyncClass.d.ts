export interface IAsyncConstructor {
    new ($caller$: any, id: string, ...args: any[]): AsyncInstance;
    create(...args: any[]): Promise<AsyncInstance>;
    get(id: string): Promise<AsyncInstance>;
}
export declare class AsyncInstance {
    id: string;
    __error__: Error | null;
    constructor($: any, id: string);
    ready(): void;
    __delete__(): void;
    static assertCallable($: any): void;
    static assertConstructable($: any): void;
}
