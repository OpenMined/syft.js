export declare class IDManager {
    __id__: number;
    __rs__: number[];
    __max__: number;
    constructor(max?: number);
    next(): number | undefined;
    release(id: number): void;
}
