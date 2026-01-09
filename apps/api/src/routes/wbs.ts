import { Router } from "express";
import { Prisma, ProjectRole } from "@prisma/client";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import type { RequestWithUser } from "../types/http";
import { recomputeProjectWbsCodes } from "../services/wbsCode";
import { setNodeDependencies, enforceDependencyDates, DependencyValidationError } from "../services/wbsDependencies";

export const wbsRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

const normalizeHeader = (value?: string | null) =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");

const parseDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }
  const asString = String(value);
  const date = new Date(asString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const assertProjectAccess = async (req: RequestWithUser, res: any, projectId?: string) => {
  if (!projectId) {
    res.status(400).json({ message: "projectId is required" });
    return null;
  }

  if (!req.user || !req.organization) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true }
  });
  if (!project || project.organizationId !== req.organization.id) {
    res.status(404).json({ message: "Project not found" });
    return null;
  }

  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: req.user.id }
  });
  if (!membership) {
    res.status(403).json({ message: "Access denied for this project" });
    return null;
  }

  return { project, membership };
};

const assertNodeAccess = async (req: RequestWithUser, res: any, nodeId: string, roles?: ProjectRole[]) => {
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
        select: { organizationId: true }
      }
    }
  });

  if (!node || node.project.organizationId !== req.organization.id) {
    res.status(404).json({ message: "Node not found" });
    return null;
  }

  const membership = await prisma.projectMember.findFirst({
    where: { projectId: node.projectId, userId: req.user.id }
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

wbsRouter.use(authMiddleware);
wbsRouter.use(organizationMiddleware);

// GET /wbs/:nodeId/comments
wbsRouter.get("/:nodeId/comments", async (req, res) => {
  const { nodeId } = req.params;
  const access = await assertNodeAccess(req as RequestWithUser, res, nodeId);
  if (!access) return;

  try {
    const comments = await prisma.wbsComment.findMany({
      where: { wbsNodeId: nodeId },
      orderBy: { createdAt: "asc" }
    });
    return res.json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error loading comments" });
  }
});

// POST /wbs/:nodeId/comments
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
    return res.status(400).json({ message: "Mensagem obrigatoria" });
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
    return res.status(500).json({ message: "Erro ao criar comentario" });
  }
});

// GET /wbs?projectId=...
wbsRouter.get("/", async (req: RequestWithUser, res) => {
  const { projectId } = req.query as { projectId?: string };
  const access = await assertProjectAccess(req, res, projectId);
  if (!access) return;

  const nodes = await prisma.wbsNode.findMany({
    where: { projectId: projectId!, deletedAt: null },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    include: {
      parent: { select: { id: true, wbsCode: true } },
      responsibleMembership: {
        include: { user: true }
      },
      serviceCatalog: true,
      dependenciesAsSuccessor: {
        select: {
          predecessorId: true,
          predecessor: { select: { wbsCode: true } }
        }
      }
    }
  });

  return res.json({ nodes });
});

// PATCH /wbs/reorder
wbsRouter.patch("/reorder", async (req: RequestWithUser, res) => {
  const { projectId, parentId, orderedIds } = req.body as {
    projectId?: string;
    parentId?: string | null;
    orderedIds?: string[];
  };

  const access = await assertProjectAccess(req, res, projectId);
  if (!access) return;

  if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ message: "orderedIds is required" });
  }

  const nodes = await prisma.wbsNode.findMany({
    where: {
      projectId: projectId!,
      id: { in: orderedIds },
      deletedAt: null
    },
    select: { id: true, parentId: true }
  });

  const invalid = nodes.some((n) => (parentId ?? null) !== (n.parentId ?? null));
  if (invalid || nodes.length !== orderedIds.length) {
    return res.status(400).json({ message: "Ids must belong to the same parent within the project" });
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.wbsNode.update({
        where: { id },
        data: {
          sortOrder: index * 1000,
          order: index * 1000
        }
      })
    )
  );

  await recomputeProjectWbsCodes(projectId!);

  return res.json({ success: true });
});

// PATCH /wbs/bulk-delete
wbsRouter.patch("/bulk-delete", async (req: RequestWithUser, res) => {
  const { ids } = req.body as { ids?: string[] };
  if (!ids || !Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: "ids array is required" });
  }

  const nodes = await prisma.wbsNode.findMany({
    where: { id: { in: ids } },
    select: { id: true, project: { select: { organizationId: true, id: true } } }
  });

  if (!req.user || !req.organization) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const allowedIds = nodes
    .filter((n) => n.project.organizationId === req.organization!.id)
    .map((n) => n.id);

  if (!allowedIds.length) {
    return res.status(404).json({ message: "No nodes found for deletion" });
  }

  const result = await prisma.wbsNode.updateMany({
    where: { id: { in: allowedIds } },
    data: { deletedAt: new Date() }
  });

  return res.json({ success: true, count: result.count });
});

// PATCH /wbs/:id
wbsRouter.patch("/:id", async (req: RequestWithUser, res) => {
  const { id } = req.params;
  const {
    title,
    status,
    startDate,
    endDate,
    estimateHours,
    order,
    parentId,
    dependencies,
    serviceCatalogId,
    serviceMultiplier,
    description,
    descricao,
    details,
    notes
  } = req.body as Record<string, any>;

  const access = await assertNodeAccess(req, res, id, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!access) return;

  const data: Prisma.WbsNodeUncheckedUpdateInput = {};
  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status as any;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (estimateHours !== undefined) data.estimateHours = estimateHours ? new Prisma.Decimal(estimateHours) : null;
  if (order !== undefined) data.order = order;
  const descriptionValue =
    description !== undefined
      ? description
      : descricao !== undefined
      ? descricao
      : details !== undefined
      ? details
      : notes !== undefined
      ? notes
      : undefined;
  if (descriptionValue !== undefined) {
    if (descriptionValue === null) {
      data.description = null;
    } else if (typeof descriptionValue === "string") {
      const trimmed = descriptionValue.trim();
      data.description = trimmed ? trimmed : null;
    } else {
      data.description = String(descriptionValue);
    }
  }
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
        return res.status(400).json({ message: "Service catalog not found for this project" });
      }
      const multValue =
        serviceMultiplier !== undefined && serviceMultiplier !== null ? Number(serviceMultiplier) || 1 : 1;
      data.serviceCatalogId = serviceCatalogId;
      data.serviceMultiplier = multValue;
      data.serviceHours = catalog.hoursBase * multValue;
    }
  }

  if (parentId !== undefined) {
    if (!parentId) {
      data.parentId = null;
    } else {
      const parent = await prisma.wbsNode.findFirst({
        where: { id: parentId, projectId: access.node.projectId, deletedAt: null }
      });
      if (!parent) {
        return res.status(400).json({ message: "Parent not found" });
      }
      data.parentId = parentId;
    }
  }

  const node = await prisma.wbsNode.update({
    where: { id },
    data
  });

  let dependenciesChanged = false;
  if (dependencies !== undefined) {
    if (!Array.isArray(dependencies)) {
      return res.status(400).json({ message: "dependencies must be an array" });
    }
    const dependencyIds = dependencies.map((d: any) => String(d));
    try {
      dependenciesChanged = await setNodeDependencies(access.node.projectId, id, dependencyIds);
    } catch (error) {
      if (error instanceof DependencyValidationError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  }

  await recomputeProjectWbsCodes(access.node.projectId);
  if (dependenciesChanged || startDate !== undefined || endDate !== undefined) {
    await enforceDependencyDates(access.node.projectId, [id]);
  }

  const refreshed = await prisma.wbsNode.findUnique({ where: { id } });
  return res.json({ node: refreshed ?? node });
});

// PATCH /wbs/:id/responsible
wbsRouter.patch("/:id/responsible", async (req: RequestWithUser, res) => {
  const { id } = req.params;
  const { membershipId } = req.body as { membershipId?: string | null };

  const access = await assertNodeAccess(req, res, id, [ProjectRole.MANAGER, ProjectRole.CONTRIBUTOR]);
  if (!access) return;

  const updated = await prisma.wbsNode.update({
    where: { id },
    data: { responsibleMembershipId: membershipId || null },
    include: {
      responsibleMembership: { include: { user: true } }
    }
  });

  return res.json({
    id: updated.id,
    responsible: updated.responsibleMembership
      ? {
          membershipId: updated.responsibleMembership.id,
          userId: updated.responsibleMembership.userId,
          name:
            updated.responsibleMembership.user.fullName ??
            updated.responsibleMembership.user.email ??
            ""
        }
      : null
  });
});

// POST /wbs/import?projectId=...
wbsRouter.post("/import", upload.single("file"), async (req: RequestWithUser, res) => {
  const { projectId } = req.query as { projectId?: string };
  const access = await assertProjectAccess(req, res, projectId);
  if (!access) return;

  if (!req.file) {
    return res.status(400).json({ message: "File not provided. Use multipart/form-data with field 'file'." });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

    const existingNodes = await prisma.wbsNode.findMany({
      where: { projectId: projectId! },
      select: { id: true, wbsCode: true, title: true, level: true, parentId: true, deletedAt: true }
    });
    const nodesByCode = new Map(
      existingNodes.filter((n) => n.wbsCode).map((n) => [n.wbsCode!.toLowerCase(), n])
    );

    const serviceCatalog = await prisma.serviceCatalog.findMany({
      where: { projectId: projectId! },
      select: { id: true, name: true, hoursBase: true }
    });
    const catalogById = new Map(serviceCatalog.map((c) => [c.id, c]));
    const catalogByName = new Map(serviceCatalog.map((c) => [c.name.toLowerCase().trim(), c]));

    const parsedRows: Array<{
      code: string;
      parentCode?: string | null;
      level?: number | null;
      title: string;
      status?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      durationDays?: number | null;
      dependencies?: string[] | null;
      serviceCatalogId?: string | null;
      serviceMultiplier?: number | null;
    }> = [];
    const errors: Array<{ row: number; message: string }> = [];
    const rowLogs: Array<Record<string, any>> = [];

    const statusMap: Record<string, string> = {
      "nao iniciado": "BACKLOG",
      backlog: "BACKLOG",
      "em andamento": "IN_PROGRESS",
      andamento: "IN_PROGRESS",
      working: "IN_PROGRESS",
      "in progress": "IN_PROGRESS",
      "em progresso": "IN_PROGRESS",
      "a fazer": "TODO",
      todo: "TODO",
      finalizado: "DONE",
      concluido: "DONE",
      done: "DONE"
    };

    rows.forEach((raw, index) => {
      const normalized: Record<string, any> = {};
      Object.entries(raw).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = value;
      });

      const hasData = Object.values(normalized).some(
        (v) => v !== null && v !== undefined && String(v).trim() !== ""
      );
      if (!hasData) return;

      const title = (normalized["nome_da_tarefa"] ?? normalized["title"] ?? normalized["tarefa"] ?? "").toString().trim();
      if (!title) {
        errors.push({ row: index + 2, message: "Missing task title" });
        return;
      }

      const code =
        (normalized["id"] ?? normalized["code"] ?? normalized["codigo"] ?? normalized["wbs"] ?? null)?.toString()?.trim() ||
        null;
      if (!code) {
        errors.push({ row: index + 2, message: "Missing ID/Code" });
        return;
      }

      const explicitParent =
        (normalized["parentcode"] ?? normalized["pai"] ?? normalized["codigo_pai"] ?? null)?.toString()?.trim() || null;
      const inferredParent =
        code.includes(".") && code.split(".").length > 1 ? code.split(".").slice(0, -1).join(".") : null;
      const parentCode = explicitParent || inferredParent;

      const level = normalized["nivel"] ?? normalized["level"] ?? null;
      const statusRaw = normalized["situacao"] ?? normalized["status"] ?? null;
      const statusKey = statusRaw ? statusRaw.toString().trim().toLowerCase() : null;
      const status = statusKey ? statusMap[statusKey] ?? null : null;

      const startDate = parseDateValue(normalized["inicio"] ?? normalized["startdate"]);
      const endDate = parseDateValue(normalized["termino"] ?? normalized["enddate"]);
      const durationDays =
        normalized["duracao"] !== null && normalized["duracao"] !== undefined
          ? Number(normalized["duracao"])
          : null;

      const dependenciesCell = normalized["dependencias"] ?? null;
      const dependencies =
        typeof dependenciesCell === "string"
          ? dependenciesCell
              .split(",")
              .map((d: string) => d.trim())
              .filter(Boolean)
          : Array.isArray(dependenciesCell)
            ? dependenciesCell.filter(Boolean).map((d: any) => String(d))
            : null;

      const catalogCell =
        normalized["catalogo_de_servicos"] ?? normalized["servico"] ?? normalized["servicecatalog"] ?? null;
      let serviceCatalogId: string | null = null;
      if (catalogCell) {
        const catalogText = catalogCell.toString().trim();
        if (catalogById.has(catalogText)) {
          serviceCatalogId = catalogText;
        } else if (catalogByName.has(catalogText.toLowerCase())) {
          serviceCatalogId = catalogByName.get(catalogText.toLowerCase())!.id;
        } else {
          errors.push({ row: index + 2, message: `Catalog not found: ${catalogText}` });
        }
      }

      const multiplierValue = normalized["multiplicador"] ?? normalized["multiplier"] ?? null;
      const serviceMultiplier =
        multiplierValue !== null && multiplierValue !== undefined ? Number(multiplierValue) || 1 : null;

      parsedRows.push({
        code,
        parentCode,
        level: level !== null && level !== undefined ? Number(level) : null,
        title,
        status,
        startDate,
        endDate,
        durationDays: durationDays !== null && !Number.isNaN(durationDays) ? durationDays : null,
        dependencies,
        serviceCatalogId,
        serviceMultiplier
      });
    });

    let created = 0;
    let updated = 0;
    const createdNodes: Array<{
      id: string;
      code: string;
      parentCode?: string | null;
      dependencies?: string[] | null;
    }> = [];

    // Pass A: create/update without parents
    for (const [rowIndex, row] of parsedRows.entries()) {
      const codeKey = row.code.toLowerCase();
      const existing = nodesByCode.get(codeKey);

      const payload: Prisma.WbsNodeUncheckedCreateInput = {
        projectId: projectId!,
        title: row.title,
        status: (row.status as any) ?? ("BACKLOG" as any),
        startDate: row.startDate ?? null,
        endDate: row.endDate ?? null,
        estimateHours:
          row.durationDays !== null && row.durationDays !== undefined
            ? new Prisma.Decimal(Number(row.durationDays) * 8)
            : null,
        serviceCatalogId: row.serviceCatalogId ?? null,
        serviceMultiplier: row.serviceMultiplier ?? null,
        serviceHours:
          row.serviceCatalogId && row.serviceMultiplier
            ? (catalogById.get(row.serviceCatalogId)?.hoursBase ?? 0) * row.serviceMultiplier
            : null,
        wbsCode: row.code,
        level: row.level ?? undefined,
        deletedAt: null
      };

      try {
        if (!existing) {
          const createdNode = await prisma.wbsNode.create({ data: payload });
          created += 1;
          nodesByCode.set(codeKey, createdNode);
          createdNodes.push({
            id: createdNode.id,
            code: row.code,
            parentCode: row.parentCode ?? null,
            dependencies: row.dependencies ?? null
          });
          rowLogs.push({ row: rowIndex + 2, code: row.code, action: "created" });
        } else {
          await prisma.wbsNode.update({
            where: { id: existing.id },
            data: {
              title: payload.title,
              status: payload.status as any,
              startDate: payload.startDate,
              endDate: payload.endDate,
              estimateHours: payload.estimateHours,
              serviceCatalogId: payload.serviceCatalogId ?? null,
              serviceMultiplier: payload.serviceMultiplier ?? null,
              serviceHours: payload.serviceHours,
              wbsCode: row.code,
              level: row.level ?? existing.level,
              deletedAt: null
            }
          });
          updated += 1;
          createdNodes.push({
            id: existing.id,
            code: row.code,
            parentCode: row.parentCode ?? null,
            dependencies: row.dependencies ?? null
          });
          rowLogs.push({ row: rowIndex + 2, code: row.code, action: "updated" });
        }
      } catch (error: any) {
        errors.push({ row: rowIndex + 2, message: error?.message ?? "Error saving row" });
        rowLogs.push({ row: rowIndex + 2, code: row.code, action: "error", message: error?.message });
      }
    }

    // Pass B: parents and dependencies
    const codeToId = new Map<string, string>();
    for (const n of nodesByCode.values()) {
      if (n.wbsCode) codeToId.set(n.wbsCode.toLowerCase(), n.id);
    }
    for (const n of createdNodes) {
      codeToId.set(n.code.toLowerCase(), n.id);
    }

    for (const row of createdNodes) {
      if (row.parentCode) {
        const parentId = codeToId.get(row.parentCode.toLowerCase());
        if (parentId) {
          await prisma.wbsNode.update({
            where: { id: row.id },
            data: { parentId }
          });
        } else {
          errors.push({ row: 0, message: `Parent not found for code ${row.parentCode}` });
        }
      }

      if (row.dependencies?.length) {
        const depIds = row.dependencies
          .map((code) => codeToId.get(code.toLowerCase()))
          .filter((id): id is string => Boolean(id));
        try {
          await setNodeDependencies(projectId!, row.id, depIds);
        } catch (error: any) {
          errors.push({ row: 0, message: error?.message ?? "Error saving dependencies" });
        }
      }
    }

    await recomputeProjectWbsCodes(projectId!);

    console.log("[WBS Import]", {
      projectId,
      totalRows: parsedRows.length,
      created,
      updated,
      errors: errors.length,
      rows: rowLogs.slice(0, 50)
    });

    return res.json({ success: true, created, updated, errors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error importing WBS" });
  }
});

// GET /wbs/export?projectId=...&format=xlsx
wbsRouter.get("/export", async (req: RequestWithUser, res) => {
  const { projectId, format, projectName } = req.query as { projectId?: string; format?: string; projectName?: string };
  const access = await assertProjectAccess(req, res, projectId);
  if (!access) return;

  const nodes = await prisma.wbsNode.findMany({
    where: { projectId: projectId!, deletedAt: null },
    orderBy: [{ level: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    include: {
      parent: { select: { wbsCode: true } },
      responsibleMembership: { include: { user: true } },
      serviceCatalog: true,
      dependenciesAsSuccessor: {
        select: { predecessor: { select: { wbsCode: true } } }
      }
    }
  });

  const codeById = new Map(nodes.map((n) => [n.id, n.wbsCode ?? ""]));
  const data = nodes.map((node) => {
    const deps =
      node.dependenciesAsSuccessor?.map((d) => d.predecessor?.wbsCode).filter(Boolean).join(", ") ?? "";
    return {
      ID: node.id,
      Code: node.wbsCode ?? "",
      Parent: node.parentId ? codeById.get(node.parentId) ?? "" : "",
      Level: node.level ?? 0,
      Title: node.title ?? "",
      Status: node.status ?? "",
      Start: node.startDate ? new Date(node.startDate).toISOString().slice(0, 10) : "",
      End: node.endDate ? new Date(node.endDate).toISOString().slice(0, 10) : "",
      Duration: node.estimateHours ? Number(node.estimateHours) / 8 : "",
      Responsible: node.responsibleMembership?.user?.email ?? "",
      Dependencies: deps,
      ServiceCatalog: node.serviceCatalog?.name ?? "",
      Multiplier: node.serviceMultiplier ?? "",
      HR: node.serviceHours ?? ""
    };
  });

  const headers = [
    "ID",
    "Code",
    "Parent",
    "Level",
    "Title",
    "Status",
    "Start",
    "End",
    "Duration",
    "Responsible",
    "Dependencies",
    "ServiceCatalog",
    "Multiplier",
    "HR"
  ];

  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "WBS");
  const buffer =
    format === "csv"
      ? XLSX.write(workbook, { type: "buffer", bookType: "csv" })
      : XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const safeName = (projectName ?? "projeto").replace(/[^a-z0-9-_]/gi, "_");
  const filename = format === "csv" ? `EAP-${safeName}-${dateStr}.csv` : `EAP-${safeName}-${dateStr}.xlsx`;

  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  res.setHeader(
    "Content-Type",
    format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  return res.send(buffer);
});

// GET /wbs/trash?projectId=...
wbsRouter.get("/trash", async (req: RequestWithUser, res) => {
  const { projectId } = req.query as { projectId?: string };
  const access = await assertProjectAccess(req, res, projectId);
  if (!access) return;

  const items = await prisma.wbsNode.findMany({
    where: { projectId: projectId!, deletedAt: { not: null } },
    orderBy: [{ deletedAt: "desc" }],
    select: {
      id: true,
      wbsCode: true,
      title: true,
      deletedAt: true,
      parentId: true
    }
  });

  return res.json({ items });
});

// PATCH /wbs/:id/restore
wbsRouter.patch("/:id/restore", async (req: RequestWithUser, res) => {
  const { id } = req.params;
  const access = await assertNodeAccess(req, res, id);
  if (!access) return;

  await prisma.wbsNode.update({
    where: { id },
    data: { deletedAt: null }
  });

  await recomputeProjectWbsCodes(access.node.projectId);

  return res.json({ success: true });
});
