export const MODULE_PERMISSION_ACTIONS = ["view", "create", "edit", "delete"];
export const MODULE_PERMISSION_DEFINITIONS = [
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
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const createActionSet = (value = false) => ({
    view: value,
    create: value,
    edit: value,
    delete: value
});
const createEmptyModulePermissions = () => ALL_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = createActionSet(false);
    return acc;
}, {});
const setModuleActions = (matrix, modules, actions, enabled) => {
    modules.forEach((moduleKey) => {
        actions.forEach((action) => {
            matrix[moduleKey][action] = enabled;
        });
    });
};
const resolveRole = (role) => {
    if (role === "OWNER" || role === "ADMIN" || role === "MEMBER" || role === "VIEWER")
        return role;
    return "MEMBER";
};
export const getDefaultModulePermissions = (role) => {
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
        setModuleActions(matrix, ["projects", "eap", "kanban", "timeline", "diagram", "budget", "documents"], ["create", "edit"], true);
        setModuleActions(matrix, ["projects", "eap", "kanban", "timeline", "diagram", "budget"], ["delete"], true);
        return matrix;
    }
    setModuleActions(matrix, [...ALL_MODULE_KEYS], ["view"], true);
    return matrix;
};
export const normalizeModulePermissionsForRole = (role, rawPermissions) => {
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
export const canAccessModule = (role, rawPermissions, moduleKey, action = "view") => {
    const matrix = normalizeModulePermissionsForRole(role, rawPermissions);
    return Boolean(matrix[moduleKey]?.[action]);
};
export const canManageOrganizationSettings = (role) => role === "OWNER" || role === "ADMIN";
export const canManageTeam = (role) => role === "OWNER" || role === "ADMIN";
export const canManageBilling = (role) => role === "OWNER";
export const canManageProjects = (role) => role === "OWNER" || role === "ADMIN" || role === "MEMBER";
export const canViewProjects = (role) => Boolean(role);
