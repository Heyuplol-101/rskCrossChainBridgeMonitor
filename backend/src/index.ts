import { config } from "./config";
import { createApp } from "./app";
import { prisma } from "./prisma";
import { MonitoringService } from "./monitoring/monitoringService";
import { StatusContext } from "./monitoring/status";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const app = createApp();

const statusContext: StatusContext = {
  yellowThreshold: config.BRIDGE_YELLOW_THRESHOLD, // Default 5%
  redThreshold: config.BRIDGE_RED_THRESHOLD, // Default 10%
};

const monitoringService = new MonitoringService(prisma, statusContext);

let monitoringInterval: NodeJS.Timeout | null = null;

async function start() {
  const server = app.listen(config.PORT, () => {
    logger.info(`Backend server listening on port ${config.PORT}`);
  });

  // kick off initial monitoring tick and schedule periodic polling
  try {
    await monitoringService.runOnce();
  } catch (err) {
    logger.error("Initial monitoring run failed", err);
  }

  monitoringInterval = setInterval(() => {
    monitoringService
      .runOnce()
      .catch((err) => logger.error("Monitoring tick failed", err));
  }, config.MONITOR_POLL_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    server.close(async () => {
      logger.info("HTTP server closed");
      await prisma.$disconnect();
      logger.info("Database disconnected");
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


