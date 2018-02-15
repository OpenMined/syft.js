import * as syft from '../../../syft';
import { Layer } from '../layers';
import { Optimizer } from '../optimizers';
import { Model } from '.';
export declare class Sequential implements Model {
    syft_model?: syft.Sequential;
    loss?: syft.Model;
    optimizer?: Optimizer;
    layers: Layer[];
    metrics: string[];
    compiled: boolean;
    add(layer: Layer): Promise<void>;
    compile(loss: string, optimizer: Optimizer, metrics?: string[]): Promise<this>;
    summary(): Promise<void>;
    fit(x_train: syft.Tensor, y_train: syft.Tensor, batch_size: number, epochs?: number, validation_data?: null, log_interval?: number, verbose?: boolean): Promise<number>;
    evaluate(test_input: syft.Tensor, test_target: syft.Tensor, batch_size: number, metrics?: string[], verbose?: boolean): Promise<void>;
    predict(x: syft.Tensor): Promise<any>;
    get_weights(): Promise<syft.Tensor[]>;
    to_json(): Promise<void>;
}
