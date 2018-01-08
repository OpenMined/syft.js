export declare class DimArray {
    shape: Uint32Array;
    data: Int32Array | Float64Array;
    size: number;
    constructor(data: any[]);
    __fillData__(data: any[], arr?: any[]): void;
}
export declare class IntDimArray extends DimArray {
    data: Int32Array;
    constructor(data: any[]);
}
export declare class FloatDimArray extends DimArray {
    data: Float64Array;
    constructor(data: any[]);
}
