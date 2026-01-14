import { prisma } from "@gestao/database";
import { OrganizationStatus } from "@prisma/client";

export const countOrganizationsForLimit = async (userId: string) => {
  return prisma.organizationMembership.count({
    where: {
      userId,
      organization: {
        status: {
          in: [OrganizationStatus.ACTIVE, OrganizationStatus.DEACTIVATED, OrganizationStatus.SOFT_DELETED]
        }
      }
    }
  });
};

export const countProjectsForLimit = async (organizationId: string) => {
  return prisma.project.count({
    where: {
      organizationId
    }
  });
};
