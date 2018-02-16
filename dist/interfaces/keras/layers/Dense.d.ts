import * as syft from '../../../syft';
import { Layer } from './Layer';
export declare class Dense implements Layer {
    ordered_syft: syft.Model[];
    syft_layer?: syft.Model;
    units?: number;
    input_shape?: number;
    output_shape?: number;
    activation?: syft.Tensor;
    activation_str?: string;
    syft_activation?: syft.Model;
    constructor(activation: string, units: number, input_shape?: number);
    create(): Promise<this>;
}
