import { config } from "./config";
import { createApp } from "./app";
import { prisma } from "./prisma";
import { MonitoringService } from "./monitoring/monitoringService";
import { StatusContext } from "./monitoring/status";

const app = createApp();

const statusContext: StatusContext = {
  yellowThreshold: config.BRIDGE_YELLOW_THRESHOLD, // Default 5%
  redThreshold: config.BRIDGE_RED_THRESHOLD, // Default 10%
};

const monitoringService = new MonitoringService(prisma, statusContext);

let monitoringInterval: NodeJS.Timeout | null = null;

async function start() {
  const server = app.listen(config.PORT, () => {
    console.log(`Backend server listening on port ${config.PORT}`);
  });

  // kick off initial monitoring tick and schedule periodic polling
  try {
    await monitoringService.runOnce();
  } catch (err) {
    console.error("Initial monitoring run failed", err);
  }

  monitoringInterval = setInterval(() => {
    monitoringService
      .runOnce()
      .catch((err) => console.error("Monitoring tick failed", err));
  }, config.MONITOR_POLL_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    server.close(async () => {
      console.log("HTTP server closed");
      await prisma.$disconnect();
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


