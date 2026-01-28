import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });
dotenv.config();

const buildDatabaseUrl = (url?: string) => {
  if (!url) return url;
  const [base, query] = url.split("?");
  const params = new URLSearchParams(query ?? "");
  if (!params.has("connection_limit")) params.set("connection_limit", "5");
  if (!params.has("pool_timeout")) params.set("pool_timeout", "20");
  return `${base}?${params.toString()}`;
};

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: buildDatabaseUrl(process.env.DATABASE_URL)
    }
  }
});
