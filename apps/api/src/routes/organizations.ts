import { Router } from "express";
import { prisma } from "@gestao/database";
import { MembershipRole, OrganizationStatus, Prisma } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import {
  attachOrgMembership,
  requireCanDeleteOrganization,
  requireCanManageOrgSettings
} from "../middleware/organization";
import { getActiveSubscriptionForUser } from "../services/subscriptions";
import { countOrganizationsForLimit } from "../services/planLimitCounts";
import { getOrgLimitForPlan } from "../services/subscriptionLimits";
import { getDefaultModulePermissions, normalizeModulePermissionsForRole } from "../services/modulePermissions";
import { normalizeUuid } from "../utils/uuid";
import { writeAuditLog } from "../services/audit";
import { dispatchIntegrationEvent } from "../services/webhookDispatcher";

export const organizationsRouter = Router();

organizationsRouter.use(authMiddleware);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40) || "org";

const ensureUniqueSlug = async (baseSlug: string) => {
  let suffix = 0;
  let candidate = baseSlug;
  let exists = await prisma.organization.findUnique({ where: { slug: candidate } });

  while (exists) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
    exists = await prisma.organization.findUnique({ where: { slug: candidate } });
  }
  return candidate;
};

const getScopedOrganizationId = (rawParam: unknown, scopedId?: string | null) => {
  if (typeof scopedId === "string" && scopedId.trim()) return scopedId;
  return normalizeUuid(rawParam);
};

const toOrganizationAuditSummary = (organization: {
  id: string;
  name: string;
  domain: string | null;
  status: OrganizationStatus;
  isActive: boolean;
  deletedAt: Date | null;
}) => ({
  id: organization.id,
  name: organization.name,
  domain: organization.domain,
  status: organization.status,
  isActive: organization.isActive,
  deletedAt: organization.deletedAt?.toISOString() ?? null
});

const emitOrganizationIntegrationEvent = ({
  organizationId,
  actorId,
  eventName,
  organization
}: {
  organizationId: string;
  actorId?: string | null;
  eventName: string;
  organization: ReturnType<typeof toOrganizationAuditSummary>;
}) => {
  void dispatchIntegrationEvent({
    organizationId,
    organizationName: organization.name,
    actorId: actorId ?? null,
    eventName,
    entity: "ORGANIZATION",
    entityId: organizationId,
    payload: {
      organization
    }
  });
};

organizationsRouter.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { name, domain } = req.body ?? {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Nome da organização é obrigatório." });
  }

  const subscription = await getActiveSubscriptionForUser(req.user.id);
  const limit = getOrgLimitForPlan(subscription?.product?.code ?? null);
  if (limit !== null) {
    const currentCount = await countOrganizationsForLimit(req.user.id);
    if (currentCount >= limit) {
      return res.status(409).json({
        code: "ORG_LIMIT_REACHED",
        message: "Limite de organizações do seu plano atingido."
      });
    }
  }

  const slug = await ensureUniqueSlug(slugify(name));

  const organization = await prisma.organization.create({
    data: {
      name: name.trim(),
      slug,
      domain: typeof domain === "string" && domain.trim() ? domain.trim() : null,
      status: OrganizationStatus.ACTIVE,
      isActive: true,
      memberships: {
        create: {
          userId: req.user.id,
          role: MembershipRole.OWNER,
          modulePermissions: getDefaultModulePermissions(MembershipRole.OWNER)
        } as Prisma.OrganizationMembershipUncheckedCreateWithoutOrganizationInput
      }
    }
  });

  await writeAuditLog({
    organizationId: organization.id,
    actorId: req.user.id,
    action: "ORGANIZATION_CREATED",
    entity: "ORGANIZATION",
    entityId: organization.id,
    diff: {
      after: toOrganizationAuditSummary(organization)
    }
  });

  emitOrganizationIntegrationEvent({
    organizationId: organization.id,
    actorId: req.user.id,
    eventName: "organization.created",
    organization: toOrganizationAuditSummary(organization)
  });

  return res.status(201).json({ organization });
});

organizationsRouter.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { status } = req.query as { status?: string };
  const validStatuses = Object.values(OrganizationStatus);
  const statusFilter =
    status && validStatuses.includes(status as OrganizationStatus)
      ? (status as OrganizationStatus)
      : OrganizationStatus.ACTIVE;

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId: req.user.id,
      organization: { status: statusFilter }
    },
    include: { organization: true }
  });

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    domain: membership.organization.domain,
    createdAt: membership.organization.createdAt,
    status: membership.organization.status,
    deletedAt: membership.organization.deletedAt,
    role: membership.role,
    modulePermissions: normalizeModulePermissionsForRole(
      membership.role,
      (membership.modulePermissions as Prisma.JsonValue | null) ?? null
    )
  }));

  return res.json({ organizations });
});

organizationsRouter.get(
  "/:organizationId/audit-logs",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    const rawLimit = Number(req.query.limit ?? "50");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;
    const normalizeQueryValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");
    const splitCsv = (value: unknown) =>
      normalizeQueryValue(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const entity = normalizeQueryValue(req.query.entity);
    const action = normalizeQueryValue(req.query.action);
    const entityPrefix = normalizeQueryValue(req.query.entityPrefix);
    const actionPrefix = normalizeQueryValue(req.query.actionPrefix);
    const entities = splitCsv(req.query.entities);
    const actions = splitCsv(req.query.actions);
    const projectId = normalizeUuid(req.query.projectId);

    const where: Prisma.AuditLogWhereInput = { organizationId };
    if (entity) {
      where.entity = entity;
    } else if (entities.length) {
      where.entity = { in: entities };
    } else if (entityPrefix) {
      where.entity = { startsWith: entityPrefix };
    }

    if (action) {
      where.action = action;
    } else if (actions.length) {
      where.action = { in: actions };
    } else if (actionPrefix) {
      where.action = { startsWith: actionPrefix };
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        diff: log.diff,
        createdAt: log.createdAt,
        actor: log.actor,
        project: log.project
      }))
    });
  }
);

organizationsRouter.patch(
  "/:organizationId",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    const { name, domain } = req.body as {
      name?: string;
      domain?: string | null;
    };

    if (!name && typeof domain === "undefined") {
      return res.status(400).json({ message: "Nenhuma alteração informada." });
    }

    try {
      const existing = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      if (!existing) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(typeof name === "string" && name.trim().length > 0 ? { name: name.trim() } : {}),
          ...(typeof domain !== "undefined" ? { domain: domain || null } : {})
        }
      });

      await writeAuditLog({
        organizationId,
        actorId: req.user?.id ?? null,
        action: "ORGANIZATION_UPDATED",
        entity: "ORGANIZATION",
        entityId: organizationId,
        diff: {
          before: toOrganizationAuditSummary(existing),
          after: toOrganizationAuditSummary(updated)
        }
      });

      emitOrganizationIntegrationEvent({
        organizationId,
        actorId: req.user?.id ?? null,
        eventName: "organization.updated",
        organization: toOrganizationAuditSummary(updated)
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error updating organization", error);
      return res.status(500).json({ message: "Erro ao atualizar organização." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/deactivate",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    try {
      const existing = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      if (!existing) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.DEACTIVATED, deletedAt: null, isActive: false }
      });

      await writeAuditLog({
        organizationId,
        actorId: req.user?.id ?? null,
        action: "ORGANIZATION_DEACTIVATED",
        entity: "ORGANIZATION",
        entityId: organizationId,
        diff: {
          before: toOrganizationAuditSummary(existing),
          after: toOrganizationAuditSummary(updated)
        }
      });

      emitOrganizationIntegrationEvent({
        organizationId,
        actorId: req.user?.id ?? null,
        eventName: "organization.deactivated",
        organization: toOrganizationAuditSummary(updated)
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error deactivating organization", error);
      return res.status(500).json({ message: "Erro ao desativar organização." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/trash",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    try {
      const existing = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      if (!existing) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.SOFT_DELETED, deletedAt: new Date(), isActive: false }
      });

      await writeAuditLog({
        organizationId,
        actorId: req.user?.id ?? null,
        action: "ORGANIZATION_TRASHED",
        entity: "ORGANIZATION",
        entityId: organizationId,
        diff: {
          before: toOrganizationAuditSummary(existing),
          after: toOrganizationAuditSummary(updated)
        }
      });

      emitOrganizationIntegrationEvent({
        organizationId,
        actorId: req.user?.id ?? null,
        eventName: "organization.trashed",
        organization: toOrganizationAuditSummary(updated)
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error sending organization to trash", error);
      return res.status(500).json({ message: "Erro ao excluir organização." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/restore",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      const restorableStatuses: OrganizationStatus[] = [
        OrganizationStatus.DEACTIVATED,
        OrganizationStatus.SOFT_DELETED
      ];
      if (!restorableStatuses.includes(organization.status)) {
        return res.status(400).json({ message: "Esta organização não pode ser restaurada." });
      }

      const subscription = await getActiveSubscriptionForUser(req.user.id);
      const planCode = subscription?.product?.code ?? null;
      const limit = getOrgLimitForPlan(planCode);

      if (limit !== null) {
        const currentCount = await countOrganizationsForLimit(req.user.id);
        if (currentCount >= limit) {
          return res.status(409).json({
            code: "ORG_LIMIT_REACHED",
            message: "Limite de organizações do seu plano atingido."
          });
        }
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.ACTIVE, deletedAt: null, isActive: true }
      });

      await writeAuditLog({
        organizationId,
        actorId: req.user.id,
        action: "ORGANIZATION_RESTORED",
        entity: "ORGANIZATION",
        entityId: organizationId,
        diff: {
          before: toOrganizationAuditSummary(organization),
          after: toOrganizationAuditSummary(updated)
        }
      });

      emitOrganizationIntegrationEvent({
        organizationId,
        actorId: req.user.id,
        eventName: "organization.restored",
        organization: toOrganizationAuditSummary(updated)
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error restoring organization", error);
      return res.status(500).json({ message: "Erro ao restaurar organização." });
    }
  }
);

organizationsRouter.delete(
  "/:organizationId",
  attachOrgMembership,
  requireCanDeleteOrganization,
  async (req, res) => {
    const organizationId = getScopedOrganizationId(req.params.organizationId, req.organizationId);
    if (!organizationId) {
      return res.status(400).json({ message: "organizationId is invalid" });
    }

    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      if (!organization) {
        return res.status(404).json({ message: "Organização não encontrada." });
      }

      await writeAuditLog({
        organizationId,
        actorId: req.user?.id ?? null,
        action: "ORGANIZATION_DELETED",
        entity: "ORGANIZATION",
        entityId: organizationId,
        diff: {
          before: toOrganizationAuditSummary(organization)
        }
      });

      emitOrganizationIntegrationEvent({
        organizationId,
        actorId: req.user?.id ?? null,
        eventName: "organization.deleted",
        organization: toOrganizationAuditSummary(organization)
      });

      await prisma.organization.delete({
        where: { id: organizationId }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting organization", error);
      return res.status(500).json({ message: "Erro ao excluir organização." });
    }
  }
);
