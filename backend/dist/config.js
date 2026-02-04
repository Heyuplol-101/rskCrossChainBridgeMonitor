"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function getEnv(name, options) {
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
exports.config = {
    PORT,
    DATABASE_URL: getEnv("DATABASE_URL", { required: true }),
    DIRECT_URL: getEnv("DIRECT_URL"),
    ROOTSTOCK_RPC_URL: getEnv("ROOTSTOCK_RPC_URL", { required: true }),
    ETHEREUM_RPC_URL: getEnv("ETHEREUM_RPC_URL", { required: true }),
    BITCOIN_API_URL: getEnv("BITCOIN_API_URL", { required: true }),
    MONITOR_POLL_INTERVAL_MS,
    BRIDGE_YELLOW_THRESHOLD,
    BRIDGE_RED_THRESHOLD,
};
//# sourceMappingURL=config.js.map