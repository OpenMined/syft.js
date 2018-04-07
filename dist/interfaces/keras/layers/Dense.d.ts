import * as syft from '../../../syft';
import { Layer } from './Layer';
export declare class Dense implements Layer {
    orderedSyft: syft.Model[];
    syftLayer?: syft.Model;
    inputShape?: number;
    outputShape: number;
    activationStr?: string;
    syftActivation?: syft.Model;
    constructor({activation, inputShape, outputShape}: {
        activation: string;
        inputShape?: number;
        outputShape: number;
    });
    compile(): Promise<this>;
}
