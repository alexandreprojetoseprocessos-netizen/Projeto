import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";

export const reportsRouter = Router();

reportsRouter.use(authMiddleware);
reportsRouter.use(organizationMiddleware);

const sanitizeCsvValue = (value: string | number) => {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const normalizeTaskStatusKey = (value?: string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ");

const resolveTaskStatus = (value?: string | null) => {
  const key = normalizeTaskStatusKey(value);
  if (!key) return "BACKLOG";
  if (["done", "finalizado", "finalizada", "concluido", "concluida", "completed", "finished"].includes(key)) {
    return "DONE";
  }
  if (["in progress", "em andamento", "andamento", "fazendo", "doing", "em progresso", "progresso"].includes(key)) {
    return "IN_PROGRESS";
  }
  if (["delayed", "em atraso", "atrasado", "atrasada", "late", "overdue"].includes(key)) {
    return "DELAYED";
  }
  if (["risk", "em risco", "risco"].includes(key)) {
    return "RISK";
  }
  if (["blocked", "bloqueado", "bloqueada"].includes(key)) {
    return "BLOCKED";
  }
  if (["review", "revisao", "homologacao"].includes(key)) {
    return "REVIEW";
  }
  if (["todo", "a fazer", "afazer", "planejado", "planejamento"].includes(key)) {
    return "TODO";
  }
  if (["backlog", "nao iniciado", "não iniciado"].includes(key)) {
    return "BACKLOG";
  }
  return key.toUpperCase().replace(/ /g, "_");
};

reportsRouter.get("/portfolio", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const projects = await prisma.project.findMany({
    where: {
      organizationId: req.organization.id,
      archivedAt: null,
      members: {
        some: {
          userId: req.user.id
        }
      }
    },
    select: {
      id: true,
      code: true,
      name: true,
      clientName: true,
      description: true,
      status: true,
      priority: true,
      startDate: true,
      endDate: true,
      manager: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      wbsNodes: {
        where: { type: { in: ["TASK", "SUBTASK"] } },
        select: {
          status: true,
          tags: {
            select: {
              tag: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      },
      risks: {
        select: { status: true }
      },
      timeEntries: {
        select: { hours: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const rows = projects.map((project) => {
    const tasksTotal = project.wbsNodes.length;
    const tasksDone = project.wbsNodes.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
    const tasksInProgress = project.wbsNodes.filter((node) => resolveTaskStatus(node.status) === "IN_PROGRESS").length;
    const risksOpen = project.risks.filter((risk) => risk.status !== "CLOSED").length;
    const hoursTracked = project.timeEntries.reduce((acc, entry) => acc + Number(entry.hours), 0);

    const tags = Array.from(
      new Set(
        project.wbsNodes.flatMap((node) => node.tags?.map((assignment) => assignment.tag?.name).filter(Boolean) ?? [])
      )
    );

    return {
      projectId: project.id,
      code: project.code,
      projectName: project.name,
      description: project.description ?? null,
      status: project.status,
      priority: project.priority,
      clientName: project.clientName,
      responsibleName: project.manager?.fullName,
      responsibleEmail: project.manager?.email,
      startDate: project.startDate,
      endDate: project.endDate,
      tags,
      tasksTotal,
      tasksDone,
      tasksInProgress,
      risksOpen,
      hoursTracked
    };
  });

  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    const header = [
      "projectId",
      "projectName",
      "code",
      "clientName",
      "responsibleName",
      "responsibleEmail",
      "startDate",
      "endDate",
      "tags",
      "status",
      "priority",
      "tasksTotal",
      "tasksDone",
      "tasksInProgress",
      "risksOpen",
      "hoursTracked"
    ];
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          sanitizeCsvValue(row.projectId),
          sanitizeCsvValue(row.projectName),
          sanitizeCsvValue(row.code ?? ""),
          sanitizeCsvValue(row.clientName ?? ""),
          sanitizeCsvValue(row.responsibleName ?? ""),
          sanitizeCsvValue(row.responsibleEmail ?? ""),
          sanitizeCsvValue(row.startDate ? row.startDate.toISOString() : ""),
          sanitizeCsvValue(row.endDate ? row.endDate.toISOString() : ""),
          sanitizeCsvValue(row.tags?.join("|") ?? ""),
          sanitizeCsvValue(row.status),
          sanitizeCsvValue(row.priority ?? ""),
          row.tasksTotal,
          row.tasksDone,
          row.tasksInProgress,
          row.risksOpen,
          row.hoursTracked
        ].join(",")
      )
    ].join("\n");
    return res.send(csv);
  }

  return res.json({
    generatedAt: new Date(),
    projects: rows
  });
});

reportsRouter.get("/metrics", async (req, res) => {
  if (!req.organization || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const range = Number(req.query.range ?? "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  const projects = await prisma.project.findMany({
    where: {
      organizationId: req.organization.id,
      members: {
        some: { userId: req.user.id }
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      timeEntries: {
        where: { entryDate: { gte: startDate } },
        select: { hours: true, projectId: true }
      },
      risks: {
        select: { status: true }
      },
      wbsNodes: {
        where: { type: { in: ["TASK", "SUBTASK"] } },
        select: { status: true }
      }
    }
  });

  const byStatus = projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] ?? 0) + 1;
    return acc;
  }, {});

  const riskSummary = projects.reduce(
    (acc, project) => {
      acc.open += project.risks.filter((risk) => risk.status !== "CLOSED").length;
      acc.closed += project.risks.filter((risk) => risk.status === "CLOSED").length;
      return acc;
    },
    { open: 0, closed: 0 }
  );

  const hoursByProject = projects.map((project) => ({
    projectId: project.id,
    projectName: project.name,
    hours: project.timeEntries.reduce((acc, entry) => acc + Number(entry.hours), 0)
  }));

  const progressSeries = Array.from({ length: range }).map((_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    const doneTasks = projects.reduce((acc, project) => {
      const done = project.wbsNodes.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
      const total = project.wbsNodes.length || 1;
      return acc + Math.round((done / total) * 100);
    }, 0);
    return {
      date: day.toISOString().slice(0, 10),
      progress: projects.length ? Math.round(doneTasks / projects.length) : 0
    };
  });

  return res.json({
    generatedAt: new Date(),
    byStatus,
    riskSummary,
    hoursByProject,
    progressSeries
  });
});
