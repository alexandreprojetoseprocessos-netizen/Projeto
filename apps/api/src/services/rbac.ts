import { ProjectRole } from "@prisma/client";
import { prisma } from "@gestao/database";
import type { Response } from "express";
import type { RequestWithUser } from "../types/http";
import { normalizeUuid } from "../utils/uuid";

export const ensureProjectMembership = async (
  req: RequestWithUser,
  res: Response,
  projectId: string,
  allowedRoles?: ProjectRole[]
) => {
  if (!req.organization || !req.user) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }
  const normalizedProjectId = normalizeUuid(projectId);
  if (!normalizedProjectId) {
    res.status(400).json({ message: "projectId is invalid" });
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: normalizedProjectId },
    select: { organizationId: true }
  });

  if (!project || project.organizationId !== req.organization.id) {
    res.status(404).json({ message: "Project not found" });
    return null;
  }

  const member = await prisma.projectMember.findFirst({
    where: {
      projectId: normalizedProjectId,
      userId: req.user.id
    }
  });

  if (!member) {
    res.status(403).json({ message: "You do not belong to this project" });
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(member.role)) {
    res.status(403).json({ message: "Insufficient role for this action" });
    return null;
  }

  return member;
};
