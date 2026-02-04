"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./prisma");
const client_1 = require("@prisma/client");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method === "OPTIONS") {
            return res.sendStatus(204);
        }
        return next();
    });
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.get("/bridges", async (req, res) => {
        try {
            const limit = Math.min(Number(req.query.limit) || 50, 200);
            const bridges = await prisma_1.prisma.bridge.findMany({
                take: limit,
                include: {
                    sourceChain: true,
                    destChain: true,
                    bridgeAssets: {
                        include: {
                            sourceAsset: true,
                            destAsset: true,
                        },
                    },
                },
            });
            res.json(bridges);
        }
        catch (error) {
            console.error("Error fetching bridges", error);
            res.status(500).json({ error: "Failed to fetch bridges" });
        }
    });
    app.get("/bridges/:id/status", async (req, res) => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid bridge id" });
        }
        try {
            const bridge = await prisma_1.prisma.bridge.findUnique({
                where: { id },
                include: {
                    sourceChain: true,
                    destChain: true,
                    bridgeAssets: {
                        include: {
                            sourceAsset: true,
                            destAsset: true,
                            snapshots: {
                                orderBy: { createdAt: "desc" },
                                take: 100, // provide enough history for charts
                            },
                        },
                    },
                },
            });
            if (!bridge) {
                return res.status(404).json({ error: "Bridge not found" });
            }
            return res.json(bridge);
        }
        catch (error) {
            console.error("Error fetching bridge status", error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                return res.status(500).json({ error: "Database error" });
            }
            return res.status(500).json({ error: "Failed to fetch bridge status" });
        }
    });
    app.get("/bridges/:id/anomalies", async (req, res) => {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid bridge id" });
        }
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const offset = Number(req.query.offset) || 0;
        const resolved = req.query.resolved === "true";
        try {
            const bridge = await prisma_1.prisma.bridge.findUnique({
                where: { id },
                include: {
                    bridgeAssets: {
                        include: {
                            anomalies: {
                                where: resolved ? { resolvedAt: { not: null } } : { resolvedAt: null },
                                orderBy: { createdAt: "desc" },
                                skip: offset,
                                take: limit,
                            },
                        },
                    },
                },
            });
            if (!bridge) {
                return res.status(404).json({ error: "Bridge not found" });
            }
            // Flatten anomalies from all bridge assets
            const anomalies = bridge.bridgeAssets.flatMap((ba) => ba.anomalies);
            return res.json({ bridgeId: id, anomalies });
        }
        catch (error) {
            console.error("Error fetching anomalies", error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                return res.status(500).json({ error: "Database error" });
            }
            return res.status(500).json({ error: "Failed to fetch anomalies" });
        }
    });
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map