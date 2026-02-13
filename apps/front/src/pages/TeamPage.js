import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, Search, TrendingUp, UserPlus, Users, X, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { canManageTeam, getDefaultModulePermissions, MODULE_PERMISSION_ACTIONS, MODULE_PERMISSION_DEFINITIONS, normalizeModulePermissionsForRole } from "../components/permissions";
import { apiUrl } from "../config/api";
const normalizeTaskStatus = (value) => (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ");
const resolveTaskStatus = (value) => {
    const key = normalizeTaskStatus(value);
    if (!key)
        return "BACKLOG";
    if (["done", "finalizado", "finalizada", "concluido", "concluida", "completed", "finished"].includes(key)) {
        return "DONE";
    }
    if (["in progress", "em andamento", "andamento", "fazendo", "doing", "em progresso", "progresso"].includes(key)) {
        return "IN_PROGRESS";
    }
    if (["delayed", "em atraso", "atrasado", "atrasada", "late", "overdue"].includes(key)) {
        return "DELAYED";
    }
    if (["risk", "em risco", "risco"].includes(key)) {
        return "RISK";
    }
    if (["blocked", "bloqueado", "bloqueada"].includes(key)) {
        return "BLOCKED";
    }
    if (["review", "revisao", "homologacao"].includes(key)) {
        return "REVIEW";
    }
    if (["todo", "a fazer", "afazer", "planejado", "planejamento"].includes(key)) {
        return "TODO";
    }
    if (["backlog", "nao iniciado", "não iniciado"].includes(key)) {
        return "BACKLOG";
    }
    return key.toUpperCase().replace(/ /g, "_");
};
const flattenWbsNodes = (nodes, projectId) => {
    const result = [];
    const stack = [...nodes];
    while (stack.length) {
        const node = stack.pop();
        if (!node)
            continue;
        if (node.children?.length) {
            stack.push(...node.children);
        }
        result.push({
            id: node.id,
            status: node.status,
            type: node.type,
            projectId,
            responsible: node.responsible
                ? {
                    membershipId: node.responsible.membershipId,
                    userId: node.responsible.userId
                }
                : null
        });
    }
    return result;
};
const getInitials = (value) => {
    const clean = value.trim();
    if (!clean)
        return "?";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
const LOCALE_OPTIONS = [
    { value: "pt-BR", label: "Português (Brasil)" },
    { value: "en-US", label: "English (US)" },
    { value: "es-ES", label: "Español" }
];
const TIMEZONE_OPTIONS = [
    { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
    { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
    { value: "America/Manaus", label: "Manaus (GMT-4)" },
    { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
    { value: "UTC", label: "UTC" }
];
const cloneModulePermissions = (permissions) => MODULE_PERMISSION_DEFINITIONS.reduce((acc, moduleDefinition) => {
    acc[moduleDefinition.key] = {
        view: Boolean(permissions[moduleDefinition.key]?.view),
        create: Boolean(permissions[moduleDefinition.key]?.create),
        edit: Boolean(permissions[moduleDefinition.key]?.edit),
        delete: Boolean(permissions[moduleDefinition.key]?.delete)
    };
    return acc;
}, {});
const areModulePermissionsEqual = (left, right) => MODULE_PERMISSION_DEFINITIONS.every((moduleDefinition) => MODULE_PERMISSION_ACTIONS.every((action) => Boolean(left[moduleDefinition.key]?.[action]) === Boolean(right[moduleDefinition.key]?.[action])));
export const TeamPage = () => {
    const { token, user } = useAuth();
    const { selectedOrganizationId, currentOrgRole, projects, organizations } = useOutletContext();
    const orgRole = (currentOrgRole ?? "MEMBER");
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [taskNodes, setTaskNodes] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksError, setTasksError] = useState(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteOrganizationId, setInviteOrganizationId] = useState(selectedOrganizationId ?? "");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteError, setInviteError] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [pendingRoles, setPendingRoles] = useState({});
    const [roleUpdatingMemberId, setRoleUpdatingMemberId] = useState(null);
    const [removingMemberId, setRemovingMemberId] = useState(null);
    const [memberActionError, setMemberActionError] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [profileDraft, setProfileDraft] = useState({
        fullName: "",
        email: "",
        corporateEmail: "",
        personalEmail: "",
        phone: "",
        address: "",
        cpf: "",
        jobTitle: "",
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
        twoFactorEnabled: false,
        status: "ACTIVE",
        avatarUrl: ""
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarPayload, setAvatarPayload] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [modulePermissionsDraft, setModulePermissionsDraft] = useState(() => getDefaultModulePermissions("MEMBER"));
    const [modulePermissionsBaseline, setModulePermissionsBaseline] = useState(() => getDefaultModulePermissions("MEMBER"));
    const openProfileModal = (member) => {
        setEditingMember(member);
        setProfileDraft({
            fullName: member.user.fullName ?? "",
            email: member.user.email ?? "",
            corporateEmail: member.user.corporateEmail ?? "",
            personalEmail: member.user.personalEmail ?? "",
            phone: member.user.phone ?? "",
            address: member.user.address ?? "",
            cpf: member.user.documentNumber ?? "",
            jobTitle: member.user.jobTitle ?? roleLabels[member.role] ?? member.role,
            locale: member.user.locale ?? "pt-BR",
            timezone: member.user.timezone ?? "America/Sao_Paulo",
            twoFactorEnabled: Boolean(member.user.twoFactorEnabled),
            status: member.user.active === false ? "INACTIVE" : "ACTIVE",
            avatarUrl: member.user.avatarUrl ?? ""
        });
        setAvatarPreview(member.user.avatarUrl ?? null);
        setAvatarPayload(null);
        setProfileError(null);
        const resolvedModulePermissions = normalizeModulePermissionsForRole(member.role, member.modulePermissions);
        setModulePermissionsDraft(cloneModulePermissions(resolvedModulePermissions));
        setModulePermissionsBaseline(cloneModulePermissions(resolvedModulePermissions));
    };
    const handleSaveProfile = async () => {
        if (!editingMember || !token || !selectedOrganizationId)
            return;
        setProfileSaving(true);
        setProfileError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${editingMember.id}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: profileDraft.fullName,
                    email: profileDraft.email,
                    corporateEmail: profileDraft.corporateEmail,
                    personalEmail: profileDraft.personalEmail,
                    phone: profileDraft.phone,
                    address: profileDraft.address,
                    cpf: profileDraft.cpf,
                    jobTitle: profileDraft.jobTitle,
                    locale: profileDraft.locale,
                    timezone: profileDraft.timezone,
                    status: profileDraft.status,
                    ...(canManageMemberAccess(editingMember) ? { modulePermissions: modulePermissionsDraft } : {}),
                    avatarBase64: avatarPayload?.base64,
                    avatarFileName: avatarPayload?.fileName,
                    avatarContentType: avatarPayload?.contentType
                })
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message ?? "Falha ao salvar perfil");
            }
            setEditingMember(null);
            await fetchMembers();
        }
        catch (err) {
            setProfileError(err instanceof Error ? err.message : "Falha ao salvar perfil");
        }
        finally {
            setProfileSaving(false);
        }
    };
    const fetchMembers = async () => {
        if (!token || !selectedOrganizationId)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members`), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = body?.message ?? "Falha ao carregar a equipe";
                throw new Error(message);
            }
            const fetchedMembers = (body.members ?? []);
            setMembers(fetchedMembers);
            setPendingRoles(fetchedMembers.reduce((acc, member) => {
                acc[member.id] = member.role;
                return acc;
            }, {}));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar a equipe");
            setMembers([]);
            setPendingRoles({});
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTasks = async () => {
        if (!token || !selectedOrganizationId)
            return;
        if (!projects?.length) {
            setTaskNodes([]);
            return;
        }
        setTasksLoading(true);
        setTasksError(null);
        try {
            const errors = [];
            const results = await Promise.all(projects.map(async (project) => {
                try {
                    const response = await fetch(apiUrl(`/projects/${project.id}/wbs`), {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
                        }
                    });
                    const body = await response.json().catch(() => ({}));
                    if (!response.ok) {
                        throw new Error(body?.message ?? "Falha ao carregar tarefas");
                    }
                    return flattenWbsNodes(body.nodes ?? [], project.id);
                }
                catch (err) {
                    errors.push(err instanceof Error ? err.message : "Falha ao carregar tarefas");
                    return [];
                }
            }));
            setTaskNodes(results.flat());
            if (errors.length) {
                setTasksError("Alguns dados de tarefas não puderam ser carregados.");
            }
        }
        finally {
            setTasksLoading(false);
        }
    };
    useEffect(() => {
        fetchMembers();
    }, [selectedOrganizationId, token]);
    useEffect(() => {
        fetchTasks();
    }, [selectedOrganizationId, token, projects]);
    const handleInvite = async (event) => {
        event.preventDefault();
        if (!token || !inviteOrganizationId)
            return;
        if (!inviteEmail.trim()) {
            setInviteError("Informe um e-mail válido.");
            return;
        }
        if (!inviteTargetOrganization) {
            setInviteError("Selecione uma organização para enviar o convite.");
            return;
        }
        if (!inviteRoleOptions.includes(inviteRole)) {
            setInviteError("Seu perfil não permite convidar este nível de acesso.");
            return;
        }
        setInviteSubmitting(true);
        setInviteError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${inviteOrganizationId}/members`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = body?.message ?? "Falha ao enviar convite";
                throw new Error(message);
            }
            setInviteEmail("");
            setInviteRole(inviteRoleOptions[0] ?? "MEMBER");
            if (inviteOrganizationId === selectedOrganizationId) {
                await fetchMembers();
            }
            setShowInvite(false);
        }
        catch (err) {
            setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
        }
        finally {
            setInviteSubmitting(false);
        }
    };
    const canManageCurrentOrgTeam = canManageTeam(orgRole);
    const currentUserId = user?.id ?? null;
    const roleLabels = {
        OWNER: "Liderança",
        ADMIN: "Administração",
        MEMBER: "Equipe",
        VIEWER: "Convidado"
    };
    const roleCapabilities = [
        {
            role: "OWNER",
            title: "Controle total da organização",
            items: ["Gerencia equipe e permissões", "Configura organização e plano", "Pode administrar owners e admins"]
        },
        {
            role: "ADMIN",
            title: "Administração operacional",
            items: ["Convida e edita membros", "Ajusta papéis de acesso", "Organiza projetos e responsáveis"]
        },
        {
            role: "MEMBER",
            title: "Execução do trabalho",
            items: ["Atualiza tarefas e entregas", "Colabora em projetos", "Não altera configuração global"]
        },
        {
            role: "VIEWER",
            title: "Acesso de leitura",
            items: ["Consulta dashboards e progresso", "Visualiza tarefas e documentos", "Sem edição de dados"]
        }
    ];
    const organizationsForInvite = useMemo(() => (organizations ?? []).filter((organization) => canManageTeam((organization.role ?? "MEMBER") ?? "MEMBER")), [organizations]);
    const inviteTargetOrganization = useMemo(() => organizationsForInvite.find((organization) => organization.id === inviteOrganizationId) ?? null, [inviteOrganizationId, organizationsForInvite]);
    const inviteTargetOrgRole = (inviteTargetOrganization?.role ?? "MEMBER") ?? "MEMBER";
    const canInviteAnyOrganization = organizationsForInvite.length > 0;
    const inviteRoleOptions = useMemo(() => {
        if (inviteTargetOrgRole === "OWNER")
            return ["ADMIN", "MEMBER", "VIEWER"];
        if (inviteTargetOrgRole === "ADMIN")
            return ["MEMBER", "VIEWER"];
        return [];
    }, [inviteTargetOrgRole]);
    const roleEditorOptions = useMemo(() => {
        if (orgRole === "OWNER")
            return ["ADMIN", "MEMBER", "VIEWER"];
        if (orgRole === "ADMIN")
            return ["MEMBER", "VIEWER"];
        return [];
    }, [orgRole]);
    const selectedInviteCapability = roleCapabilities.find((capability) => capability.role === inviteRole) ??
        roleCapabilities.find((capability) => capability.role === inviteRoleOptions[0]) ??
        null;
    const inviteRuleHint = useMemo(() => {
        if (inviteTargetOrgRole === "OWNER") {
            return "Liderança pode convidar Administração, Equipe e Convidado.";
        }
        if (inviteTargetOrgRole === "ADMIN") {
            return "Administração pode convidar apenas Equipe e Convidado.";
        }
        return "Seu papel atual não permite enviar convites.";
    }, [inviteTargetOrgRole]);
    useEffect(() => {
        if (!organizationsForInvite.length) {
            setInviteOrganizationId("");
            return;
        }
        setInviteOrganizationId((current) => {
            if (current && organizationsForInvite.some((organization) => organization.id === current)) {
                return current;
            }
            if (selectedOrganizationId && organizationsForInvite.some((organization) => organization.id === selectedOrganizationId)) {
                return selectedOrganizationId;
            }
            return organizationsForInvite[0].id;
        });
    }, [organizationsForInvite, selectedOrganizationId]);
    useEffect(() => {
        if (!inviteRoleOptions.length)
            return;
        if (!inviteRoleOptions.includes(inviteRole)) {
            setInviteRole(inviteRoleOptions[0]);
        }
    }, [inviteRoleOptions, inviteRole]);
    const canManageMemberAccess = (member) => {
        if (!canManageCurrentOrgTeam)
            return false;
        if (member.user.id === currentUserId)
            return false;
        if (orgRole === "OWNER")
            return member.role !== "OWNER";
        if (orgRole === "ADMIN")
            return member.role === "MEMBER" || member.role === "VIEWER";
        return true;
    };
    const hasModulePermissionChanges = useMemo(() => !areModulePermissionsEqual(modulePermissionsDraft, modulePermissionsBaseline), [modulePermissionsBaseline, modulePermissionsDraft]);
    const updateModulePermission = (moduleKey, action) => {
        setModulePermissionsDraft((current) => {
            const next = cloneModulePermissions(current);
            const nextValue = !next[moduleKey][action];
            next[moduleKey][action] = nextValue;
            if (action === "view" && !nextValue) {
                next[moduleKey].create = false;
                next[moduleKey].edit = false;
                next[moduleKey].delete = false;
            }
            if (action !== "view" && nextValue) {
                next[moduleKey].view = true;
            }
            return next;
        });
    };
    const resetModulePermissionsDraft = () => {
        setModulePermissionsDraft(cloneModulePermissions(modulePermissionsBaseline));
    };
    const handleRoleUpdate = async (member) => {
        if (!token || !selectedOrganizationId)
            return;
        const nextRole = pendingRoles[member.id] ?? member.role;
        if (nextRole === member.role)
            return;
        if (!canManageMemberAccess(member))
            return;
        setRoleUpdatingMemberId(member.id);
        setMemberActionError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${member.id}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: nextRole })
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message ?? "Não foi possível atualizar o papel do membro.");
            }
            const updatedMember = (body?.member ?? null);
            if (updatedMember) {
                setMembers((current) => current.map((item) => (item.id === member.id ? updatedMember : item)));
            }
            else {
                setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: nextRole } : item)));
            }
            setPendingRoles((current) => ({ ...current, [member.id]: nextRole }));
        }
        catch (err) {
            setMemberActionError(err instanceof Error ? err.message : "Não foi possível atualizar o papel do membro.");
        }
        finally {
            setRoleUpdatingMemberId(null);
        }
    };
    const handleRemoveMember = async (member) => {
        if (!token || !selectedOrganizationId)
            return;
        if (!canManageMemberAccess(member))
            return;
        if (!window.confirm(`Remover ${member.user.fullName || member.user.email} da organização?`))
            return;
        setRemovingMemberId(member.id);
        setMemberActionError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members/${member.id}`), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message ?? "Não foi possível remover o membro.");
            }
            await fetchMembers();
            await fetchTasks();
        }
        catch (err) {
            setMemberActionError(err instanceof Error ? err.message : "Não foi possível remover o membro.");
        }
        finally {
            setRemovingMemberId(null);
        }
    };
    const memberStats = useMemo(() => {
        return members.map((member) => {
            const assignedTasks = taskNodes.filter((node) => node.responsible?.membershipId === member.id || node.responsible?.userId === member.user.id);
            const total = assignedTasks.length;
            const done = assignedTasks.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
            const progress = total ? Math.round((done / total) * 100) : 0;
            const projectCount = new Set(assignedTasks.map((node) => node.projectId)).size;
            return {
                ...member,
                assignedTasks: total,
                completedTasks: done,
                progress,
                projectCount
            };
        });
    }, [members, taskNodes]);
    const totalTasks = taskNodes.length;
    const doneTasks = taskNodes.filter((node) => resolveTaskStatus(node.status) === "DONE").length;
    const productivity = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const departmentGroups = useMemo(() => {
        const counts = members.reduce((acc, member) => {
            acc[member.role] = (acc[member.role] ?? 0) + 1;
            return acc;
        }, { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 });
        return Object.keys(counts)
            .map((role) => ({ role, count: counts[role], label: roleLabels[role] }))
            .filter((group) => group.count > 0);
    }, [members]);
    const filteredMembers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return memberStats.filter((member) => {
            const roleMatches = roleFilter === "ALL" || member.role === roleFilter;
            const textMatches = !term ||
                member.user.fullName?.toLowerCase().includes(term) ||
                member.user.email?.toLowerCase().includes(term);
            return roleMatches && textMatches;
        });
    }, [memberStats, roleFilter, searchTerm]);
    const canConfigureModulePermissions = editingMember ? canManageMemberAccess(editingMember) : false;
    return (_jsxs("section", { className: "team-page", children: [_jsxs("header", { className: "team-header", children: [_jsxs("div", { className: "team-header__intro", children: [_jsx("p", { className: "team-header__eyebrow", children: "Governan\u00E7a de acesso" }), _jsx("h1", { children: "Equipes" }), _jsx("p", { className: "muted", children: "Gerencie membros, permiss\u00F5es e responsabilidades da organiza\u00E7\u00E3o em um painel \u00FAnico." })] }), canInviteAnyOrganization ? (_jsxs("button", { type: "button", className: "primary-button team-header__cta", onClick: () => setShowInvite((prev) => !prev), children: [_jsx(UserPlus, { size: 18 }), showInvite ? "Fechar" : "Adicionar membro"] })) : null] }), showInvite && canInviteAnyOrganization ? (_jsxs("article", { className: "team-invite-card", children: [_jsxs("div", { className: "team-invite-card__head", children: [_jsxs("div", { children: [_jsx("h2", { children: "Convide um membro" }), _jsx("p", { className: "muted", children: "Envie um convite com papel j\u00E1 alinhado \u00E0s regras de permiss\u00E3o." })] }), _jsx("span", { className: "team-invite-rule-badge", children: "Regras ativas" })] }), _jsx("p", { className: "team-invite-rule-hint", children: inviteRuleHint }), _jsxs("form", { className: "team-invite-form", onSubmit: handleInvite, children: [_jsxs("label", { children: [_jsx("span", { children: "Organiza\u00E7\u00E3o" }), _jsx("select", { value: inviteOrganizationId, onChange: (event) => setInviteOrganizationId(event.target.value), required: true, children: organizationsForInvite.map((organization) => (_jsx("option", { value: organization.id, children: organization.name }, organization.id))) })] }), _jsxs("label", { children: [_jsx("span", { children: "E-mail" }), _jsx("input", { type: "email", placeholder: "colega@empresa.com", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), required: true })] }), _jsxs("label", { children: [_jsx("span", { children: "Papel" }), _jsx("select", { value: inviteRole, onChange: (event) => setInviteRole(event.target.value), disabled: !inviteRoleOptions.length, children: inviteRoleOptions.map((roleOption) => (_jsx("option", { value: roleOption, children: roleLabels[roleOption] }, roleOption))) })] }), inviteError && _jsx("p", { className: "error-text", children: inviteError }), _jsx("button", { type: "submit", className: "primary-button", disabled: inviteSubmitting || !inviteOrganizationId || !inviteRoleOptions.length, children: inviteSubmitting ? "Enviando..." : "Enviar convite" })] }), selectedInviteCapability ? (_jsxs("div", { className: "team-invite-role-preview", children: [_jsxs("div", { className: "team-invite-role-preview__head", children: [_jsx("span", { className: `team-role-badge is-${selectedInviteCapability.role.toLowerCase()}`, children: roleLabels[selectedInviteCapability.role] }), _jsx("strong", { children: selectedInviteCapability.title })] }), _jsx("ul", { children: selectedInviteCapability.items.map((item) => (_jsx("li", { children: item }, item))) })] })) : null] })) : null, loading ? (_jsx("p", { className: "muted", children: "Carregando equipe..." })) : error ? (_jsx("p", { className: "error-text", children: error })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "team-overview", children: [_jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-blue", children: _jsx(Users, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Membros ativos" }), _jsx("strong", { children: members.length }), _jsx("span", { className: "muted", children: "Equipe cadastrada" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-green", children: _jsx(CheckCircle2, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Tarefas conclu\u00EDdas" }), _jsx("strong", { children: doneTasks }), _jsx("span", { className: "muted", children: totalTasks ? `${doneTasks} de ${totalTasks} tarefas` : "Sem tarefas atribuídas" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-orange", children: _jsx(TrendingUp, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Projetos atribu\u00EDdos" }), _jsx("strong", { children: projects?.length ?? 0 }), _jsx("span", { className: "muted", children: "Projetos vinculados \u00E0 organiza\u00E7\u00E3o" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-purple", children: _jsx(Users, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Produtividade" }), _jsx("strong", { children: totalTasks ? `${productivity}%` : "—" }), _jsx("span", { className: "muted", children: "M\u00E9dia de tarefas conclu\u00EDdas" })] }), _jsxs("div", { className: "team-progress", children: [_jsx("div", { className: "team-progress__bar", children: _jsx("span", { style: { width: `${productivity}%` } }) }), _jsx("small", { children: totalTasks ? `${productivity}% concluído` : "Sem dados suficientes" })] })] })] }), tasksLoading ? _jsx("p", { className: "muted", children: "Carregando tarefas atribu\u00EDdas..." }) : null, tasksError ? _jsx("p", { className: "error-text", children: tasksError }) : null, _jsxs("section", { className: "team-departments", children: [_jsxs("div", { className: "team-section-header", children: [_jsx("h2", { children: "Departamentos" }), _jsx("span", { className: "muted", children: "Distribui\u00E7\u00E3o por perfil de acesso" })] }), _jsxs("div", { className: "team-departments-grid", children: [departmentGroups.map((group) => (_jsx("div", { className: `team-department-card is-${group.role.toLowerCase()}`, children: _jsxs("div", { children: [_jsx("strong", { children: group.label }), _jsxs("span", { children: [group.count, " membros"] })] }) }, group.role))), !departmentGroups.length ? _jsx("p", { className: "muted", children: "Sem membros cadastrados." }) : null] })] }), _jsxs("section", { className: "team-governance", children: [_jsxs("div", { className: "team-section-header", children: [_jsx("h2", { children: "Painel de permiss\u00F5es" }), _jsx("span", { className: "muted", children: "N\u00EDveis de acesso e responsabilidades por papel" })] }), _jsx("div", { className: "team-governance-grid", children: roleCapabilities.map((capability) => (_jsxs("article", { className: `team-governance-card is-${capability.role.toLowerCase()}`, children: [_jsxs("div", { className: "team-governance-card__head", children: [_jsx("span", { className: `team-role-badge is-${capability.role.toLowerCase()}`, children: roleLabels[capability.role] }), _jsx(ShieldCheck, { size: 16 })] }), _jsx("h3", { children: capability.title }), _jsx("ul", { children: capability.items.map((item) => (_jsx("li", { children: item }, item))) })] }, capability.role))) })] }), _jsxs("section", { className: "team-members", children: [_jsxs("div", { className: "team-section-header", children: [_jsx("h2", { children: "Membros" }), _jsxs("div", { className: "team-members-tools", children: [_jsxs("div", { className: "team-role-filter", children: [_jsx("label", { htmlFor: "teamRoleFilter", children: "Papel" }), _jsxs("select", { id: "teamRoleFilter", value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: [_jsx("option", { value: "ALL", children: "Todos os pap\u00E9is" }), _jsx("option", { value: "OWNER", children: roleLabels.OWNER }), _jsx("option", { value: "ADMIN", children: roleLabels.ADMIN }), _jsx("option", { value: "MEMBER", children: roleLabels.MEMBER }), _jsx("option", { value: "VIEWER", children: roleLabels.VIEWER })] })] }), _jsxs("div", { className: "team-search", children: [_jsx(Search, { size: 16 }), _jsx("input", { type: "search", placeholder: "Buscar membros...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] })] })] }), memberActionError ? _jsx("p", { className: "error-text", children: memberActionError }) : null, _jsxs("div", { className: "team-members-grid", children: [filteredMembers.map((member) => (_jsxs("article", { className: "team-member-card", children: [_jsxs("header", { children: [_jsx("div", { className: "team-member-avatar", children: member.user.avatarUrl ? (_jsx("img", { src: member.user.avatarUrl, alt: `Foto de ${member.user.fullName || member.user.email}` })) : (getInitials(member.user.fullName || member.user.email)) }), _jsxs("div", { className: "team-member-info", children: [_jsxs("h3", { children: [member.user.fullName || member.user.email, currentUserId === member.user.id ? _jsx("span", { className: "muted", children: " (voc\u00EA)" }) : null] }), _jsx("p", { children: member.user.email })] }), _jsxs("div", { className: "team-member-actions", children: [_jsx("span", { className: `team-role-badge is-${member.role.toLowerCase()}`, children: roleLabels[member.role] ?? member.role }), canManageMemberAccess(member) ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "team-role-editor", "aria-label": `Permissão de ${member.user.fullName || member.user.email}`, children: [_jsx("span", { children: "Permiss\u00E3o" }), _jsx("select", { value: pendingRoles[member.id] ?? member.role, onChange: (event) => setPendingRoles((current) => ({
                                                                                    ...current,
                                                                                    [member.id]: event.target.value
                                                                                })), children: roleEditorOptions.map((roleOption) => (_jsx("option", { value: roleOption, children: roleLabels[roleOption] }, roleOption))) })] }), _jsx("button", { type: "button", className: "team-access-button", onClick: () => handleRoleUpdate(member), disabled: roleUpdatingMemberId === member.id || (pendingRoles[member.id] ?? member.role) === member.role, children: roleUpdatingMemberId === member.id ? "Salvando..." : "Aplicar acesso" }), _jsxs("button", { type: "button", className: "team-remove-button", onClick: () => handleRemoveMember(member), disabled: removingMemberId === member.id, children: [_jsx(Trash2, { size: 14 }), removingMemberId === member.id ? "Removendo..." : "Remover"] })] })) : null, _jsxs("button", { type: "button", className: "team-edit-button", onClick: () => openProfileModal(member), "aria-label": "Editar perfil", children: [_jsx(Pencil, { size: 16 }), "Editar perfil"] })] })] }), _jsxs("div", { className: "team-member-stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Tarefas" }), _jsx("strong", { children: member.assignedTasks ? `${member.completedTasks}/${member.assignedTasks}` : "—" })] }), _jsxs("div", { children: [_jsx("span", { children: "Projetos" }), _jsx("strong", { children: member.projectCount ?? 0 })] })] }), _jsxs("div", { className: "team-member-progress", children: [_jsx("div", { className: "team-progress__bar", children: _jsx("span", { style: { width: `${member.progress}%` } }) }), _jsx("span", { children: member.assignedTasks ? `${member.progress}% concluído` : "Sem tarefas atribuídas" })] })] }, member.id))), !filteredMembers.length ? (_jsxs("div", { className: "team-empty", children: [_jsx("h3", { children: "Nenhum membro encontrado" }), _jsx("p", { children: "Verifique o filtro ou convide novos membros para a organiza\u00E7\u00E3o." })] })) : null] })] })] })), editingMember ? (_jsx("div", { className: "team-modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "team-modal", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h2", { children: "Perfil do membro" }), _jsx("p", { className: "muted", children: "Dados cadastrados na organiza\u00E7\u00E3o." })] }), _jsx("button", { type: "button", className: "team-modal-close", onClick: () => setEditingMember(null), children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "team-modal-body", children: [_jsxs("div", { className: "team-modal-avatar-wrap", children: [_jsxs("div", { className: "team-modal-avatar", children: [avatarPreview ? (_jsx("img", { src: avatarPreview, alt: "Foto do perfil" })) : (getInitials(profileDraft.fullName || profileDraft.email)), _jsxs("label", { className: "team-avatar-upload", children: [_jsx("input", { type: "file", accept: "image/*", onChange: (event) => {
                                                                const file = event.target.files?.[0];
                                                                if (!file)
                                                                    return;
                                                                const url = URL.createObjectURL(file);
                                                                setAvatarPreview(url);
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    const result = typeof reader.result === "string" ? reader.result : "";
                                                                    setAvatarPayload({
                                                                        base64: result,
                                                                        fileName: file.name,
                                                                        contentType: file.type || "image/png"
                                                                    });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            } }), "Trocar foto"] })] }), _jsxs("div", { className: "team-profile-meta", children: [_jsx("span", { className: `team-role-badge is-${editingMember.role.toLowerCase()}`, children: roleLabels[editingMember.role] ?? editingMember.role }), _jsxs("span", { className: `team-profile-security ${profileDraft.twoFactorEnabled ? "is-on" : "is-off"}`, children: ["2FA ", profileDraft.twoFactorEnabled ? "ativo" : "desativado"] })] })] }), _jsxs("div", { className: "team-modal-grid", children: [_jsxs("div", { children: [_jsx("label", { children: "Nome completo" }), _jsx("input", { type: "text", value: profileDraft.fullName, onChange: (event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value })), placeholder: "Nome completo" })] }), _jsxs("div", { children: [_jsx("label", { children: "E-mail de acesso" }), _jsx("input", { type: "email", value: profileDraft.email, onChange: (event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value })), placeholder: "email@empresa.com" })] }), _jsxs("div", { children: [_jsx("label", { children: "E-mail corporativo" }), _jsx("input", { type: "email", value: profileDraft.corporateEmail, onChange: (event) => setProfileDraft((prev) => ({ ...prev, corporateEmail: event.target.value })), placeholder: "nome.sobrenome@empresa.com" })] }), _jsxs("div", { children: [_jsx("label", { children: "E-mail pessoal" }), _jsx("input", { type: "email", value: profileDraft.personalEmail, onChange: (event) => setProfileDraft((prev) => ({ ...prev, personalEmail: event.target.value })), placeholder: "nome@gmail.com" })] }), _jsxs("div", { children: [_jsx("label", { children: "Telefone" }), _jsx("input", { type: "tel", value: profileDraft.phone, onChange: (event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value })), placeholder: "(11) 99999-0000" })] }), _jsxs("div", { children: [_jsx("label", { children: "CPF" }), _jsx("input", { type: "text", value: profileDraft.cpf, onChange: (event) => setProfileDraft((prev) => ({ ...prev, cpf: event.target.value })), placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { children: "Fun\u00E7\u00E3o/Cargo" }), _jsx("input", { type: "text", value: profileDraft.jobTitle, onChange: (event) => setProfileDraft((prev) => ({ ...prev, jobTitle: event.target.value })), placeholder: roleLabels[editingMember.role] ?? editingMember.role })] }), _jsxs("div", { children: [_jsx("label", { children: "Idioma" }), _jsx("select", { value: profileDraft.locale, onChange: (event) => setProfileDraft((prev) => ({ ...prev, locale: event.target.value })), children: LOCALE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { children: "Fuso hor\u00E1rio" }), _jsx("select", { value: profileDraft.timezone, onChange: (event) => setProfileDraft((prev) => ({ ...prev, timezone: event.target.value })), children: TIMEZONE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "team-modal-field--span-2", children: [_jsx("label", { children: "Endere\u00E7o" }), _jsx("input", { type: "text", value: profileDraft.address, onChange: (event) => setProfileDraft((prev) => ({ ...prev, address: event.target.value })), placeholder: "Rua, n\u00FAmero, bairro, cidade" })] }), _jsxs("div", { className: "team-modal-field--span-2", children: [_jsx("label", { children: "Status" }), _jsxs("div", { className: "team-status-toggle", children: [_jsx("button", { type: "button", className: profileDraft.status === "ACTIVE" ? "is-active" : "", onClick: () => setProfileDraft((prev) => ({ ...prev, status: "ACTIVE" })), children: "Ativo" }), _jsx("button", { type: "button", className: profileDraft.status === "INACTIVE" ? "is-active" : "", onClick: () => setProfileDraft((prev) => ({ ...prev, status: "INACTIVE" })), children: "Desativado" })] })] }), canConfigureModulePermissions ? (_jsxs("div", { className: "team-modal-field--span-2 team-module-matrix-wrap", children: [_jsxs("div", { className: "team-module-matrix-head", children: [_jsxs("div", { children: [_jsx("label", { children: "Matriz de permiss\u00F5es por m\u00F3dulo" }), _jsx("p", { className: "muted", children: "Administre acesso detalhado de cada usu\u00E1rio por m\u00F3dulo." })] }), _jsx("button", { type: "button", className: "secondary-button team-module-matrix-reset", onClick: resetModulePermissionsDraft, disabled: !hasModulePermissionChanges, children: "Reverter matriz" })] }), _jsx("div", { className: "team-module-matrix-table-wrap", children: _jsxs("table", { className: "team-module-matrix-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "M\u00F3dulo" }), _jsx("th", { children: "Visualizar" }), _jsx("th", { children: "Criar" }), _jsx("th", { children: "Editar" }), _jsx("th", { children: "Excluir" })] }) }), _jsx("tbody", { children: MODULE_PERMISSION_DEFINITIONS.map((moduleDefinition) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: moduleDefinition.label }), _jsx("small", { children: moduleDefinition.description })] }), MODULE_PERMISSION_ACTIONS.map((action) => (_jsx("td", { children: _jsx("label", { className: "team-module-matrix-check", "aria-label": `${moduleDefinition.label} - ${action}`, children: _jsx("input", { type: "checkbox", checked: Boolean(modulePermissionsDraft[moduleDefinition.key]?.[action]), onChange: () => updateModulePermission(moduleDefinition.key, action) }) }) }, `${moduleDefinition.key}-${action}`)))] }, moduleDefinition.key))) })] }) })] })) : null] })] }), _jsxs("footer", { className: "team-modal-footer", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: () => setEditingMember(null), children: "Fechar" }), _jsx("button", { type: "button", className: "primary-button", onClick: handleSaveProfile, disabled: profileSaving, children: profileSaving ? "Salvando..." : "Salvar alterações" })] }), profileError ? _jsx("p", { className: "error-text", children: profileError }) : null] }) })) : null] }));
};
