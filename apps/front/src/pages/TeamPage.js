import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, Search, TrendingUp, UserPlus, Users, X, Pencil } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { canManageTeam } from "../components/permissions";
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
export const TeamPage = () => {
    const { token, user } = useAuth();
    const { selectedOrganizationId, currentOrgRole, projects } = useOutletContext();
    const orgRole = (currentOrgRole ?? "MEMBER");
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [taskNodes, setTaskNodes] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksError, setTasksError] = useState(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteError, setInviteError] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMember, setEditingMember] = useState(null);
    const [profileDraft, setProfileDraft] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        cpf: "",
        roleLabel: "",
        status: "ACTIVE",
        avatarUrl: ""
    });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarPayload, setAvatarPayload] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const openProfileModal = (member) => {
        setEditingMember(member);
        setProfileDraft({
            fullName: member.user.fullName ?? "",
            email: member.user.email ?? "",
            phone: member.user.phone ?? "",
            address: member.user.address ?? "",
            cpf: member.user.documentNumber ?? "",
            roleLabel: member.user.jobTitle ?? roleLabels[member.role] ?? member.role,
            status: member.user.active === false ? "INACTIVE" : "ACTIVE",
            avatarUrl: member.user.avatarUrl ?? ""
        });
        setAvatarPreview(member.user.avatarUrl ?? null);
        setAvatarPayload(null);
        setProfileError(null);
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
                    phone: profileDraft.phone,
                    address: profileDraft.address,
                    cpf: profileDraft.cpf,
                    jobTitle: profileDraft.roleLabel,
                    status: profileDraft.status,
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
            setMembers(body.members ?? []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar a equipe");
            setMembers([]);
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
                            Authorization: `Bearer ${token}`
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
        if (!token || !selectedOrganizationId)
            return;
        if (!inviteEmail.trim()) {
            setInviteError("Informe um e-mail válido.");
            return;
        }
        setInviteSubmitting(true);
        setInviteError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${selectedOrganizationId}/members`), {
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
            setInviteRole("MEMBER");
            await fetchMembers();
            setShowInvite(false);
        }
        catch (err) {
            setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
        }
        finally {
            setInviteSubmitting(false);
        }
    };
    const canInvite = canManageTeam(orgRole);
    const currentUserId = user?.id ?? null;
    const roleLabels = {
        OWNER: "Liderança",
        ADMIN: "Administração",
        MEMBER: "Equipe",
        VIEWER: "Convidado"
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
        if (!searchTerm.trim())
            return memberStats;
        const term = searchTerm.trim().toLowerCase();
        return memberStats.filter((member) => member.user.fullName?.toLowerCase().includes(term) || member.user.email?.toLowerCase().includes(term));
    }, [memberStats, searchTerm]);
    return (_jsxs("section", { className: "team-page", children: [_jsxs("header", { className: "team-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Equipes" }), _jsx("p", { className: "muted", children: "Gerencie os membros e departamentos da sua organiza\u00E7\u00E3o." })] }), canInvite ? (_jsxs("button", { type: "button", className: "primary-button team-header__cta", onClick: () => setShowInvite((prev) => !prev), children: [_jsx(UserPlus, { size: 18 }), showInvite ? "Fechar" : "Adicionar membro"] })) : null] }), showInvite && canInvite ? (_jsxs("article", { className: "team-invite-card", children: [_jsx("h2", { children: "Convide um membro" }), _jsx("p", { className: "muted", children: "Envie um convite para colaborar com sua organiza\u00E7\u00E3o." }), _jsxs("form", { className: "team-invite-form", onSubmit: handleInvite, children: [_jsxs("label", { children: [_jsx("span", { children: "E-mail" }), _jsx("input", { type: "email", placeholder: "colega@empresa.com", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), required: true })] }), _jsxs("label", { children: [_jsx("span", { children: "Papel" }), _jsxs("select", { value: inviteRole, onChange: (event) => setInviteRole(event.target.value), children: [_jsx("option", { value: "ADMIN", children: "Admin" }), _jsx("option", { value: "MEMBER", children: "Membro" }), _jsx("option", { value: "VIEWER", children: "Convidado" })] })] }), inviteError && _jsx("p", { className: "error-text", children: inviteError }), _jsx("button", { type: "submit", className: "primary-button", disabled: inviteSubmitting, children: inviteSubmitting ? "Enviando..." : "Enviar convite" })] })] })) : null, loading ? (_jsx("p", { className: "muted", children: "Carregando equipe..." })) : error ? (_jsx("p", { className: "error-text", children: error })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "team-overview", children: [_jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-blue", children: _jsx(Users, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Membros ativos" }), _jsx("strong", { children: members.length }), _jsx("span", { className: "muted", children: "Equipe cadastrada" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-green", children: _jsx(CheckCircle2, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Tarefas conclu\u00EDdas" }), _jsx("strong", { children: doneTasks }), _jsx("span", { className: "muted", children: totalTasks ? `${doneTasks} de ${totalTasks} tarefas` : "Sem tarefas atribuídas" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-orange", children: _jsx(TrendingUp, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Projetos atribu\u00EDdos" }), _jsx("strong", { children: projects?.length ?? 0 }), _jsx("span", { className: "muted", children: "Projetos vinculados \u00E0 organiza\u00E7\u00E3o" })] })] }), _jsxs("article", { className: "team-overview-card", children: [_jsx("div", { className: "team-overview-icon is-purple", children: _jsx(Users, { size: 22 }) }), _jsxs("div", { children: [_jsx("h3", { children: "Produtividade" }), _jsx("strong", { children: totalTasks ? `${productivity}%` : "—" }), _jsx("span", { className: "muted", children: "M\u00E9dia de tarefas conclu\u00EDdas" })] }), _jsxs("div", { className: "team-progress", children: [_jsx("div", { className: "team-progress__bar", children: _jsx("span", { style: { width: `${productivity}%` } }) }), _jsx("small", { children: totalTasks ? `${productivity}% concluído` : "Sem dados suficientes" })] })] })] }), tasksLoading ? _jsx("p", { className: "muted", children: "Carregando tarefas atribu\u00EDdas..." }) : null, tasksError ? _jsx("p", { className: "error-text", children: tasksError }) : null, _jsxs("section", { className: "team-departments", children: [_jsxs("div", { className: "team-section-header", children: [_jsx("h2", { children: "Departamentos" }), _jsx("span", { className: "muted", children: "Distribui\u00E7\u00E3o por perfil de acesso" })] }), _jsxs("div", { className: "team-departments-grid", children: [departmentGroups.map((group) => (_jsx("div", { className: `team-department-card is-${group.role.toLowerCase()}`, children: _jsxs("div", { children: [_jsx("strong", { children: group.label }), _jsxs("span", { children: [group.count, " membros"] })] }) }, group.role))), !departmentGroups.length ? _jsx("p", { className: "muted", children: "Sem membros cadastrados." }) : null] })] }), _jsxs("section", { className: "team-members", children: [_jsxs("div", { className: "team-section-header", children: [_jsx("h2", { children: "Membros" }), _jsxs("div", { className: "team-search", children: [_jsx(Search, { size: 16 }), _jsx("input", { type: "search", placeholder: "Buscar membros...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] })] }), _jsxs("div", { className: "team-members-grid", children: [filteredMembers.map((member) => (_jsxs("article", { className: "team-member-card", children: [_jsxs("header", { children: [_jsx("div", { className: "team-member-avatar", children: member.user.avatarUrl ? (_jsx("img", { src: member.user.avatarUrl, alt: `Foto de ${member.user.fullName || member.user.email}` })) : (getInitials(member.user.fullName || member.user.email)) }), _jsxs("div", { className: "team-member-info", children: [_jsxs("h3", { children: [member.user.fullName || member.user.email, currentUserId === member.user.id ? _jsx("span", { className: "muted", children: " (voc\u00EA)" }) : null] }), _jsx("p", { children: member.user.email })] }), _jsxs("button", { type: "button", className: "team-edit-button", onClick: () => openProfileModal(member), "aria-label": "Editar perfil", children: [_jsx(Pencil, { size: 16 }), "Editar perfil"] }), _jsx("span", { className: `team-role-badge is-${member.role.toLowerCase()}`, children: roleLabels[member.role] ?? member.role })] }), _jsxs("div", { className: "team-member-stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Tarefas" }), _jsx("strong", { children: member.assignedTasks ? `${member.completedTasks}/${member.assignedTasks}` : "—" })] }), _jsxs("div", { children: [_jsx("span", { children: "Projetos" }), _jsx("strong", { children: member.projectCount ?? 0 })] })] }), _jsxs("div", { className: "team-member-progress", children: [_jsx("div", { className: "team-progress__bar", children: _jsx("span", { style: { width: `${member.progress}%` } }) }), _jsx("span", { children: member.assignedTasks ? `${member.progress}% concluído` : "Sem tarefas atribuídas" })] })] }, member.id))), !filteredMembers.length ? (_jsxs("div", { className: "team-empty", children: [_jsx("h3", { children: "Nenhum membro encontrado" }), _jsx("p", { children: "Verifique o filtro ou convide novos membros para a organiza\u00E7\u00E3o." })] })) : null] })] })] })), editingMember ? (_jsx("div", { className: "team-modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "team-modal", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h2", { children: "Perfil do membro" }), _jsx("p", { className: "muted", children: "Dados cadastrados na organiza\u00E7\u00E3o." })] }), _jsx("button", { type: "button", className: "team-modal-close", onClick: () => setEditingMember(null), children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "team-modal-body", children: [_jsxs("div", { className: "team-modal-avatar", children: [avatarPreview ? (_jsx("img", { src: avatarPreview, alt: "Foto do perfil" })) : (getInitials(profileDraft.fullName || profileDraft.email)), _jsxs("label", { className: "team-avatar-upload", children: [_jsx("input", { type: "file", accept: "image/*", onChange: (event) => {
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
                                                    } }), "Trocar foto"] })] }), _jsxs("div", { className: "team-modal-grid", children: [_jsxs("div", { children: [_jsx("label", { children: "Nome" }), _jsx("input", { type: "text", value: profileDraft.fullName, onChange: (event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value })), placeholder: "Nome completo" })] }), _jsxs("div", { children: [_jsx("label", { children: "E-mail" }), _jsx("input", { type: "email", value: profileDraft.email, onChange: (event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value })), placeholder: "email@empresa.com" })] }), _jsxs("div", { children: [_jsx("label", { children: "Telefone" }), _jsx("input", { type: "tel", value: profileDraft.phone, onChange: (event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value })), placeholder: "(11) 99999-0000" })] }), _jsxs("div", { children: [_jsx("label", { children: "CPF" }), _jsx("input", { type: "text", value: profileDraft.cpf, onChange: (event) => setProfileDraft((prev) => ({ ...prev, cpf: event.target.value })), placeholder: "000.000.000-00" })] }), _jsxs("div", { children: [_jsx("label", { children: "Endere\u00E7o" }), _jsx("input", { type: "text", value: profileDraft.address, onChange: (event) => setProfileDraft((prev) => ({ ...prev, address: event.target.value })), placeholder: "Rua, n\u00FAmero, cidade" })] }), _jsxs("div", { children: [_jsx("label", { children: "Fun\u00E7\u00E3o" }), _jsx("input", { type: "text", value: profileDraft.roleLabel, onChange: (event) => setProfileDraft((prev) => ({ ...prev, roleLabel: event.target.value })), placeholder: roleLabels[editingMember.role] ?? editingMember.role })] }), _jsxs("div", { children: [_jsx("label", { children: "Status" }), _jsxs("div", { className: "team-status-toggle", children: [_jsx("button", { type: "button", className: profileDraft.status === "ACTIVE" ? "is-active" : "", onClick: () => setProfileDraft((prev) => ({ ...prev, status: "ACTIVE" })), children: "Ativo" }), _jsx("button", { type: "button", className: profileDraft.status === "INACTIVE" ? "is-active" : "", onClick: () => setProfileDraft((prev) => ({ ...prev, status: "INACTIVE" })), children: "Desativado" })] })] })] })] }), _jsxs("footer", { className: "team-modal-footer", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: () => setEditingMember(null), children: "Fechar" }), _jsx("button", { type: "button", className: "primary-button", onClick: handleSaveProfile, disabled: profileSaving, children: profileSaving ? "Salvando..." : "Salvar alterações" })] }), profileError ? _jsx("p", { className: "error-text", children: profileError }) : null] }) })) : null] }));
};
