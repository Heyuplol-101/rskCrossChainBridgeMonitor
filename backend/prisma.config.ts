
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI uses this config; the actual directUrl is taken from schema.prisma
// (datasource db { url = env(\"DATABASE_URL\"), directUrl = env(\"DIRECT_URL\") }).
// Here we only need to point to DATABASE_URL so Prisma knows which datasource to use.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
