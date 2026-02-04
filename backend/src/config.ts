import * as dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, options?: { required?: boolean }): string | undefined {
  const value = process.env[name];
  if (options?.required && (!value || value.trim() === "")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const PORT = Number(getEnv("PORT") ?? 4000);

if (Number.isNaN(PORT)) {
  throw new Error("PORT must be a valid number");
}

const MONITOR_POLL_INTERVAL_MS_RAW = getEnv("MONITOR_POLL_INTERVAL_MS") ?? "60000";
const MONITOR_POLL_INTERVAL_MS = Number(MONITOR_POLL_INTERVAL_MS_RAW);

if (Number.isNaN(MONITOR_POLL_INTERVAL_MS)) {
  throw new Error("MONITOR_POLL_INTERVAL_MS must be a valid number");
}

// Bridge monitoring thresholds (default: yellow 5%, red 10%)
const BRIDGE_YELLOW_THRESHOLD = Number(getEnv("BRIDGE_YELLOW_THRESHOLD") ?? "0.05");
const BRIDGE_RED_THRESHOLD = Number(getEnv("BRIDGE_RED_THRESHOLD") ?? "0.10");

if (Number.isNaN(BRIDGE_YELLOW_THRESHOLD) || Number.isNaN(BRIDGE_RED_THRESHOLD)) {
  throw new Error("BRIDGE_YELLOW_THRESHOLD and BRIDGE_RED_THRESHOLD must be valid numbers");
}

export const config = {
  PORT,
  DATABASE_URL: getEnv("DATABASE_URL", { required: true }) as string,
  DIRECT_URL: getEnv("DIRECT_URL"),
  ROOTSTOCK_RPC_URL: getEnv("ROOTSTOCK_RPC_URL", { required: true }) as string,
  ETHEREUM_RPC_URL: getEnv("ETHEREUM_RPC_URL", { required: true }) as string,
  BITCOIN_API_URL: getEnv("BITCOIN_API_URL", { required: true }) as string,
  MONITOR_POLL_INTERVAL_MS,
  BRIDGE_YELLOW_THRESHOLD,
  BRIDGE_RED_THRESHOLD,
};


