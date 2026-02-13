export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type ModulePermissionKey =
  | "organization"
  | "dashboard"
  | "projects"
  | "eap"
  | "kanban"
  | "timeline"
  | "diagram"
  | "budget"
  | "documents"
  | "reports"
  | "team"
  | "plan";

export type ModulePermissionAction = "view" | "create" | "edit" | "delete";

export type ModulePermissionMatrix = Record<ModulePermissionKey, Record<ModulePermissionAction, boolean>>;

export const MODULE_PERMISSION_ACTIONS: ModulePermissionAction[] = ["view", "create", "edit", "delete"];

export const MODULE_PERMISSION_DEFINITIONS: Array<{
  key: ModulePermissionKey;
  label: string;
  description: string;
}> = [
  { key: "organization", label: "Organizacao", description: "Troca e configuracao da organizacao ativa" },
  { key: "dashboard", label: "Dashboard", description: "Visao geral e indicadores" },
  { key: "projects", label: "Projetos", description: "Cadastro e gestao de projetos" },
  { key: "eap", label: "EAP", description: "Estrutura analitica do projeto" },
  { key: "kanban", label: "Kanban", description: "Quadro de execucao por status" },
  { key: "timeline", label: "Cronograma", description: "Linha do tempo e datas" },
  { key: "diagram", label: "Diagrama", description: "Visualizacoes de relacionamento" },
  { key: "budget", label: "Orcamento", description: "Custos, atividades e horas" },
  { key: "documents", label: "Documentos", description: "Arquivos e anexos" },
  { key: "reports", label: "Relatorios", description: "Consolidacoes e desempenho" },
  { key: "team", label: "Equipes", description: "Membros, papeis e permissoes" },
  { key: "plan", label: "Meu plano", description: "Assinatura e limites" }
];

const ALL_MODULE_KEYS = MODULE_PERMISSION_DEFINITIONS.map((item) => item.key);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createActionSet = (value = false): Record<ModulePermissionAction, boolean> => ({
  view: value,
  create: value,
  edit: value,
  delete: value
});

const createEmptyModulePermissions = (): ModulePermissionMatrix =>
  ALL_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = createActionSet(false);
    return acc;
  }, {} as ModulePermissionMatrix);

const setModuleActions = (
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

const resolveRole = (role?: OrgRole | null): OrgRole => {
  if (role === "OWNER" || role === "ADMIN" || role === "MEMBER" || role === "VIEWER") return role;
  return "MEMBER";
};

export const getDefaultModulePermissions = (role?: OrgRole | null): ModulePermissionMatrix => {
  const matrix = createEmptyModulePermissions();
  const normalizedRole = resolveRole(role);

  if (normalizedRole === "OWNER") {
    setModuleActions(matrix, [...ALL_MODULE_KEYS], [...MODULE_PERMISSION_ACTIONS], true);
    return matrix;
  }

  if (normalizedRole === "ADMIN") {
    setModuleActions(matrix, [...ALL_MODULE_KEYS], ["view"], true);
    setModuleActions(matrix, [...ALL_MODULE_KEYS], ["create", "edit", "delete"], true);
    setModuleActions(matrix, ["plan"], ["create", "edit", "delete"], false);
    return matrix;
  }

  if (normalizedRole === "MEMBER") {
    setModuleActions(matrix, [...ALL_MODULE_KEYS], ["view"], true);
    setModuleActions(
      matrix,
      ["projects", "eap", "kanban", "timeline", "diagram", "budget", "documents"],
      ["create", "edit"],
      true
    );
    setModuleActions(matrix, ["projects", "eap", "kanban", "timeline", "diagram", "budget"], ["delete"], true);
    return matrix;
  }

  setModuleActions(matrix, [...ALL_MODULE_KEYS], ["view"], true);
  return matrix;
};

export const normalizeModulePermissionsForRole = (
  role: OrgRole | null | undefined,
  rawPermissions: unknown
): ModulePermissionMatrix => {
  const defaults = getDefaultModulePermissions(role);
  if (!isRecord(rawPermissions)) {
    return defaults;
  }

  const normalized = createEmptyModulePermissions();
  ALL_MODULE_KEYS.forEach((moduleKey) => {
    const rawModule = rawPermissions[moduleKey];
    const moduleRecord = isRecord(rawModule) ? rawModule : null;

    MODULE_PERMISSION_ACTIONS.forEach((action) => {
      const rawValue = moduleRecord?.[action];
      normalized[moduleKey][action] = typeof rawValue === "boolean" ? rawValue : defaults[moduleKey][action];
    });

    if (!normalized[moduleKey].view) {
      normalized[moduleKey].create = false;
      normalized[moduleKey].edit = false;
      normalized[moduleKey].delete = false;
    }
  });

  return normalized;
};

export const canAccessModule = (
  role: OrgRole | null | undefined,
  rawPermissions: unknown,
  moduleKey: ModulePermissionKey,
  action: ModulePermissionAction = "view"
) => {
  const matrix = normalizeModulePermissionsForRole(role, rawPermissions);
  return Boolean(matrix[moduleKey]?.[action]);
};

export const canManageOrganizationSettings = (role?: OrgRole | null) =>
  role === "OWNER" || role === "ADMIN";

export const canManageTeam = (role?: OrgRole | null) => role === "OWNER" || role === "ADMIN";

export const canManageBilling = (role?: OrgRole | null) => role === "OWNER";

export const canManageProjects = (role?: OrgRole | null) =>
  role === "OWNER" || role === "ADMIN" || role === "MEMBER";

export const canViewProjects = (role?: OrgRole | null) => Boolean(role);
