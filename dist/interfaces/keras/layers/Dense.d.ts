import * as syft from '../../../syft';
import { Layer } from './Layer';
export declare class _Dense implements Layer {
    ordered_syft: syft.Model[];
    syft_layer: syft.Model;
    units: number;
    input_shape?: number;
    output_shape?: number;
    activation?: syft.Tensor;
    activation_str?: string;
    syft_activation?: syft.Model;
    constructor(units: number, input_shape?: number, activation?: string);
    create(): Promise<this>;
}
export declare function Dense(units: number, input_shape?: number, activation?: string): _Dense;
