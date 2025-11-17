import type { Request } from "express";
import type { Organization, OrganizationMembership } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  organization?: Organization;
  organizationMembership?: OrganizationMembership;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    organization?: Organization;
    organizationMembership?: OrganizationMembership;
  }
}
