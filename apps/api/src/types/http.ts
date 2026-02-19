import type { Request } from "express";
import type { Organization, OrganizationMembership } from "@prisma/client";
import type { OrgRole } from "../services/permissions";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
  fullName?: string | null;
};

export type UploadedFile = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  organization?: Organization;
  organizationMembership?: OrganizationMembership;
  organizationId?: string;
  organizationRole?: OrgRole;
  rawBody?: string;
  file?: UploadedFile;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    organization?: Organization;
    organizationMembership?: OrganizationMembership;
    organizationId?: string;
    organizationRole?: OrgRole;
    rawBody?: string;
    file?: UploadedFile;
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
