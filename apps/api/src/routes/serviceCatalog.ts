import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";
import { organizationMiddleware } from "../middleware/organization";
import { ensureProjectMembership } from "../services/rbac";

const upload = multer();
export const serviceCatalogRouter = Router();

serviceCatalogRouter.use(authMiddleware);
serviceCatalogRouter.use(organizationMiddleware);

serviceCatalogRouter.get("/", async (req, res) => {
  const projectId = (req.query.projectId as string) ?? null;
  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  const services = await prisma.serviceCatalog.findMany({
    where: { projectId },
    orderBy: { name: "asc" }
  });

  return res.json(services);
});

serviceCatalogRouter.post("/import", upload.single("file"), async (req, res) => {
  const projectId = ((req.query.projectId as string) ?? (req.body?.projectId as string)) || null;
  const file = req.file;

  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }

  if (!file) {
    return res.status(400).json({ message: "file is required" });
  }

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    const normalizeKey = (key: string) =>
      key
        .toString()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const parsed = rows
      .map((row) => {
        const entries = Object.entries(row).reduce<Record<string, any>>((acc, [key, value]) => {
          acc[normalizeKey(key)] = value;
          return acc;
        }, {});

        const nameCandidates = [
          entries["name"],
          entries["nome"],
          entries["servico"],
          entries["serviço"],
          entries["tarefa"]
        ].filter(Boolean) as any[];
        // fallback: first non-empty string field
        if (!nameCandidates.length) {
          const firstString = Object.values(entries).find(
            (v) => typeof v === "string" && String(v).trim().length > 0
          );
          if (firstString) nameCandidates.push(firstString);
        }
        const name = String(nameCandidates[0] ?? "").trim();

        const descriptionCandidates = [
          entries["description"],
          entries["descricao"],
          entries["descrição"]
        ].filter(Boolean) as any[];
        const description = String(descriptionCandidates[0] ?? "").trim();

        const hourKeys = Object.keys(entries).filter((k) => k.includes("hora"));
        const hoursBaseRaw =
          entries["hoursbase"] ??
          entries["horasbase"] ??
          entries["horas"] ??
          entries["horasrealizado"] ??
          entries["horasrealizadas"] ??
          entries["horasrealizado"] ??
          entries["horasrealizados"] ??
          entries["horasreal"] ??
          entries["horasrealizadas"] ??
          entries["horasrealizada"] ??
          (hourKeys.length ? entries[hourKeys[0]] : undefined);

        const hoursBaseNum = (() => {
          if (typeof hoursBaseRaw === "string") {
            const cleaned = hoursBaseRaw.replace(/\s+/g, "").replace(",", ".");
            return Number(cleaned);
          }
          if (hoursBaseRaw !== undefined && hoursBaseRaw !== null) {
            return Number(hoursBaseRaw);
          }
          // fallback: first numeric in row
          const firstNumeric = Object.values(entries).find((v) => typeof v === "number");
          return firstNumeric !== undefined ? Number(firstNumeric) : NaN;
        })();

        if (!name || Number.isNaN(hoursBaseNum)) return null;
        return {
          name,
          description: description || null,
          hoursBase: hoursBaseNum
        };
      })
      .filter(Boolean) as Array<{ name: string; description: string | null; hoursBase: number }>;

    if (parsed.length === 0) {
      return res.status(400).json({
        message: "Nenhuma linha válida encontrada. Confirme colunas: nome/descrição/horas (Horas realizado)."
      });
    }

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of parsed) {
        const existing = await tx.serviceCatalog.findFirst({
          where: { projectId, name: item.name }
        });

        if (existing) {
          await tx.serviceCatalog.update({
            where: { id: existing.id },
            data: {
              description: item.description ?? null,
              hoursBase: item.hoursBase
            }
          });
          updated += 1;
        } else {
          await tx.serviceCatalog.create({
            data: {
              projectId,
              name: item.name,
              description: item.description ?? null,
              hoursBase: item.hoursBase
            }
          });
          created += 1;
        }
      }
    });

    return res.json({ success: true, imported: created, updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to import service catalog" });
  }
});

serviceCatalogRouter.post("/", async (req, res) => {
  const { projectId, name, description, hoursBase } = req.body as {
    projectId?: string;
    name?: string;
    description?: string | null;
    hoursBase?: number;
  };

  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "name is required" });
  }

  const hoursValue = Number(hoursBase);
  if (Number.isNaN(hoursValue)) {
    return res.status(400).json({ message: "hoursBase must be a number" });
  }

  const membership = await ensureProjectMembership(req, res, projectId);
  if (!membership) return;

  try {
    const service = await prisma.serviceCatalog.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim?.() || null,
        hoursBase: hoursValue
      }
    });

    return res.status(201).json(service);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create service" });
  }
});

serviceCatalogRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const service = await prisma.serviceCatalog.findUnique({
    where: { id }
  });

  if (!service) {
    return res.status(404).json({ message: "Service not found" });
  }

  const membership = await ensureProjectMembership(req, res, service.projectId);
  if (!membership) return;

  try {
    await prisma.$transaction([
      prisma.wbsNode.updateMany({
        where: { serviceCatalogId: id },
        data: {
          serviceCatalogId: null,
          serviceMultiplier: null,
          serviceHours: null
        }
      }),
      prisma.serviceCatalog.delete({ where: { id } })
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete service" });
  }
});
