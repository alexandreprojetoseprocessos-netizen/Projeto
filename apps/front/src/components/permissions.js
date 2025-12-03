export const canManageOrganizationSettings = (role) => role === "OWNER" || role === "ADMIN";
export const canManageTeam = (role) => role === "OWNER" || role === "ADMIN";
export const canManageBilling = (role) => role === "OWNER";
export const canManageProjects = (role) => role === "OWNER" || role === "ADMIN" || role === "MEMBER";
export const canViewProjects = (role) => Boolean(role);
