import { Router } from "express";
import { prisma } from "@gestao/database";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", error: (error as Error).message });
  }
});
