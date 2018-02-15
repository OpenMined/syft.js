import { DimArray } from '../lib';
export declare enum TSTypes {
    int8 = 0,
    uint8 = 0,
    int16 = 1,
    uint16 = 1,
    int32 = 2,
    uint32 = 2,
    int64 = 3,
    uint64 = 3,
    int128 = 4,
    uint128 = 4,
    float16 = 5,
    float32 = 6,
    float64 = 7,
    float128 = 8,
}
export declare class TensorSerializer {
    encodeType(props: {
        shapeLengthSetting: number;
        dataShapeLengthSetting: number;
        dataLengthSetting: number;
        shapeTypeSetting: number;
        dataShapeTypeSetting: number;
        dataTypeSetting: number;
    }): number;
    decodeType(type: number): {
        shapeLengthSetting: number;
        dataShapeLengthSetting: number;
        dataLengthSetting: number;
        shapeTypeSetting: number;
        dataShapeTypeSetting: number;
        dataTypeSetting: number;
    };
    dataType(data: ArrayLike<number>): TSTypes.int8 | TSTypes.int16 | TSTypes.int32;
    lenType(data: number | ArrayLike<number>): TSTypes.int8 | TSTypes.int16 | TSTypes.int32;
    byteSize(n: TSTypes): 1 | 16 | 2 | 4 | 8;
    calcContentLength(props: {
        shapeLengthSetting: TSTypes;
        dataShapeLengthSetting: TSTypes;
        dataLengthSetting: TSTypes;
        shapeTypeSetting: TSTypes;
        dataShapeTypeSetting: TSTypes;
        dataTypeSetting: TSTypes;
    }, t: DimArray): number;
    serialize(t: DimArray, optimizeStorage?: boolean): {
        data: ArrayBuffer;
        view: DataView;
        toString: any;
    };
    deserialize(str: string): Promise<DimArray>;
}
