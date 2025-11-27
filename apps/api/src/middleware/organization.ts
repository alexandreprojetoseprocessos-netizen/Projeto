import { prisma } from "@gestao/database";
import type { NextFunction, Response, Request } from "express";
import type { RequestWithUser } from "../types/http";
import type { OrgRole } from "../services/permissions";
import { canDeleteOrganization, canManageOrganizationSettings } from "../services/permissions";

export const organizationMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const orgId = req.header("x-organization-id");
  if (!orgId) {
    return res.status(400).json({ message: "x-organization-id header is required" });
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

  return next();
};

export const attachOrgMembership = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id;
  const organizationId = req.params.organizationId || req.params.orgId || (req.body as any)?.organizationId;

  if (!userId || !organizationId) {
    return res.status(400).json({ message: "Organizacão não informada ou usuário não autenticado." });
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId, organizationId }
  });

  if (!membership) {
    return res.status(403).json({ message: "Você não participa desta organização." });
  }

  (req as any).organizationId = organizationId;
  (req as any).organizationRole = membership.role as OrgRole;

  return next();
};

export const requireCanManageOrgSettings = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).organizationRole as OrgRole | undefined;
  if (!role || !canManageOrganizationSettings(role)) {
    return res.status(403).json({ message: "Você não tem permissão para gerenciar esta organização." });
  }
  return next();
};

export const requireCanDeleteOrganization = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).organizationRole as OrgRole | undefined;
  if (!role || !canDeleteOrganization(role)) {
    return res.status(403).json({ message: "Você não tem permissão para excluir esta organização." });
  }
  return next();
};
