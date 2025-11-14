import { prisma } from "@gestao/database";
import type { NextFunction, Response } from "express";
import type { RequestWithUser } from "../types/http";

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
