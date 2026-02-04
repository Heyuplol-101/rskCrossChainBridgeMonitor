export type BridgeStatus = "green" | "yellow" | "red" | "unknown";
export interface StatusContext {
    yellowThreshold: number;
    redThreshold: number;
}
export interface StatusResult {
    status: BridgeStatus;
    deltaAbs: bigint;
    deltaRatio: number;
    deltaPercent: number;
}
export declare function computeStatus(locked: bigint, minted: bigint, ctx: StatusContext): StatusResult;
//# sourceMappingURL=status.d.ts.map