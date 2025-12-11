import { Router, type Response } from "express";
import { Prisma, ProjectRole } from "@prisma/client";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import type { RequestWithUser } from "../types/http";
import { sendSlackMessage } from "../services/integrations";
import { recomputeProjectWbsCodes } from "../services/wbsCode";
import { DependencyValidationError, enforceDependencyDates, setNodeDependencies } from "../services/wbsDependencies";

export const wbsRouter = Router();

wbsRouter.use(authMiddleware);
wbsRouter.use(organizationMiddleware);

const assertNodeAccess = async (
  req: RequestWithUser,
  res: Response,
  nodeId: string,
  roles?: ProjectRole[]
) => {
  if (!req.user || !req.organization) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }

  const node = await prisma.wbsNode.findUnique({
    where: { id: nodeId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          organizationId: true
        }
      }
    }
  });

  if (!node || node.project.organizationId !== req.organization.id) {
    res.status(404).json({ message: "Node not found" });
    return null;
  }

  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId: node.projectId,
      userId: req.user.id
    }
  });

  if (!membership) {
    res.status(403).json({ message: "Access denied for this project" });
    return null;
  }

  if (roles && !roles.includes(membership.role)) {
    res.status(403).json({ message: "Insufficient role" });
    return null;
  }

  return { node, membership };
};

wbsRouter.get("/:nodeId/comments", async (req, res) => {
  const { nodeId } = req.params;

  const access = await assertNodeAccess(req, res, nodeId);
  if (!access) return;

  try {
    const comments = await prisma.wbsComment.findMany({
      where: { wbsNodeId: nodeId },
      orderBy: { createdAt: "asc" }
    });
    return res.json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar comentários" });
  }
});

wbsRouter.post("/:nodeId/comments", async (req: RequestWithUser, res) => {
  const { nodeId } = req.params;
  const { message, authorName, authorId } = req.body as {
    message?: string;
    authorName?: string;
    authorId?: string;
  };

  const access = await assertNodeAccess(req, res, nodeId);
  if (!access) return;

  const trimmed = message?.trim();
  if (!trimmed) {
    return res.status(400).json({ message: "Mensagem é obrigatória" });
  }

  try {
    const comment = await prisma.wbsComment.create({
      data: {
        wbsNodeId: nodeId,
        message: trimmed,
        authorName: authorName ?? req.user?.fullName ?? null,
        authorId: authorId ?? req.user?.id ?? null
      }
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar comentário" });
  }
});

wbsRouter.patch("/:nodeId", async (req, res) => {
  const { nodeId } = req.params;
  const {
    title,
    status,
    priority,
    parentId,
    startDate,
    endDate,
    order,
    progress,
    estimateHours,
    boardColumnId,
    dependencies,
    serviceCatalogId,
    serviceMultiplier
  } = req.body as Record<string, any>;

  const access = await assertNodeAccess(req, res, nodeId, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!access) return;

  if (dependencies !== undefined && !Array.isArray(dependencies)) {
    return res.status(400).json({ message: "dependencies must be an array" });
  }

  const data: Prisma.WbsNodeUncheckedUpdateInput = {};
  if (title !== undefined) data.title = title;
  if (status !== undefined) {
    const allowedStatuses = Prisma?.TaskStatus ? Object.values(Prisma.TaskStatus) : [];
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status value. Expected one of: ${allowedStatuses.join(", ")}` });
    }
    data.status = status as Prisma.TaskStatus;
  }
  if (priority !== undefined) data.priority = priority;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (order !== undefined) data.order = order;
  if (progress !== undefined) data.progress = progress;
  if (estimateHours !== undefined) data.estimateHours = estimateHours ? new Prisma.Decimal(estimateHours) : null;
  if (boardColumnId !== undefined) data.boardColumnId = boardColumnId;
  if (serviceCatalogId !== undefined || serviceMultiplier !== undefined) {
    if (!serviceCatalogId) {
      data.serviceCatalogId = null;
      data.serviceMultiplier = serviceMultiplier !== undefined ? Number(serviceMultiplier) || null : null;
      data.serviceHours = null;
    } else {
      const catalog = await prisma.serviceCatalog.findFirst({
        where: { id: serviceCatalogId, projectId: access.node.projectId }
      });
      if (!catalog) {
        return res.status(400).json({ message: "Catálogo de serviço não encontrado para este projeto" });
      }
      const multiplierValue =
        serviceMultiplier !== undefined && serviceMultiplier !== null
          ? Number(serviceMultiplier)
          : null;
      const multiplier = multiplierValue && !Number.isNaN(multiplierValue) ? multiplierValue : 1;
      data.serviceCatalogId = serviceCatalogId;
      data.serviceMultiplier = multiplier;
      data.serviceHours = catalog.hoursBase * multiplier;
    }
  }

  if (parentId !== undefined) {
    if (!parentId) {
      data.parentId = null;
      data.level = 0;
    } else {
      const parent = await prisma.wbsNode.findFirst({
        where: { id: parentId, projectId: access.node.projectId }
      });
      if (!parent) {
        return res.status(400).json({ message: "Parent not found" });
      }
      data.parentId = parentId;
      data.level = parent.level + 1;
    }
  }

  const node = await prisma.wbsNode.update({
    where: { id: nodeId },
    data
  });

  let dependenciesChanged = false;
  if (dependencies !== undefined) {
    const dependencyIds = dependencies.map((value: string) => String(value));
    try {
      dependenciesChanged = await setNodeDependencies(access.node.projectId, nodeId, dependencyIds);
    } catch (error) {
      if (error instanceof DependencyValidationError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  }

  await recomputeProjectWbsCodes(access.node.projectId);
  if (dependenciesChanged || startDate !== undefined || endDate !== undefined) {
    await enforceDependencyDates(access.node.projectId, [nodeId]);
  }
  const refreshed = await prisma.wbsNode.findUnique({ where: { id: nodeId } });

  return res.json({ node: refreshed ?? node });
});

wbsRouter.patch("/:nodeId/responsible", async (req, res) => {
  const { nodeId } = req.params;
  const { membershipId } = req.body as { membershipId?: string | null };

  const access = await assertNodeAccess(req as RequestWithUser, res, nodeId, [
    ProjectRole.MANAGER,
    ProjectRole.CONTRIBUTOR
  ]);
  if (!access) return;

  const updated = await prisma.wbsNode.update({
    where: { id: nodeId },
    data: {
      responsibleMembershipId: membershipId || null
    },
    include: {
      responsibleMembership: {
        include: { user: true }
      }
    }
  });

  return res.json({
    id: updated.id,
    responsible: updated.responsibleMembership
      ? {
          membershipId: updated.responsibleMembership.id,
          userId: updated.responsibleMembership.userId,
          name: updated.responsibleMembership.user.fullName ?? updated.responsibleMembership.user.email ?? ""
        }
      : null
  });
});

wbsRouter.post("/:nodeId/time-entries", async (req: RequestWithUser, res) => {
  const { nodeId } = req.params;
  const { hours, entryDate, description } = req.body as {
    hours?: number | string;
    entryDate?: string;
    description?: string;
  };

  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!hours || !entryDate) {
    return res.status(400).json({ message: "hours and entryDate are required" });
  }

  const access = await assertNodeAccess(req, res, nodeId);
  if (!access) return;

  const timeEntry = await prisma.timeEntry.create({
    data: {
      projectId: access.node.projectId,
      wbsNodeId: nodeId,
      userId: req.user.id,
      entryDate: new Date(entryDate),
      hours: new Prisma.Decimal(hours),
      description
    }
  });

  await sendSlackMessage({
    text: `${req.user.name ?? req.user.email} registrou ${hours}h no item ${nodeId}`
  });

  return res.status(201).json({ timeEntry });
});
