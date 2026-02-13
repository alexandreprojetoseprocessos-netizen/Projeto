import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ProjectPortfolio } from "../components/ProjectPortfolio";
import ProjectTrashModal from "../components/ProjectTrashModal";
import { canManageProjects } from "../components/permissions";
import { Trash2 } from "lucide-react";
import { apiUrl } from "../config/api";
import { getPlanDefinition } from "../config/plans";
const PROJECT_STATUS_OPTIONS = [
    { value: "PLANNED", label: "Planejamento" },
    { value: "IN_PROGRESS", label: "Em andamento" },
    { value: "COMPLETED", label: "Concluído" },
    { value: "ON_HOLD", label: "Pausado" },
    { value: "CANCELED", label: "Cancelado" }
];
const PROJECT_PRIORITY_OPTIONS = [
    { value: "CRITICAL", label: "Urgente" },
    { value: "HIGH", label: "Alta" },
    { value: "MEDIUM", label: "Média" },
    { value: "LOW", label: "Baixa" }
];
const normalizeProjectStatus = (value) => {
    const normalized = (value ?? "").trim().toUpperCase();
    switch (normalized) {
        case "DONE":
            return "COMPLETED";
        case "ACTIVE":
            return "IN_PROGRESS";
        case "PAUSED":
            return "ON_HOLD";
        case "PLANNING":
            return "PLANNED";
        case "LATE":
        case "DELAYED":
        case "OVERDUE":
            return "IN_PROGRESS";
        case "PLANNED":
        case "IN_PROGRESS":
        case "ON_HOLD":
        case "COMPLETED":
        case "CANCELED":
            return normalized;
        default:
            return "PLANNED";
    }
};
const normalizeProjectPriority = (value) => {
    const normalized = (value ?? "").trim().toUpperCase();
    switch (normalized) {
        case "URGENT":
        case "URGENTE":
            return "CRITICAL";
        case "ALTA":
            return "HIGH";
        case "MEDIA":
            return "MEDIUM";
        case "BAIXA":
            return "LOW";
        case "CRITICAL":
        case "HIGH":
        case "MEDIUM":
        case "LOW":
            return normalized;
        default:
            return "MEDIUM";
    }
};
const FirstProjectOnboarding = ({ onCreateProject }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!name.trim())
            return;
        setError(null);
        setIsSubmitting(true);
        try {
            await onCreateProject({
                name: name.trim(),
                description: description.trim() || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setName("");
            setDescription("");
            setStartDate("");
            setEndDate("");
        }
        catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Não foi possível criar o projeto.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("section", { className: "onboarding-project", children: _jsxs("div", { className: "onboarding-project__card", children: [_jsxs("div", { className: "onboarding-project__intro", children: [_jsx("span", { className: "onboarding-project__step", children: "Passo 2 de 3" }), _jsx("h2", { children: "CRIE SEU PRIMEIRO PROJETO" }), _jsx("p", { children: "Agora que sua organiza\u00E7\u00E3o est\u00E1 criada, vamos configurar o primeiro projeto. Voc\u00EA poder\u00E1 adicionar tarefas, equipe, cronograma e relat\u00F3rios depois." }), _jsxs("div", { className: "onboarding-project__tips", children: [_jsxs("div", { children: [_jsx("strong", { children: "Comece simples." }), _jsx("span", { children: "Um nome claro e uma descri\u00E7\u00E3o curta j\u00E1 ajudam o time." })] }), _jsxs("div", { children: [_jsx("strong", { children: "Datas opcionais." }), _jsx("span", { children: "Voc\u00EA pode ajustar o cronograma a qualquer momento." })] })] })] }), _jsxs("div", { className: "onboarding-project__form", children: [error && _jsx("div", { className: "gp-alert-error", children: error }), _jsxs("form", { className: "onboarding-project__grid", onSubmit: handleSubmit, children: [_jsxs("label", { className: "onboarding-field", children: [_jsx("span", { children: "Nome do projeto" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Ex.: Implanta\u00E7\u00E3o do sistema na Cl\u00EDnica X", required: true })] }), _jsxs("label", { className: "onboarding-field onboarding-field--full", children: [_jsx("span", { children: "Descri\u00E7\u00E3o (opcional)" }), _jsx("textarea", { value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Resumo do objetivo do projeto...", rows: 3 })] }), _jsxs("label", { className: "onboarding-field", children: [_jsx("span", { children: "Data de in\u00EDcio (opcional)" }), _jsx("input", { type: "date", value: startDate, onChange: (event) => setStartDate(event.target.value) })] }), _jsxs("label", { className: "onboarding-field", children: [_jsx("span", { children: "Data de t\u00E9rmino (opcional)" }), _jsx("input", { type: "date", value: endDate, onChange: (event) => setEndDate(event.target.value) })] }), _jsxs("div", { className: "onboarding-project__actions", children: [_jsx("button", { className: "primary-button", type: "submit", disabled: isSubmitting, children: isSubmitting ? "Criando..." : "Criar projeto e continuar" }), _jsx("span", { className: "onboarding-project__helper", children: "Voc\u00EA pode editar tudo depois." })] })] })] })] }) }));
};
const NewProjectModal = ({ isOpen, onClose, children, title = "Novo projeto", subtitle = "Planeje um novo trabalho informando os dados básicos do projeto no portfólio." }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "gp-modal", onClick: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-labelledby": "new-project-title", children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { id: "new-project-title", children: title }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: onClose, "aria-label": "Fechar", children: "\u00D7" })] }), _jsx("p", { className: "gp-modal-subtitle", children: subtitle }), children] }) }));
};
const ProjectLimitModal = ({ isOpen, onClose, maxProjects }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "gp-modal", onClick: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { children: "Limite do plano" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: onClose, "aria-label": "Fechar", children: "\u00D7" })] }), _jsx("p", { className: "gp-modal-subtitle", children: maxProjects === null
                        ? "Seu plano atual não possui limite de projetos."
                        : `Seu plano permite até ${maxProjects} projetos. Exclua ou mova um projeto para continuar.` }), _jsx("p", { className: "muted", children: "Projetos desativados contam para o limite do plano." }), _jsx("div", { className: "gp-modal-footer", children: _jsx("button", { type: "button", className: "btn-primary", onClick: onClose, children: "Entendi" }) })] }) }));
};
export const ProjectsPage = () => {
    const { token } = useAuth();
    const { portfolio, portfolioError, portfolioLoading, projectsError, onExportPortfolio, onReloadPortfolio, selectedProjectId, organizations, selectedOrganizationId, onProjectChange, onCreateProject, onUpdateProject, currentOrgRole, projectLimits } = useOutletContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [trashError, setTrashError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        name: "",
        clientName: "",
        startDate: "",
        endDate: "",
        budget: "",
        repositoryUrl: "",
        teamMembers: "",
        description: "",
        status: "PLANNED",
        priority: "MEDIUM"
    });
    const orgRole = (currentOrgRole ?? "MEMBER");
    const canCreateProjects = canManageProjects(orgRole);
    const currentOrganization = organizations?.find((organization) => organization.id === selectedOrganizationId) ?? null;
    const resetForm = () => {
        setForm({
            name: "",
            clientName: "",
            startDate: "",
            endDate: "",
            budget: "",
            repositoryUrl: "",
            teamMembers: "",
            description: "",
            status: "PLANNED",
            priority: "MEDIUM"
        });
    };
    const handleCreateFirstProject = async (payload) => {
        await onCreateProject({
            name: payload.name,
            clientName: payload.description ?? "Cliente",
            budget: 0,
            repositoryUrl: "",
            startDate: payload.startDate,
            endDate: payload.endDate,
            description: payload.description,
            teamMembers: [],
            status: "PLANNED",
            priority: "MEDIUM"
        });
    };
    const hasProjects = Boolean(portfolio && portfolio.length > 0);
    const activeProjectsCount = portfolio?.length ?? 0;
    const usedProjectsCount = projectLimits?.used ?? activeProjectsCount;
    const projectLimitMax = projectLimits?.max ?? null;
    const projectLimitRemaining = projectLimits?.remaining ?? (projectLimitMax === null ? null : Math.max(projectLimitMax - usedProjectsCount, 0));
    const projectUsagePercent = projectLimitMax === null || projectLimitMax <= 0
        ? 0
        : Math.min(100, Math.round((usedProjectsCount / projectLimitMax) * 100));
    const isAtProjectLimit = projectLimitMax !== null && projectLimitRemaining === 0;
    const isNearProjectLimit = projectLimitMax !== null &&
        projectLimitRemaining !== null &&
        projectLimitRemaining > 0 &&
        (projectLimitRemaining <= 1 || projectUsagePercent >= 80);
    const currentPlanName = projectLimits?.planCode ? getPlanDefinition(projectLimits.planCode).displayName : "Nao informado";
    const limitToneClass = isAtProjectLimit ? "is-danger" : isNearProjectLimit ? "is-warning" : "is-ok";
    const activeProjectsLabel = activeProjectsCount === 1 ? "projeto ativo" : "projetos ativos";
    const isEditing = Boolean(editingProject);
    const modalTitle = isEditing ? "Editar projeto" : "Novo projeto";
    const modalSubtitle = isEditing ? "Atualize as informações do projeto." : undefined;
    const modalSubmitLabel = isEditing ? "Salvar alterações" : "Criar projeto";
    const modalSubmitLoadingLabel = isEditing ? "Salvando..." : "Criando...";
    const handleTrashProject = async (projectId) => {
        if (!token || !selectedOrganizationId)
            return;
        if (!window.confirm("Enviar este projeto para a lixeira? Ele fica 30 dias e depois é excluído permanentemente."))
            return;
        try {
            const response = await fetch(apiUrl(`/projects/${projectId}/trash`), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Organization-Id": selectedOrganizationId
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message || "Erro ao enviar projeto para a lixeira");
            }
            setTrashError(null);
            onReloadPortfolio?.();
        }
        catch (error) {
            setTrashError(error?.message || "Erro ao enviar projeto para a lixeira");
        }
    };
    const handleOpenCreateModal = () => {
        if (isAtProjectLimit)
            return;
        setEditingProject(null);
        setIsEditModalOpen(false);
        setCreateError(null);
        setFieldErrors({});
        resetForm();
        setIsCreateModalOpen(true);
    };
    const handleOpenEditModal = (project) => {
        const members = Array.isArray(project.teamMembers)
            ? project.teamMembers
            : Array.isArray(project.members)
                ? project.members
                    .map((member) => member?.name ?? member?.email ?? "")
                    .filter(Boolean)
                : [];
        const budgetValue = project.budget === null || project.budget === undefined ? "" : String(project.budget);
        setForm({
            name: project.projectName ?? "",
            clientName: project.clientName ?? currentOrganization?.name ?? "",
            startDate: project.startDate ? project.startDate.slice(0, 10) : "",
            endDate: project.endDate ? project.endDate.slice(0, 10) : "",
            budget: budgetValue,
            repositoryUrl: project.repositoryUrl ?? "",
            teamMembers: members.join(", "),
            description: project.description ?? "",
            status: normalizeProjectStatus(project.status),
            priority: normalizeProjectPriority(project.priority)
        });
        setEditingProject(project);
        setIsEditModalOpen(true);
        setIsCreateModalOpen(false);
        setCreateError(null);
        setFieldErrors({});
    };
    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setEditingProject(null);
        setCreateError(null);
        setFieldErrors({});
        resetForm();
    };
    const handleModalSubmit = async (event) => {
        event.preventDefault();
        const errors = {};
        if (!form.name.trim())
            errors.name = "Informe o nome do projeto.";
        if (!form.startDate)
            errors.startDate = "Informe a data de início.";
        if (!form.endDate)
            errors.endDate = "Informe a data de conclusão.";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0)
            return;
        setIsSubmitting(true);
        setCreateError(null);
        const payload = {
            name: form.name.trim(),
            clientName: currentOrganization?.name ?? form.clientName.trim(),
            budget: Number(form.budget) || 0,
            repositoryUrl: form.repositoryUrl.trim() || undefined,
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
            description: form.description.trim() || undefined,
            status: form.status,
            priority: form.priority,
            teamMembers: form.teamMembers
                .split(",")
                .map((member) => member.trim())
                .filter(Boolean)
        };
        try {
            if (isEditing && editingProject) {
                await onUpdateProject(editingProject.projectId, payload);
            }
            else {
                await onCreateProject(payload);
            }
            handleCloseModal();
        }
        catch (error) {
            const code = error?.body?.code;
            if (!isEditing && (code === "PLAN_LIMIT_REACHED" || code === "PROJECT_LIMIT_REACHED")) {
                setCreateError(null);
                setIsLimitModalOpen(true);
                return;
            }
            const fallbackMessage = isEditing ? "Erro ao salvar projeto" : "Erro ao criar projeto";
            const message = error?.body?.message ?? (error instanceof Error ? error.message : fallbackMessage);
            setCreateError(message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "page-container projects-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { className: "projects-header-intro", children: [_jsx("p", { className: "page-kicker", children: "Portf\u00F3lio" }), _jsx("h1", { className: "page-title", children: "Projetos" }), _jsx("p", { className: "page-subtitle", children: "Filtros avan\u00E7ados e troca de visualiza\u00E7\u00E3o entre cards e tabela." })] }), _jsxs("div", { className: "projects-header-actions", children: [_jsxs("div", { className: `projects-capacity-card ${limitToneClass}`, children: [_jsxs("div", { className: "projects-capacity-card__row", children: [_jsx("span", { className: "projects-capacity-card__label", children: "Capacidade da organizacao" }), _jsxs("span", { className: "projects-capacity-card__plan", children: ["Plano ", currentPlanName] })] }), _jsxs("div", { className: "projects-capacity-card__count", children: [_jsx("strong", { children: activeProjectsCount }), _jsx("span", { children: activeProjectsLabel })] }), _jsxs("div", { className: "projects-capacity-card__meta", children: [projectLimitMax === null ? (_jsxs("span", { children: [usedProjectsCount, " em uso no plano atual sem limite."] })) : (_jsxs("span", { children: [usedProjectsCount, " de ", projectLimitMax, " usados na organizacao."] })), projectLimitMax !== null && projectLimitRemaining !== null && (_jsx("span", { className: "projects-capacity-card__remaining", children: isAtProjectLimit
                                                    ? "Limite atingido."
                                                    : `Restam ${projectLimitRemaining} ${projectLimitRemaining === 1 ? "vaga" : "vagas"}.` }))] }), projectLimitMax !== null && (_jsx("div", { className: "projects-capacity-card__bar", "aria-hidden": "true", children: _jsx("span", { style: { width: `${projectUsagePercent}%` } }) })), isNearProjectLimit && !isAtProjectLimit && (_jsx("p", { className: "projects-capacity-card__hint", children: "A organizacao esta perto do limite do plano." }))] }), _jsxs("div", { className: "projects-header-buttons", children: [_jsxs("button", { className: "btn-secondary", type: "button", onClick: () => setIsTrashOpen(true), children: [_jsx(Trash2, { size: 16 }), "Lixeira"] }), _jsx("button", { className: "btn-primary", type: "button", onClick: handleOpenCreateModal, disabled: isAtProjectLimit, children: "+ Novo projeto" })] })] }), isAtProjectLimit && (_jsxs("div", { className: "projects-limit-hint", children: [_jsxs("div", { children: ["Voc\u00EA atingiu o limite de projetos do seu plano atual (", usedProjectsCount, " de ", projectLimitMax, "). Arquive ou exclua um projeto para criar outro."] }), _jsx("button", { type: "button", className: "link-button", onClick: () => setIsLimitModalOpen(true), children: "Entenda o limite" }), _jsx("div", { className: "muted", children: "Projetos desativados contam para o limite do plano." })] }))] }), projectsError && _jsx("p", { className: "error-text", children: projectsError }), trashError && _jsx("p", { className: "error-text", children: trashError }), portfolioLoading ? (_jsx("p", { className: "muted", children: "Carregando projetos..." })) : !hasProjects ? (canCreateProjects ? (_jsx(FirstProjectOnboarding, { onCreateProject: handleCreateFirstProject })) : (_jsx("p", { className: "muted", children: "Voc\u00EA tem acesso apenas para visualizar projetos nesta organiza\u00E7\u00E3o." }))) : (_jsx(ProjectPortfolio, { projects: portfolio, error: portfolioError, isLoading: portfolioLoading, onExport: onExportPortfolio, selectedProjectId: selectedProjectId, onSelectProject: onProjectChange, onCreateProject: onCreateProject, onEditProject: handleOpenEditModal, onTrashProject: canManageProjects(currentOrgRole) ? handleTrashProject : undefined })), _jsx(NewProjectModal, { isOpen: isCreateModalOpen || isEditModalOpen, onClose: handleCloseModal, title: modalTitle, subtitle: modalSubtitle, children: _jsxs("form", { onSubmit: handleModalSubmit, className: "gp-modal-body new-project-form", children: [createError && _jsx("div", { className: "gp-alert-error", children: createError }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "projectName", children: "Nome do projeto *" }), _jsx("input", { id: "projectName", name: "name", type: "text", className: "gp-input", value: form.name ?? "", onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })), placeholder: "Ex.: Implanta\u00E7\u00E3o ERP 2025", required: true }), fieldErrors.name && _jsx("small", { className: "input-error", children: fieldErrors.name })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Organiza\u00E7\u00E3o do projeto" }), _jsx("input", { className: "gp-input gp-input-readonly", type: "text", value: currentOrganization?.name ?? "", placeholder: "Selecione uma organiza\u00E7\u00E3o no topo", readOnly: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "projectStatus", children: "Status do projeto" }), _jsx("select", { id: "projectStatus", className: "gp-input", value: form.status, onChange: (event) => setForm((prev) => ({ ...prev, status: event.target.value })), children: PROJECT_STATUS_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "projectPriority", children: "Prioridade" }), _jsx("select", { id: "projectPriority", className: "gp-input", value: form.priority, onChange: (event) => setForm((prev) => ({ ...prev, priority: event.target.value })), children: PROJECT_PRIORITY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "In\u00EDcio planejado *" }), _jsx("input", { className: "gp-input", type: "date", value: form.startDate, onChange: (event) => setForm((prev) => ({ ...prev, startDate: event.target.value })) }), fieldErrors.startDate && _jsx("small", { className: "input-error", children: fieldErrors.startDate })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Conclus\u00E3o prevista *" }), _jsx("input", { className: "gp-input", type: "date", value: form.endDate, onChange: (event) => setForm((prev) => ({ ...prev, endDate: event.target.value })) }), fieldErrors.endDate && _jsx("small", { className: "input-error", children: fieldErrors.endDate })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Or\u00E7amento aprovado (R$)" }), _jsx("input", { className: "gp-input gp-input-currency", type: "text", inputMode: "decimal", value: form.budget, onChange: (event) => setForm((prev) => ({ ...prev, budget: event.target.value })), placeholder: "250000" })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Reposit\u00F3rio GitHub" }), _jsx("input", { className: "gp-input", type: "url", value: form.repositoryUrl, onChange: (event) => setForm((prev) => ({ ...prev, repositoryUrl: event.target.value })), placeholder: "https://github.com/org/projeto" })] }), _jsxs("div", { className: "form-field form-field-span-2", children: [_jsx("label", { children: "Equipe (e-mails separados por v\u00EDrgula)" }), _jsx("textarea", { className: "gp-input", value: form.teamMembers, onChange: (event) => setForm((prev) => ({ ...prev, teamMembers: event.target.value })), placeholder: "ana@empresa.com, joao@empresa.com", rows: 2 })] }), _jsxs("div", { className: "form-field form-field-span-2", children: [_jsx("label", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "gp-input", value: form.description, onChange: (event) => setForm((prev) => ({ ...prev, description: event.target.value })), placeholder: "Objetivos, entregas e premissas iniciais...", rows: 3 })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleCloseModal, disabled: isSubmitting, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: isSubmitting || !currentOrganization, children: isSubmitting ? modalSubmitLoadingLabel : modalSubmitLabel })] })] }) }), _jsx(ProjectTrashModal, { open: isTrashOpen, onClose: () => setIsTrashOpen(false), onReload: onReloadPortfolio, organizationId: selectedOrganizationId }), _jsx(ProjectLimitModal, { isOpen: isLimitModalOpen, onClose: () => setIsLimitModalOpen(false), maxProjects: projectLimitMax })] }));
};
