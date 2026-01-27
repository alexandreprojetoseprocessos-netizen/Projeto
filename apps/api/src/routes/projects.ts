import { Router } from "express";
import { Prisma, ProjectRole, AttachmentTargetType, TaskStatus, ProjectStatus, TaskPriority } from "@prisma/client";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import { ensureProjectMembership } from "../services/rbac";
import { logger } from "../config/logger";
import { uploadAttachment, getPublicUrl } from "../services/storage";
import { recomputeProjectWbsCodes } from "../services/wbsCode";
import { canManageProjects } from "../services/permissions";
import { getActiveSubscriptionForUser } from "../services/subscriptions";
import { countProjectsForLimit } from "../services/planLimitCounts";
import { getProjectLimitForPlan } from "../services/subscriptionLimits";

type FlatWbsNode = {
  id: string;
  parentId: string | null;
  wbsCode?: string | null;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  priority?: string;
  order: number;
  level: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  ownerId: string | null;
  owner?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
  boardColumnId: string | null;
  estimateHours: string | null;
  progress: number | null;
  taskType?: string | null;
  storyPoints?: number | null;
  actualHours?: number;
  documents?: number;
  responsible?: {
    membershipId: string;
    userId: string;
    name: string;
  } | null;
  serviceCatalogId?: string | null;
  serviceMultiplier?: number | null;
  serviceHours?: number | null;
  dependencies: string[];
};

type WbsTreeNode = FlatWbsNode & { children: WbsTreeNode[] };

const normalizeProjectStatus = (value: unknown): ProjectStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (Object.values(ProjectStatus) as string[]).includes(normalized)
    ? (normalized as ProjectStatus)
    : null;
};

const normalizeProjectPriority = (value: unknown): TaskPriority | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (Object.values(TaskPriority) as string[]).includes(normalized)
    ? (normalized as TaskPriority)
    : null;
};

const buildWbsTree = (nodes: FlatWbsNode[]): WbsTreeNode[] => {
  const nodeMap = new Map<string, WbsTreeNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  const roots: WbsTreeNode[] = [];

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (items: WbsTreeNode[]) => {
    items.sort((a, b) => a.order - b.order);
    items.forEach((child) => sortChildren(child.children));
  };

  sortChildren(roots);
  return roots;
};

const subtractDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - amount);
  return result;
};

const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const DEFAULT_BOARD_COLUMNS: Array<{ label: string; status: TaskStatus; wipLimit?: number | null }> = [
  { label: "Backlog", status: TaskStatus.BACKLOG },
  { label: "Planejamento", status: TaskStatus.TODO },
  { label: "Em andamento", status: TaskStatus.IN_PROGRESS, wipLimit: 6 },
  { label: "Revis├úo", status: TaskStatus.REVIEW, wipLimit: 4 },
  { label: "Conclu├¡do", status: TaskStatus.DONE }
];

const ensureBoardColumns = async (projectId: string) => {
  const count = await prisma.boardColumn.count({ where: { projectId } });
  if (count > 0) return;
  await prisma.boardColumn.createMany({
    data: DEFAULT_BOARD_COLUMNS.map((column, index) => ({
      projectId,
      label: column.label,
      order: index,
      status: column.status,
      wipLimit: column.wipLimit ?? null
    }))
  });
};

export const projectsRouter = Router();

projectsRouter.use(authMiddleware);
projectsRouter.use(organizationMiddleware);

projectsRouter.get("/", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId: req.organization.id,
      members: {
        some: {
          userId: req.user.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      milestones: {
        select: {
          id: true
        }
      },
      wbsNodes: {
        select: { id: true }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return res.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      milestoneCount: project.milestones.length,
      wbsNodeCount: project.wbsNodes.length
    }))
  });
});

projectsRouter.get("/:projectId/members", async (req, res) => {
  const { projectId } = req.params;
  const userId = (req as any).user?.id as string | undefined;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: { organizationId: project.organizationId },
    include: { user: true },
    orderBy: {
      user: {
        fullName: "asc"
      }
    }
  });

  const members = memberships.map((membership) => ({
    id: membership.id,
    userId: membership.userId,
    name: membership.user.fullName ?? membership.user.email ?? membership.userId,
    email: membership.user.email,
    role: membership.role
  }));

  return res.json({ members });
});

projectsRouter.post("/", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const role = req.organizationMembership?.role as any;
  if (!canManageProjects(role)) {
    return res.status(403).json({ message: "Voc├¬ n├úo tem permiss├úo para criar projetos nesta organiza├º├úo." });
  }

  const { name, clientName, budget, repositoryUrl, startDate, endDate, description, teamMembers, status, priority } =
    req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Nome do projeto ├® obrigat├│rio." });
  }

  if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
    return res.status(400).json({ message: "Cliente respons├ível ├® obrigat├│rio." });
  }

  const normalizedStatus = normalizeProjectStatus(status);
  if (status && !normalizedStatus) {
    return res.status(400).json({ message: "Status do projeto invalido." });
  }

  const normalizedPriority = normalizeProjectPriority(priority);
  if (priority && !normalizedPriority) {
    return res.status(400).json({ message: "Prioridade do projeto invalida." });
  }

  const normalizedRepo = typeof repositoryUrl === "string" ? repositoryUrl.trim() : "";

  try {
    const subscription = await getActiveSubscriptionForUser(req.user.id);
    const maxProjects = getProjectLimitForPlan(subscription?.product?.code ?? null);
    const currentProjectsCount = await countProjectsForLimit(req.organization.id);

    if (maxProjects !== null && currentProjectsCount >= maxProjects) {
      return res.status(409).json({
        code: "PLAN_LIMIT_REACHED",
        message: "Limite de projetos do seu plano atingido."
      });
    }

    const project = await prisma.project.create({
      data: {
        organizationId: req.organization.id,
        managerId: req.user.id,
        name: name.trim(),
        clientName: clientName.trim(),
        description: typeof description === "string" ? description.trim() : null,
        status: normalizedStatus ?? undefined,
        priority: normalizedPriority ?? undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        repositoryUrl: normalizedRepo || undefined,
        budgetPlanned:
          typeof budget === "number"
            ? new Prisma.Decimal(budget)
            : typeof budget === "string" && budget.trim()
            ? new Prisma.Decimal(budget)
            : undefined
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        role: ProjectRole.MANAGER
      }
    });

    const invitedEmails = Array.isArray(teamMembers)
      ? teamMembers.filter((value: unknown): value is string => typeof value === "string").map((email) => email.trim().toLowerCase())
      : [];

    if (invitedEmails.length) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: invitedEmails
          }
        }
      });

      const membersData = users
        .filter((user) => user.id !== req.user!.id)
        .map((user) => ({
          projectId: project.id,
          userId: user.id,
          role: ProjectRole.CONTRIBUTOR
        }));

      if (membersData.length) {
        await prisma.projectMember.createMany({
          data: membersData,
          skipDuplicates: true
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        organizationId: req.organization.id,
        actorId: req.user.id,
        action: "PROJECT_CREATED",
        entity: "PROJECT",
        entityId: project.id,
        diff: {
          clientName,
          repositoryUrl: normalizedRepo || null,
          invitedMembers: invitedEmails
        }
      }
    });

    return res.status(201).json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        repositoryUrl: project.repositoryUrl,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to create project");
    return res.status(500).json({ message: "Failed to create project" });
  }
});

projectsRouter.patch("/:projectId/restore", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const role = req.organizationMembership?.role as any;
  if (!canManageProjects(role)) {
    return res.status(403).json({ message: "Você não tem permissão para restaurar projetos nesta organização." });
  }

  const { projectId } = req.params;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.organization.id }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.archivedAt) {
      const subscription = await getActiveSubscriptionForUser(req.user.id);
      const maxProjects = getProjectLimitForPlan(subscription?.product?.code ?? null);
      const currentProjectsCount = await countProjectsForLimit(req.organization.id);

      if (maxProjects !== null && currentProjectsCount >= maxProjects) {
        return res.status(409).json({
          code: "PLAN_LIMIT_REACHED",
          message: "Limite de projetos do seu plano atingido."
        });
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { archivedAt: null }
    });

    return res.json({
      project: {
        id: updated.id,
        name: updated.name,
        clientName: updated.clientName,
        repositoryUrl: updated.repositoryUrl,
        status: updated.status,
        startDate: updated.startDate,
        endDate: updated.endDate
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to restore project");
    return res.status(500).json({ message: "Failed to restore project" });
  }
});

projectsRouter.put("/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const membership = await ensureProjectMembership(req, res, projectId, [ProjectRole.MANAGER]);
  if (!membership) return;

  const { name, clientName, budget, repositoryUrl, startDate, endDate, description, status, priority } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Nome do projeto ├® obrigat├│rio." });
  }

  if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
    return res.status(400).json({ message: "Cliente respons├ível ├® obrigat├│rio." });
  }

  const normalizedStatus = normalizeProjectStatus(status);
  if (status && !normalizedStatus) {
    return res.status(400).json({ message: "Status do projeto invalido." });
  }

  const normalizedPriority = normalizeProjectPriority(priority);
  if (priority && !normalizedPriority) {
    return res.status(400).json({ message: "Prioridade do projeto invalida." });
  }

  const normalizedRepo = typeof repositoryUrl === "string" ? repositoryUrl.trim() : "";

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name.trim(),
        clientName: clientName.trim(),
        description: typeof description === "string" ? description.trim() : null,
        status: normalizedStatus ?? undefined,
        priority: normalizedPriority ?? undefined,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        repositoryUrl: normalizedRepo || null,
        budgetPlanned:
          typeof budget === "number"
            ? new Prisma.Decimal(budget)
            : typeof budget === "string" && budget.trim()
            ? new Prisma.Decimal(budget)
            : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: req.organization!.id,
        actorId: membership.userId,
        projectId: project.id,
        action: "PROJECT_UPDATED",
        entity: "PROJECT",
        entityId: project.id,
        diff: {
          name,
          clientName,
          repositoryUrl: normalizedRepo || null,
          status: normalizedStatus ?? undefined,
          priority: normalizedPriority ?? undefined
        }
      }
    });

    return res.json({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        repositoryUrl: project.repositoryUrl,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate
      }
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Project not found" });
    }
    logger.error({ err: error }, "Failed to update project");
    return res.status(500).json({ message: "Failed to update project" });
  }
});

projectsRouter.get("/:projectId/members", async (req, res) => {
  const { projectId } = req.params;

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: true
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return res.json({
    projectId,
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      capacityWeekly: member.capacityWeekly,
      name: member.user.fullName,
      email: member.user.email
    }))
  });
});

projectsRouter.get("/:projectId/summary", async (req, res) => {
  const { projectId } = req.params;
  const rangeDays = Number(req.query.rangeDays ?? "7");
  const now = new Date();
  const startRange = subtractDays(now, rangeDays);
  const lastFourteenDays = subtractDays(now, 14);

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    const [tasks, members, milestones, timeEntries] = await Promise.all([
      prisma.wbsNode.findMany({
        where: { projectId, type: { in: ["TASK", "SUBTASK"] } },
        select: {
          status: true,
          endDate: true,
          updatedAt: true
        }
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        select: { capacityWeekly: true }
      }),
      prisma.milestone.findMany({
        where: { projectId, dueDate: { gte: now } },
        orderBy: { dueDate: "asc" },
        take: 3
      }),
      prisma.timeEntry.findMany({
        where: { projectId, entryDate: { gte: lastFourteenDays } },
        orderBy: { entryDate: "asc" }
      })
    ]);

    const totals = tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        if (task.status === "DONE") acc.done += 1;
        if (task.status === "IN_PROGRESS") acc.inProgress += 1;
        if (task.status === "BLOCKED" || task.status === "DELAYED" || task.status === "RISK") acc.blocked += 1;
        if (task.status === "BACKLOG" || task.status === "TODO") acc.backlog += 1;
        return acc;
      },
      { total: 0, done: 0, inProgress: 0, blocked: 0, backlog: 0 }
    );

    const overdueTasks = tasks.filter(
      (task) => task.endDate && task.endDate < now && task.status !== "DONE"
    ).length;
    const velocity = tasks.filter(
      (task) => task.status === "DONE" && task.updatedAt >= startRange
    ).length;

    const capacity = members.reduce(
      (acc, member) => acc + (member.capacityWeekly ?? 0),
      0
    );

    const hoursTracked = timeEntries.reduce(
      (acc, entry) => acc + Number(entry.hours),
      0
    );

    const timeSeries = timeEntries.reduce<Record<string, number>>((acc, entry) => {
      const dateKey = entry.entryDate.toISOString().slice(0, 10);
      acc[dateKey] = (acc[dateKey] ?? 0) + Number(entry.hours);
      return acc;
    }, {});
    const timeSeriesArray = Object.entries(timeSeries).map(([date, hours]) => ({
      date,
      hours
    }));

    const burnDown = Array.from({ length: rangeDays }).map((_, index) => {
      const day = subtractDays(now, rangeDays - 1 - index);
      const completed = tasks.filter(
        (task) => task.status === "DONE" && task.updatedAt <= endOfDay(day)
      ).length;
      return {
        date: day.toISOString().slice(0, 10),
        done: completed,
        remaining: Math.max(0, totals.total - completed)
      };
    });

    return res.json({
      generatedAt: now,
      totals,
      overdueTasks,
      velocity: { doneLast7: velocity },
      capacity: {
        members: members.length,
        weeklyCapacity: capacity
      },
      hoursTracked,
      timeEntries: timeSeriesArray,
      burnDown,
      upcomingMilestones: milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        dueDate: milestone.dueDate,
        status: milestone.status
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load summary");
    return res.status(500).json({ message: "Failed to load summary" });
  }
});

projectsRouter.get("/:projectId/board", async (req, res) => {
  const { projectId } = req.params;

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    await ensureBoardColumns(projectId);
    const [columns, tasks] = await Promise.all([
      prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: [{ order: "asc" }]
      }),
      prisma.wbsNode.findMany({
        where: { projectId, boardColumnId: { not: null } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          boardColumnId: true,
          order: true
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      })
    ]);

    const groupedColumns = columns.map((column) => ({
      id: column.id,
      label: column.label,
      order: column.order,
      wipLimit: column.wipLimit,
      status: column.status,
      tasks: tasks
        .filter((task) => task.boardColumnId === column.id)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          boardColumnId: column.id,
          order: task.order
        }))
    }));

    return res.json({ projectId, columns: groupedColumns });
  } catch (error) {
    logger.error({ err: error }, "Failed to load board data");
    return res.status(500).json({ message: "Failed to load board data" });
  }
});

projectsRouter.post("/:projectId/board/tasks", async (req, res) => {
  const { projectId } = req.params;
  const { title, columnId, parentId, priority = "MEDIUM", estimateHours, startDate, endDate, ownerId } = req.body as {
    title?: string;
    columnId?: string;
    parentId?: string | null;
    priority?: string;
    estimateHours?: number | string;
    startDate?: string;
    endDate?: string;
    ownerId?: string | null;
  };

  if (!title || !columnId) {
    return res.status(400).json({ message: "title and columnId are required" });
  }

  const membership = await ensureProjectMembership(req, res, projectId, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!membership) return;

  const column = await prisma.boardColumn.findFirst({
    where: { id: columnId, projectId }
  });

  if (!column) {
    return res.status(404).json({ message: "Column not found for this project" });
  }

  let parentLevel = -1;
  if (parentId) {
    const parentNode = await prisma.wbsNode.findFirst({
      where: { id: parentId, projectId }
    });
    if (!parentNode) {
      return res.status(400).json({ message: "Parent not found in this project" });
    }
    parentLevel = parentNode.level;
  }

  const order = await prisma.wbsNode.count({
    where: { projectId, parentId: parentId ?? null }
  });

  if (ownerId) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: ownerId }
    });
    if (!member) {
      return res.status(400).json({ message: "Respons├ível informado n├úo pertence ao projeto" });
    }
  }

  try {
    const task = await prisma.wbsNode.create({
      data: {
        projectId,
        parentId: parentId ?? null,
        level: parentLevel + 1,
        order,
        title,
        type: "TASK",
        status: column.status ?? "TODO",
        priority: priority as any,
        boardColumnId: column.id,
        estimateHours: estimateHours
          ? new Prisma.Decimal(estimateHours)
          : undefined,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: ownerId ?? null
      }
    });

    return res.status(201).json({ task });
  } catch (error) {
    logger.error({ err: error }, "Failed to create board task");
    return res.status(500).json({ message: "Failed to create board task" });
  }
});

projectsRouter.patch("/:projectId/board/tasks/:taskId", async (req, res) => {
  const { projectId, taskId } = req.params;
  const { columnId, status, priority, order } = req.body as {
    columnId?: string;
    status?: string;
    priority?: string;
    order?: number;
  };

  const membership = await ensureProjectMembership(req, res, projectId, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!membership) return;

  const existingTask = await prisma.wbsNode.findFirst({
    where: { id: taskId, projectId }
  });

  if (!existingTask) {
    return res.status(404).json({ message: "Task not found" });
  }

  const targetColumnId = columnId ?? existingTask.boardColumnId;
  if (!targetColumnId) {
    return res.status(400).json({ message: "Column is required" });
  }

  const column = await prisma.boardColumn.findFirst({
    where: { id: targetColumnId, projectId }
  });

  if (!column) {
    return res.status(404).json({ message: "Column not found" });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (existingTask.boardColumnId && columnId && columnId !== existingTask.boardColumnId) {
        const oldSiblings = await tx.wbsNode.findMany({
          where: { projectId, boardColumnId: existingTask.boardColumnId },
          orderBy: [{ order: "asc" }]
        });
        const cleaned = oldSiblings.filter((task) => task.id !== taskId);
        await Promise.all(
          cleaned.map((task, index) =>
            tx.wbsNode.update({
              where: { id: task.id },
              data: { order: index }
            })
          )
        );
      }

      const siblings = await tx.wbsNode.findMany({
        where: { projectId, boardColumnId: targetColumnId },
        orderBy: [{ order: "asc" }]
      });

      const filtered = siblings.filter((task) => task.id !== taskId);
      const insertIndex =
        typeof order === "number"
          ? Math.max(0, Math.min(order, filtered.length))
          : filtered.length;
      filtered.splice(insertIndex, 0, { id: taskId } as any);

      await Promise.all(
        filtered.map((task, index) =>
          tx.wbsNode.update({
            where: { id: task.id },
            data: {
              order: index,
              ...(task.id === taskId
                ? {
                    boardColumnId: targetColumnId,
                    status: column.status ?? status ?? existingTask.status,
                    priority: priority ?? existingTask.priority
                  }
                : {})
            } as Prisma.WbsNodeUncheckedUpdateInput
          })
        )
      );

      return tx.wbsNode.findUnique({ where: { id: taskId } });
    });

    return res.json({ task: updated });
  } catch (error) {
    logger.error({ err: error }, "Failed to update board task");
    return res.status(500).json({ message: "Failed to update board task" });
  }
});

projectsRouter.get("/:projectId/wbs", async (req, res) => {
  const { projectId } = req.params;

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  const fetchNodes = () =>
    prisma.wbsNode.findMany({
      where: { projectId, deletedAt: null },
      include: {
        taskDetail: true,
        responsibleMembership: {
          include: {
            user: true
          }
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        timeEntries: {
          select: { hours: true }
        },
        attachments: {
          select: { id: true }
        },
        serviceCatalog: {
          select: {
            id: true,
            name: true,
            hoursBase: true
          }
        },
        dependenciesAsSuccessor: {
          select: { predecessorId: true }
        }
      },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { order: "asc" }, { createdAt: "asc" }]
    });

  let nodes = await fetchNodes();
  if (nodes.some((node) => !node.wbsCode)) {
    await recomputeProjectWbsCodes(projectId);
    nodes = await fetchNodes();
  }

  const formattedNodes: FlatWbsNode[] = nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    wbsCode: node.wbsCode ?? undefined,
    title: node.title,
    description: node.description ?? null,
    type: node.type,
    status: node.status,
    priority: node.priority,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    deletedAt: node.deletedAt,
    order: node.order,
    level: node.level,
    startDate: node.startDate,
    endDate: node.endDate,
    ownerId: node.ownerId,
    owner: node.owner
      ? {
          id: node.owner.id,
          name: node.owner.fullName ?? node.owner.email ?? "",
          email: node.owner.email
        }
      : null,
    boardColumnId: node.boardColumnId,
    estimateHours: node.estimateHours?.toString() ?? null,
    progress: node.progress ?? null,
    taskType: node.taskDetail?.taskType ?? null,
    storyPoints: node.taskDetail?.storyPoints ?? null,
    actualHours: node.timeEntries.reduce((acc, entry) => acc + Number(entry.hours), 0),
    documents: node.attachments.length,
    serviceCatalogId: node.serviceCatalogId ?? null,
    serviceMultiplier: node.serviceMultiplier ?? null,
    serviceHours: node.serviceHours ?? null,
    responsible: node.responsibleMembership
      ? {
          membershipId: node.responsibleMembership.id,
          userId: node.responsibleMembership.userId,
          name: node.responsibleMembership.user.fullName ?? node.responsibleMembership.user.email ?? ""
        }
      : null,
    dependencies: node.dependenciesAsSuccessor.map((dependency) => dependency.predecessorId)
  }));

  return res.json({
    projectId,
    nodes: buildWbsTree(formattedNodes)
  });
});

projectsRouter.post("/:projectId/wbs", async (req, res) => {
  const { projectId } = req.params;
  const {
    title,
    type = "TASK",
    parentId,
    status = "BACKLOG",
    priority = "MEDIUM",
    order,
    startDate,
    endDate,
    estimateHours,
    progress
  } = req.body as Record<string, any>;

  const membership = await ensureProjectMembership(req, res, projectId, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!membership) return;

  if (!title) {
    return res.status(400).json({ message: "title is required" });
  }

  let parentLevel = -1;
  if (parentId) {
    const parent = await prisma.wbsNode.findFirst({ where: { id: parentId, projectId } });
    if (!parent) {
      return res.status(400).json({ message: "Parent not found" });
    }
    parentLevel = parent.level;
  }

  const lastSibling = await prisma.wbsNode.findFirst({
    where: { projectId, parentId: parentId ?? null, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  const siblingsCount = await prisma.wbsNode.count({
    where: { projectId, parentId: parentId ?? null, deletedAt: null }
  });

  const nextSortOrder = (lastSibling?.sortOrder ?? 0) + 1000;

  try {
    const node = await prisma.wbsNode.create({
      data: {
        projectId,
        parentId: parentId ?? null,
        level: parentLevel + 1,
        order: typeof order === "number" ? order : siblingsCount,
        title,
        type,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        estimateHours: estimateHours ? new Prisma.Decimal(estimateHours) : undefined,
        progress,
        sortOrder: nextSortOrder
      }
    });

    await recomputeProjectWbsCodes(projectId);
    const refreshed = await prisma.wbsNode.findUnique({
      where: { id: node.id },
      include: {
        taskDetail: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        timeEntries: {
          select: { hours: true }
        },
        attachments: {
          select: { id: true }
        },
        dependenciesAsSuccessor: {
          select: { predecessorId: true }
        }
      }
    });

    if (!refreshed) {
      throw new Error("Failed to load created WBS node");
    }

    const formattedNode: FlatWbsNode = {
      id: refreshed.id,
      parentId: refreshed.parentId,
      wbsCode: refreshed.wbsCode ?? undefined,
      title: refreshed.title,
      type: refreshed.type,
      status: refreshed.status,
      priority: refreshed.priority,
      order: refreshed.order,
      level: refreshed.level,
      startDate: refreshed.startDate,
      endDate: refreshed.endDate,
      createdAt: refreshed.createdAt,
      updatedAt: refreshed.updatedAt,
      deletedAt: refreshed.deletedAt,
      ownerId: refreshed.ownerId,
      owner: refreshed.owner
        ? {
            id: refreshed.owner.id,
            name: refreshed.owner.fullName ?? refreshed.owner.email ?? "",
            email: refreshed.owner.email
          }
        : null,
      boardColumnId: refreshed.boardColumnId,
      estimateHours: refreshed.estimateHours?.toString() ?? null,
      progress: refreshed.progress ?? null,
      taskType: refreshed.taskDetail?.taskType ?? null,
      storyPoints: refreshed.taskDetail?.storyPoints ?? null,
      actualHours: refreshed.timeEntries.reduce((acc, entry) => acc + Number(entry.hours), 0),
      documents: refreshed.attachments.length,
      dependencies: refreshed.dependenciesAsSuccessor.map((dependency) => dependency.predecessorId)
    };

    return res.status(201).json({ node: formattedNode });
  } catch (error) {
    logger.error({ err: error }, "Failed to create WBS node");
    return res.status(500).json({ message: "Failed to create WBS node" });
  }
});

projectsRouter.get("/:projectId/gantt", async (req, res) => {
  const { projectId } = req.params;

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    const [tasks, milestones] = await Promise.all([
      prisma.wbsNode.findMany({
        where: { projectId, type: { in: ["TASK", "SUBTASK"] } },
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          startDate: true,
          endDate: true,
          dependenciesAsSuccessor: {
            select: { predecessorId: true }
          }
        },
        orderBy: [{ startDate: "asc" }]
      }),
      prisma.milestone.findMany({
        where: { projectId },
        select: { id: true, name: true, dueDate: true, status: true },
        orderBy: [{ dueDate: "asc" }]
      })
    ]);

    return res.json({
      projectId,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        type: task.type,
        startDate: task.startDate,
        endDate: task.endDate,
        dependencies: task.dependenciesAsSuccessor.map((dep) => dep.predecessorId)
      })),
      milestones
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load Gantt data");
    return res.status(500).json({ message: "Failed to load Gantt data" });
  }
});

projectsRouter.get("/:projectId/attachments", async (req, res) => {
  const { projectId } = req.params;

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    const attachments = await prisma.attachment.findMany({
      where: { projectId },
      select: {
        id: true,
        fileName: true,
        fileKey: true,
        fileSize: true,
        category: true,
        createdAt: true,
        targetType: true,
        wbsNodeId: true,
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      projectId,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        fileKey: attachment.fileKey,
        fileSize: attachment.fileSize,
        category: attachment.category,
        createdAt: attachment.createdAt,
        targetType: attachment.targetType,
        wbsNodeId: attachment.wbsNodeId,
        uploadedBy: attachment.uploadedBy,
        fileUrl: getPublicUrl(attachment.fileKey)
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load attachments");
    return res.status(500).json({ message: "Failed to load attachments" });
  }
});

projectsRouter.post("/:projectId/attachments", async (req, res) => {
  const { projectId } = req.params;
  const { fileName, contentType, fileBase64, targetType, wbsNodeId, category } = req.body ?? {};
  const allowedTargetTypes = new Set(Object.values(AttachmentTargetType));

  if (!fileName || !contentType || !fileBase64) {
    return res.status(400).json({ message: "fileName, contentType e fileBase64 s├úo obrigat├│rios" });
  }

  const membership = await ensureProjectMembership(req, res, projectId, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!membership) return;
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const base64Payload = fileBase64.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Payload, "base64");
    if (!buffer.length) {
      return res.status(400).json({ message: "Arquivo inv├ílido" });
    }

    if (wbsNodeId) {
      const node = await prisma.wbsNode.findFirst({ where: { id: wbsNodeId, projectId } });
      if (!node) {
        return res.status(400).json({ message: "O item de WBS informado n├úo pertence ao projeto" });
      }
    }

    const upload = await uploadAttachment({
      data: buffer,
      fileName,
      contentType
    });

    const resolvedTargetType = allowedTargetTypes.has(targetType as AttachmentTargetType)
      ? (targetType as AttachmentTargetType)
      : AttachmentTargetType.PROJECT;

    const attachment = await prisma.attachment.create({
      data: {
        projectId,
        targetType: resolvedTargetType,
        wbsNodeId: wbsNodeId ?? null,
        uploadedById: req.user!.id,
        fileKey: upload.fileKey,
        fileName: fileName.trim(),
        fileSize: buffer.length,
        category: typeof category === "string" && category.trim() ? category.trim() : null
      }
    });

    return res.status(201).json({
      attachment: {
        ...attachment,
        fileUrl: upload.publicUrl
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to upload attachment");
    return res.status(500).json({ message: "Falha ao salvar anexo" });
  }
});
