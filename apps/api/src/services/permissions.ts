export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const canManageOrganizationSettings = (role?: OrgRole | null) =>
  role === "OWNER" || role === "ADMIN";

export const canDeleteOrganization = (role?: OrgRole | null) => role === "OWNER";

export const canManageTeam = (role?: OrgRole | null) => role === "OWNER" || role === "ADMIN";

export const canManageBilling = (role?: OrgRole | null) => role === "OWNER";

export const canManageProjects = (role?: OrgRole | null) =>
  role === "OWNER" || role === "ADMIN" || role === "MEMBER";

export const canViewProjects = (role?: OrgRole | null) => Boolean(role);
