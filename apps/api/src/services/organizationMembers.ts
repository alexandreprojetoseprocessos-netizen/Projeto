import { prisma } from "@gestao/database";
import { MembershipRole } from "@prisma/client";
import type { AuthenticatedUser } from "../types/http";
import { getDefaultModulePermissions, normalizeModulePermissionsForRole } from "./modulePermissions";

const ensureUserExistsByEmail = async (email: string, requester: AuthenticatedUser) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;

  const nameFromEmail = normalizedEmail.split("@")[0];
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: nameFromEmail || "Novo usuario",
      passwordHash: "invite-created",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      avatarUrl: requester?.name ? undefined : undefined
    }
  });
};

export const listMembersForOrganization = async (organizationId: string) => {
  const memberships = await prisma.organizationMembership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          corporateEmail: true,
          personalEmail: true,
          fullName: true,
          phone: true,
          address: true,
          jobTitle: true,
          locale: true,
          timezone: true,
          twoFactorEnabled: true,
          avatarUrl: true,
          active: true,
          documentType: true,
          documentNumber: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return memberships.map((membership) => ({
    ...membership,
    modulePermissions: normalizeModulePermissionsForRole(membership.role, (membership as any).modulePermissions)
  }));
};

export const addMemberToOrganization = async (
  organizationId: string,
  email: string,
  role: MembershipRole,
  requester: AuthenticatedUser
) => {
  const user = await ensureUserExistsByEmail(email, requester);

  const membership = await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id
      }
    },
    update: {
      role,
      modulePermissions: getDefaultModulePermissions(role)
    } as any,
    create: {
      organizationId,
      userId: user.id,
      role,
      modulePermissions: getDefaultModulePermissions(role)
    } as any,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          corporateEmail: true,
          personalEmail: true,
          fullName: true,
          phone: true,
          address: true,
          jobTitle: true,
          locale: true,
          timezone: true,
          twoFactorEnabled: true,
          avatarUrl: true,
          active: true,
          documentType: true,
          documentNumber: true
        }
      }
    }
  });

  return {
    ...membership,
    modulePermissions: normalizeModulePermissionsForRole(membership.role, (membership as any).modulePermissions)
  };
};

