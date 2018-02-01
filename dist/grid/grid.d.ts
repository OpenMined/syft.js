export declare class Grid {
    jobId?: string;
    get(key: string): Promise<any>;
    configuration(model: any, lr: any, criterion: any, iters: any): Promise<GridConfiguration>;
    learn(input: any, target: any, configurations: any[], name?: any): Promise<void>;
    check_experiment_status(experiments: any[], status_widgets: any[]): Promise<void>;
    store_job(jobId: string, name?: string): Promise<void>;
    get_results(experiment?: any): Promise<ExperimentResults>;
}
export declare class ExperimentResults {
    results: any[];
    constructor(models: any[]);
}
export declare class GridConfiguration {
    model: any;
    lr: any;
    criterion: any;
    iters: any;
    name?: any;
    constructor(model: any, lr: any, criterion: any, iters: any, name?: any);
    toJSON(): {
        model: any;
        lr: any;
        criterion: any;
        iters: any;
    };
}
