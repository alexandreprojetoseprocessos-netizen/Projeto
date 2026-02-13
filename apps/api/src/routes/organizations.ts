import { Router } from "express";
import { prisma } from "@gestao/database";
import { MembershipRole, OrganizationStatus } from "@prisma/client";
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

organizationsRouter.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { name, domain } = req.body ?? {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Nome da organizaÃ§Ã£o Ã© obrigatÃ³rio." });
  }

  const subscription = await getActiveSubscriptionForUser(req.user.id);
  const limit = getOrgLimitForPlan(subscription?.product?.code ?? null);
  if (limit !== null) {
    const currentCount = await countOrganizationsForLimit(req.user.id);
    if (currentCount >= limit) {
      return res.status(409).json({
        code: "ORG_LIMIT_REACHED",
        message: "Limite de organizaÃ§Ãµes do seu plano atingido."
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
        } as any
      }
    }
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
    modulePermissions: normalizeModulePermissionsForRole(membership.role, (membership as any).modulePermissions)
  }));

  return res.json({ organizations });
});

organizationsRouter.patch(
  "/:organizationId",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;
    const { name, domain } = req.body as {
      name?: string;
      domain?: string | null;
    };

    if (!name && typeof domain === "undefined") {
      return res.status(400).json({ message: "Nenhuma alteraÃ§Ã£o informada." });
    }

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(typeof name === "string" && name.trim().length > 0 ? { name: name.trim() } : {}),
          ...(typeof domain !== "undefined" ? { domain: domain || null } : {})
        }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error updating organization", error);
      return res.status(500).json({ message: "Erro ao atualizar organizaÃ§Ã£o." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/deactivate",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.DEACTIVATED, deletedAt: null, isActive: false }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error deactivating organization", error);
      return res.status(500).json({ message: "Erro ao desativar organizaÃ§Ã£o." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/trash",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.SOFT_DELETED, deletedAt: new Date(), isActive: false }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error sending organization to trash", error);
      return res.status(500).json({ message: "Erro ao excluir organizaÃ§Ã£o." });
    }
  }
);

organizationsRouter.patch(
  "/:organizationId/restore",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ message: "OrganizaÃ§Ã£o nÃ£o encontrada." });
      }

      const restorableStatuses: OrganizationStatus[] = [
        OrganizationStatus.DEACTIVATED,
        OrganizationStatus.SOFT_DELETED
      ];
      if (!restorableStatuses.includes(organization.status)) {
        return res.status(400).json({ message: "Esta organizaÃ§Ã£o nÃ£o pode ser restaurada." });
      }

      const subscription = await getActiveSubscriptionForUser(req.user.id);
      const planCode = subscription?.product?.code ?? null;
      const limit = getOrgLimitForPlan(planCode);

      if (limit !== null) {
        const currentCount = await countOrganizationsForLimit(req.user.id);
        if (currentCount >= limit) {
          return res.status(409).json({
            code: "ORG_LIMIT_REACHED",
            message: "Limite de organizaÃ§Ãµes do seu plano atingido."
          });
        }
      }

      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: { status: OrganizationStatus.ACTIVE, deletedAt: null, isActive: true }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error restoring organization", error);
      return res.status(500).json({ message: "Erro ao restaurar organizaÃ§Ã£o." });
    }
  }
);

organizationsRouter.delete(
  "/:organizationId",
  attachOrgMembership,
  requireCanDeleteOrganization,
  async (req, res) => {
    const { organizationId } = req.params;

    try {
      await prisma.organization.delete({
        where: { id: organizationId }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting organization", error);
      return res.status(500).json({ message: "Erro ao excluir organizaÃ§Ã£o." });
    }
  }
);

