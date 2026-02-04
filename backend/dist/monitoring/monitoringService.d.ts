import { PrismaClient } from "@prisma/client";
import { StatusContext } from "./status";
export declare class MonitoringService {
    private prisma;
    private statusContext;
    constructor(prisma: PrismaClient, statusContext: StatusContext);
    private pow10;
    /**
     * Lightweight retry helper for external RPC / HTTP calls.
     * Prevents transient failures (e.g. provider hiccups) from causing data loss for a cycle.
     */
    private withRetries;
    runOnce(): Promise<void>;
}
//# sourceMappingURL=monitoringService.d.ts.map