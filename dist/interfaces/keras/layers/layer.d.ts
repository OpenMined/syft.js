import * as syft from '../../../syft';
export interface Layer {
    syft_layer: syft.Model;
    input_shape?: number;
    output_shape?: number;
    ordered_syft: syft.Model[];
    create(): Promise<this>;
}
