import { prisma } from "@gestao/database";
import type { NextFunction, Response } from "express";
import type { RequestWithUser } from "../types/http";
import type { OrgRole } from "../services/permissions";
import { canDeleteOrganization, canManageOrganizationSettings } from "../services/permissions";
import { normalizeUuid } from "../utils/uuid";

export const organizationMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const orgIdRaw = req.header("x-organization-id");
  if (!orgIdRaw?.trim()) {
    return res.status(400).json({ message: "x-organization-id header is required" });
  }

  const orgIdTrimmed = orgIdRaw.trim();
  if (orgIdTrimmed.toLowerCase() === "all") {
    return res.status(400).json({ message: "x-organization-id is invalid" });
  }

  const orgId = normalizeUuid(orgIdTrimmed);
  if (!orgId) {
    return res.status(400).json({ message: "x-organization-id is invalid" });
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: orgId,
      userId: req.user.id
    },
    include: {
      organization: true
    }
  });

  if (!membership) {
    return res.status(403).json({ message: "Access denied for this organization" });
  }

  req.organization = membership.organization;
  req.organizationMembership = membership;
  req.organizationId = membership.organizationId;
  req.organizationRole = membership.role as OrgRole;

  return next();
};

export const attachOrgMembership = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const organizationIdFromBody =
    req.body && typeof req.body === "object" && "organizationId" in req.body
      ? (req.body as { organizationId?: unknown }).organizationId
      : undefined;

  const organizationIdRaw = req.params.organizationId || req.params.orgId || organizationIdFromBody;
  const organizationIdTrimmed = typeof organizationIdRaw === "string" ? organizationIdRaw.trim() : "";

  if (!organizationIdTrimmed) {
    return res.status(400).json({ message: "Organização não informada." });
  }

  if (organizationIdTrimmed.toLowerCase() === "all") {
    return res.status(400).json({ message: "ID da organização inválido." });
  }

  const organizationId = normalizeUuid(organizationIdTrimmed);
  if (!organizationId) {
    return res.status(400).json({ message: "ID da organização inválido." });
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId, organizationId }
  });

  if (!membership) {
    return res.status(403).json({ message: "Você não participa desta organização." });
  }

  req.organizationId = organizationId;
  req.organizationRole = membership.role as OrgRole;

  return next();
};

export const requireCanManageOrgSettings = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const role = req.organizationRole;
  if (!role || !canManageOrganizationSettings(role)) {
    return res.status(403).json({ message: "Você não tem permissão para gerenciar esta organização." });
  }
  return next();
};

export const requireCanDeleteOrganization = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const role = req.organizationRole;
  if (!role || !canDeleteOrganization(role)) {
    return res.status(403).json({ message: "Você não tem permissão para excluir esta organização." });
  }
  return next();
};
