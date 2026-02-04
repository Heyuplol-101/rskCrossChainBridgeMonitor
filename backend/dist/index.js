"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const prisma_1 = require("./prisma");
const monitoringService_1 = require("./monitoring/monitoringService");
const app = (0, app_1.createApp)();
const statusContext = {
    yellowThreshold: config_1.config.BRIDGE_YELLOW_THRESHOLD, // Default 5%
    redThreshold: config_1.config.BRIDGE_RED_THRESHOLD, // Default 10%
};
const monitoringService = new monitoringService_1.MonitoringService(prisma_1.prisma, statusContext);
let monitoringInterval = null;
async function start() {
    const server = app.listen(config_1.config.PORT, () => {
        console.log(`Backend server listening on port ${config_1.config.PORT}`);
    });
    // kick off initial monitoring tick and schedule periodic polling
    try {
        await monitoringService.runOnce();
    }
    catch (err) {
        console.error("Initial monitoring run failed", err);
    }
    monitoringInterval = setInterval(() => {
        monitoringService
            .runOnce()
            .catch((err) => console.error("Monitoring tick failed", err));
    }, config_1.config.MONITOR_POLL_INTERVAL_MS);
    // Graceful shutdown
    const shutdown = async () => {
        console.log("Shutting down gracefully...");
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
        }
        server.close(async () => {
            console.log("HTTP server closed");
            await prisma_1.prisma.$disconnect();
            console.log("Database disconnected");
            process.exit(0);
        });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}
start().catch((err) => {
    console.error("Failed to start application", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map