import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export const createApp = () => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));

  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
  app.use(cors({
    origin: corsOrigin.split(",").map(o => o.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }));

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use(limiter);

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Minimal OpenAPI documentation endpoint for devrel and integrators
  app.get("/docs/openapi.json", (_req: Request, res: Response) => {
    // Lazy require to avoid bundling issues and keep it simple
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const spec = require("../docs/openapi.json");
    res.json(spec);
  });

  app.get("/bridges", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const bridges = await prisma.bridge.findMany({
        skip: offset,
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
    } catch (error) {
      logger.error("Error fetching bridges", error);
      res.status(500).json({ error: "Failed to fetch bridges" });
    }
  });

  app.get("/bridges/:id/status", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid bridge id" });
    }

    try {
      const bridge = await prisma.bridge.findUnique({
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
    } catch (error) {
      logger.error("Error fetching bridge status", error);
      if (error instanceof PrismaClientKnownRequestError) {
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(500).json({ error: "Failed to fetch bridge status" });
    }
  });

  app.get("/bridges/:id/anomalies", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid bridge id" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const resolved = req.query.resolved === "true";

    try {
      const bridge = await prisma.bridge.findUnique({
        where: { id },
        include: {
          bridgeAssets: {
            select: { id: true },
          },
        },
      });

      if (!bridge) {
        return res.status(404).json({ error: "Bridge not found" });
      }

      const bridgeAssetIds = bridge.bridgeAssets.map(ba => ba.id);

      const anomalies = await prisma.anomaly.findMany({
        where: {
          bridgeAssetId: { in: bridgeAssetIds },
          resolvedAt: resolved ? { not: null } : null,
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      });

      return res.json({ bridgeId: id, anomalies });
    } catch (error) {
      logger.error("Error fetching anomalies", error);
      if (error instanceof PrismaClientKnownRequestError) {
        return res.status(500).json({ error: "Database error" });
      }
      return res.status(500).json({ error: "Failed to fetch anomalies" });
    }
  });

  return app;
};



