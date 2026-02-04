"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStatus = computeStatus;
function computeStatus(locked, minted, ctx) {
    // Absolute difference between locked and minted
    const deltaAbs = locked > minted ? locked - minted : minted - locked;
    // Use locked as the reference base; avoid division by zero
    const base = locked === 0n ? 1n : locked;
    // Avoid precision loss by keeping the computation in bigint space as long as possible.
    // We scale by 10_000 to keep two decimal places in the final percentage.
    const SCALE = 10000n; // 100.00% = 10000
    const ratioScaled = (deltaAbs * SCALE) / base; // integer, scaled
    const deltaRatio = Number(ratioScaled) / Number(SCALE);
    const deltaPercent = deltaRatio * 100;
    let status = "green";
    if (deltaRatio >= ctx.redThreshold) {
        status = "red";
    }
    else if (deltaRatio >= ctx.yellowThreshold) {
        status = "yellow";
    }
    return { status, deltaAbs, deltaRatio, deltaPercent };
}
//# sourceMappingURL=status.js.map