export declare class RRT {
    static members: RRT[];
    static penaltyFactor: number;
    id: string;
    reputation: number;
    jobDone: number;
    trusts: {
        [key: string]: number;
    };
    constructor();
    calcReputation(): number;
    calcRepore(a: RRT): number;
    doGood(a: RRT): this;
    doBad(a: RRT): this;
}
