import * as syft from '../../../syft';
export declare class _Dense {
    ordered_syft: syft.Model[];
    syft_model: syft.Model;
    units: number;
    input_shape?: number;
    output_shape?: number;
    activation?: syft.Tensor;
    activation_str?: string;
    syft_activation?: syft.Model;
    constructor(units: number, input_shape?: number, activation?: string);
    static create(units: number, input_shape?: number, activation?: string): Promise<_Dense>;
}
export declare function Dense(units: number, input_shape?: number, activation?: string): Promise<_Dense>;
