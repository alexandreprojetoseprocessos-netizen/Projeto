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

reportsRouter.get("/portfolio", async (req, res) => {
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
      code: true,
      name: true,
      clientName: true,
      status: true,
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
    const tasksDone = project.wbsNodes.filter((node) => node.status === "DONE").length;
    const tasksInProgress = project.wbsNodes.filter((node) => node.status === "IN_PROGRESS").length;
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
      status: project.status,
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
          sanitizeCsvValue(row.startDate ?? ""),
          sanitizeCsvValue(row.endDate ?? ""),
          sanitizeCsvValue(row.tags?.join("|") ?? ""),
          sanitizeCsvValue(row.status),
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
