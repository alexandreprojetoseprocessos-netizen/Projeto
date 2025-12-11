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

export interface OrganizationMemberDTO {
  id: string; // OrganizationMembership.id
  userId: string;
  name: string;
  email: string;
  role: string | null;
}

export interface WbsNodeDTO {
  id: string;
  parentId?: string | null;
  title?: string;
  status?: string;
  level?: number;
  wbsCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  estimateHours?: string | null;
  progress?: number | null;
  dependencies?: string[];
  responsible?:
    | {
        membershipId: string;
        userId: string;
        name: string;
      }
    | null;
}
