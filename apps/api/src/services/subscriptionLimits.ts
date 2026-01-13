import { getPlanDefinitionOrDefault } from "../config/plans";

export const getOrgLimitForPlan = (code?: string | null): number | null =>
  getPlanDefinitionOrDefault(code).limits.organizations;

export const getProjectLimitForPlan = (code?: string | null): number | null =>
  getPlanDefinitionOrDefault(code).limits.projectsPerOrganization;
