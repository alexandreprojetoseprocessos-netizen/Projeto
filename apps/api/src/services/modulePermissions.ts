import { MembershipRole } from "@prisma/client";

export const MODULE_PERMISSION_KEYS = [
  "organization",
  "dashboard",
  "projects",
  "eap",
  "kanban",
  "timeline",
  "diagram",
  "budget",
  "documents",
  "reports",
  "team",
  "plan"
] as const;

export const MODULE_PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;

export type ModulePermissionKey = (typeof MODULE_PERMISSION_KEYS)[number];
export type ModulePermissionAction = (typeof MODULE_PERMISSION_ACTIONS)[number];
export type ModulePermissionMatrix = Record<ModulePermissionKey, Record<ModulePermissionAction, boolean>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createActionSet = (value = false): Record<ModulePermissionAction, boolean> => ({
  view: value,
  create: value,
  edit: value,
  delete: value
});

const createEmptyMatrix = (): ModulePermissionMatrix =>
  MODULE_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = createActionSet(false);
    return acc;
  }, {} as ModulePermissionMatrix);

const setActionsForModules = (
  matrix: ModulePermissionMatrix,
  modules: ModulePermissionKey[],
  actions: ModulePermissionAction[],
  enabled: boolean
) => {
  modules.forEach((moduleKey) => {
    actions.forEach((action) => {
      matrix[moduleKey][action] = enabled;
    });
  });
};

export const getDefaultModulePermissions = (role: MembershipRole): ModulePermissionMatrix => {
  const matrix = createEmptyMatrix();

  if (role === MembershipRole.OWNER) {
    setActionsForModules(matrix, [...MODULE_PERMISSION_KEYS], [...MODULE_PERMISSION_ACTIONS], true);
    return matrix;
  }

  if (role === MembershipRole.ADMIN) {
    setActionsForModules(matrix, [...MODULE_PERMISSION_KEYS], ["view"], true);
    setActionsForModules(matrix, [...MODULE_PERMISSION_KEYS], ["create", "edit", "delete"], true);
    setActionsForModules(matrix, ["plan"], ["create", "edit", "delete"], false);
    return matrix;
  }

  if (role === MembershipRole.MEMBER) {
    setActionsForModules(matrix, [...MODULE_PERMISSION_KEYS], ["view"], true);
    setActionsForModules(
      matrix,
      ["projects", "eap", "kanban", "timeline", "diagram", "budget", "documents"],
      ["create", "edit"],
      true
    );
    setActionsForModules(matrix, ["projects", "eap", "kanban", "timeline", "diagram", "budget"], ["delete"], true);
    return matrix;
  }

  setActionsForModules(matrix, [...MODULE_PERMISSION_KEYS], ["view"], true);
  return matrix;
};

export const normalizeModulePermissionsForRole = (
  role: MembershipRole,
  rawPermissions: unknown
): ModulePermissionMatrix => {
  const defaults = getDefaultModulePermissions(role);
  if (!isRecord(rawPermissions)) {
    return defaults;
  }

  const normalized = createEmptyMatrix();
  MODULE_PERMISSION_KEYS.forEach((moduleKey) => {
    const moduleValue = rawPermissions[moduleKey];
    const moduleRecord = isRecord(moduleValue) ? moduleValue : null;
    MODULE_PERMISSION_ACTIONS.forEach((action) => {
      const value = moduleRecord?.[action];
      normalized[moduleKey][action] = typeof value === "boolean" ? value : defaults[moduleKey][action];
    });
    if (!normalized[moduleKey].view) {
      normalized[moduleKey].create = false;
      normalized[moduleKey].edit = false;
      normalized[moduleKey].delete = false;
    }
  });

  return normalized;
};
