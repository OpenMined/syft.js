import * as syft from '../../../syft';
export interface Layer {
    syftLayer?: syft.Model;
    inputShape?: number;
    outputShape?: number;
    orderedSyft: syft.Model[];
    compile(): Promise<this>;
}
