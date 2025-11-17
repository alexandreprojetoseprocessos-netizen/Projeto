import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import { logger } from "../config/logger";

export const templatesRouter = Router();

templatesRouter.use(authMiddleware);
templatesRouter.use(organizationMiddleware);

templatesRouter.get("/", async (req, res) => {
  if (!req.organization) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const templates = await prisma.projectTemplate.findMany({
    where: { organizationId: req.organization.id },
    orderBy: { updatedAt: "desc" }
  });

  return res.json({ templates });
});

templatesRouter.get("/:templateId", async (req, res) => {
  if (!req.organization) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const template = await prisma.projectTemplate.findFirst({
    where: { id: req.params.templateId, organizationId: req.organization.id }
  });

  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }

  return res.json({ template });
});

templatesRouter.put("/:templateId", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { templateId } = req.params;
  const payload = req.body ?? {};

  if (!payload.name || !payload.type) {
    return res.status(400).json({ message: "name e type são obrigatórios" });
  }

  try {
    const template = await prisma.projectTemplate.upsert({
      where: { id: templateId },
      update: {
        name: payload.name.trim(),
        type: payload.type.trim(),
        clientName: payload.clientName?.trim() || null,
        repositoryUrl: payload.repositoryUrl?.trim() || null,
        budget:
          typeof payload.budget === "number"
            ? new Prisma.Decimal(payload.budget)
            : typeof payload.budget === "string" && payload.budget.trim()
            ? new Prisma.Decimal(payload.budget)
            : null,
        columns: Array.isArray(payload.columns) ? payload.columns : [],
        wbs: Array.isArray(payload.wbs) ? payload.wbs : [],
        customFields: Array.isArray(payload.customFields) ? payload.customFields : []
      },
      create: {
        id: templateId,
        organizationId: req.organization.id,
        name: payload.name.trim(),
        type: payload.type.trim(),
        clientName: payload.clientName?.trim() || null,
        repositoryUrl: payload.repositoryUrl?.trim() || null,
        budget:
          typeof payload.budget === "number"
            ? new Prisma.Decimal(payload.budget)
            : typeof payload.budget === "string" && payload.budget.trim()
            ? new Prisma.Decimal(payload.budget)
            : null,
        columns: Array.isArray(payload.columns) ? payload.columns : [],
        wbs: Array.isArray(payload.wbs) ? payload.wbs : [],
        customFields: Array.isArray(payload.customFields) ? payload.customFields : []
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.organization.id,
        actorId: req.user.id,
        action: "TEMPLATE_SAVED",
        entity: "PROJECT_TEMPLATE",
        entityId: template.id,
        diff: payload
      }
    });

    logger.info({ templateId, payload }, "Template payload persisted");
    return res.json({ template });
  } catch (error) {
    logger.error({ err: error }, "Failed to persist template payload");
    return res.status(500).json({ message: "Failed to save template" });
  }
});
