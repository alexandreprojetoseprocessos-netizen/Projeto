import { Router } from "express";
import { prisma } from "@gestao/database";
import { MembershipRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import {
  attachOrgMembership,
  requireCanDeleteOrganization,
  requireCanManageOrgSettings
} from "../middleware/organization";

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

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
};

organizationsRouter.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { name, domain } = req.body ?? {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Nome da organização é obrigatório" });
  }

  const slug = await ensureUniqueSlug(slugify(name));

  const organization = await prisma.organization.create({
    data: {
      name: name.trim(),
      slug,
      domain: typeof domain === "string" && domain.trim() ? domain.trim() : null,
      memberships: {
        create: {
          userId: req.user.id,
          role: MembershipRole.OWNER
        }
      }
    }
  });

  return res.status(201).json({ organization });
});

organizationsRouter.patch(
  "/:organizationId",
  attachOrgMembership,
  requireCanManageOrgSettings,
  async (req, res) => {
    const { organizationId } = req.params;
    const { name, domain, isActive } = req.body as {
      name?: string;
      domain?: string | null;
      isActive?: boolean;
    };

    if (!name && typeof domain === "undefined" && typeof isActive === "undefined") {
      return res.status(400).json({ message: "Nenhuma alteração informada." });
    }

    try {
      const updated = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(typeof name === "string" && name.trim().length > 0 ? { name: name.trim() } : {}),
          ...(typeof domain !== "undefined" ? { domain: domain || null } : {}),
          ...(typeof isActive === "boolean" ? { isActive } : {})
        }
      });

      return res.json({ organization: updated });
    } catch (error) {
      console.error("Error updating organization", error);
      return res.status(500).json({ message: "Erro ao atualizar organização." });
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
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          isActive: false
        }
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting organization", error);
      return res.status(500).json({ message: "Erro ao excluir organização." });
    }
  }
);
