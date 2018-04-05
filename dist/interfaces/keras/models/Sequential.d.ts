import * as syft from '../../../syft';
import { Layer } from '../layers';
import { Optimizer } from '../optimizers';
import { Model } from '.';
export declare class Sequential implements Model {
    syftModel?: syft.Sequential;
    loss?: syft.Model;
    optimizer?: Optimizer;
    layers: Layer[];
    metrics: string[];
    compiled: boolean;
    constructor(layers?: Layer[]);
    add(layer: Layer): Promise<this>;
    compile({loss, optimizer, metrics}: {
        loss: string;
        optimizer: Optimizer;
        metrics?: string[];
    }): Promise<this>;
    summary(): Promise<void>;
    fit({input, target, batchSize, epochs, validationData, logInterval, verbose}: {
        input: syft.Tensor;
        target: syft.Tensor;
        batchSize: number;
        epochs?: number;
        validationData?: any;
        logInterval?: number;
        verbose?: boolean;
    }): Promise<number>;
    evaluate({testInput, testTarget, batchSize, metrics, verbose}: {
        testInput: syft.Tensor;
        testTarget: syft.Tensor;
        batchSize: number;
        metrics?: string[];
        verbose?: boolean;
    }): Promise<void>;
    predict(x: syft.Tensor): Promise<any>;
    getWeights(): Promise<syft.Tensor[]>;
    getJSON(): Promise<void>;
}
