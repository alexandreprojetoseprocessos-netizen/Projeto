import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import { logger } from "../config/logger";

export const templatesRouter = Router();

templatesRouter.use(authMiddleware);
templatesRouter.use(organizationMiddleware);

templatesRouter.put("/:templateId", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { templateId } = req.params;
  const payload = req.body ?? {};

  try {
    await prisma.auditLog.create({
      data: {
        organizationId: req.organization.id,
        actorId: req.user.id,
        action: "TEMPLATE_SAVED",
        entity: "PROJECT_TEMPLATE",
        entityId: templateId,
        diff: payload
      }
    });

    logger.info({ templateId, payload }, "Template payload received");
    return res.json({ templateId, saved: true });
  } catch (error) {
    logger.error({ err: error }, "Failed to persist template payload");
    return res.status(500).json({ message: "Failed to save template" });
  }
});
