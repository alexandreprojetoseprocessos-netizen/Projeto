import { prisma } from "@gestao/database";
import { MembershipRole } from "@prisma/client";
import type { AuthenticatedUser } from "../types/http";

const ensureUserExistsByEmail = async (email: string, requester: AuthenticatedUser) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;

  const nameFromEmail = normalizedEmail.split("@")[0];
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: nameFromEmail || "Novo usuário",
      passwordHash: "invite-created",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      avatarUrl: requester?.name ? undefined : undefined
    }
  });
};

export const listMembersForOrganization = async (organizationId: string) => {
  return prisma.organizationMembership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
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
      role
    },
    create: {
      organizationId,
      userId: user.id,
      role
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    }
  });

  return membership;
};
