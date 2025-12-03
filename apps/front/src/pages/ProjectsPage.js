import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ProjectPortfolio } from "../components/ProjectPortfolio";
import { canManageProjects } from "../components/permissions";
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
    return (_jsxs("div", { className: "workspace-empty-card workspace-project-onboarding", children: [_jsx("h2", { children: "Passo 2 de 3: Crie seu primeiro projeto" }), _jsx("p", { children: "Agora que sua organiza\u00E7\u00E3o est\u00E1 criada, vamos configurar o primeiro projeto. Voc\u00EA poder\u00E1 adicionar tarefas, equipe, cronograma e relat\u00F3rios depois." }), error && _jsx("p", { className: "error-text", children: error }), _jsxs("form", { className: "workspace-form", onSubmit: handleSubmit, children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Nome do projeto" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Ex.: Implanta\u00E7\u00E3o do sistema na Cl\u00EDnica X", required: true })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Descri\u00E7\u00E3o (opcional)" }), _jsx("textarea", { value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Resumo do objetivo do projeto...", rows: 3 })] }), _jsxs("div", { className: "workspace-form-row", children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Data de in\u00EDcio (opcional)" }), _jsx("input", { type: "date", value: startDate, onChange: (event) => setStartDate(event.target.value) })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Data de t\u00E9rmino (opcional)" }), _jsx("input", { type: "date", value: endDate, onChange: (event) => setEndDate(event.target.value) })] })] }), _jsx("button", { className: "primary-button", type: "submit", disabled: isSubmitting, children: isSubmitting ? "Criando..." : "Criar projeto e continuar" })] })] }));
};
const NewProjectModal = ({ isOpen, onClose, children }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "gp-modal", onClick: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-labelledby": "new-project-title", children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { id: "new-project-title", children: "Novo projeto" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: onClose, "aria-label": "Fechar", children: "\u00D7" })] }), _jsx("p", { className: "gp-modal-subtitle", children: "Planeje um novo trabalho informando os dados b\u00E1sicos do projeto no portf\u00F3lio." }), children] }) }));
};
export const ProjectsPage = () => {
    const { portfolio, portfolioError, portfolioLoading, projectsError, onExportPortfolio, selectedProjectId, organizations, selectedOrganizationId, onProjectChange, onCreateProject, currentOrgRole, projectLimits } = useOutletContext();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
        description: ""
    });
    const orgRole = (currentOrgRole ?? "MEMBER");
    const canCreateProjects = canManageProjects(orgRole);
    const currentOrganization = organizations?.find((organization) => organization.id === selectedOrganizationId) ?? null;
    const handleCreateFirstProject = async (payload) => {
        await onCreateProject({
            name: payload.name,
            clientName: payload.description ?? "Cliente",
            budget: 0,
            repositoryUrl: "",
            startDate: payload.startDate,
            endDate: payload.endDate,
            description: payload.description,
            teamMembers: []
        });
    };
    const hasProjects = Boolean(portfolio && portfolio.length > 0);
    const isAtProjectLimit = projectLimits?.remaining === 0;
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
        try {
            await onCreateProject({
                name: form.name.trim(),
                clientName: currentOrganization?.name ?? form.clientName.trim(),
                budget: Number(form.budget) || 0,
                repositoryUrl: form.repositoryUrl.trim() || undefined,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
                description: form.description.trim() || undefined,
                teamMembers: form.teamMembers
                    .split(",")
                    .map((member) => member.trim())
                    .filter(Boolean)
            });
            setForm({
                name: "",
                clientName: "",
                startDate: "",
                endDate: "",
                budget: "",
                repositoryUrl: "",
                teamMembers: "",
                description: ""
            });
            setIsCreateModalOpen(false);
        }
        catch (error) {
            const message = error?.body?.message ?? (error instanceof Error ? error.message : "Erro ao criar projeto");
            setCreateError(message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "page-container projects-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("p", { className: "page-kicker", children: "Portf\u00F3lio" }), _jsx("h1", { className: "page-title", children: "Projetos" }), _jsx("p", { className: "page-subtitle", children: "Filtros avan\u00E7ados e troca de visualiza\u00E7\u00E3o entre cards e tabela." })] }), _jsx("button", { className: "btn-primary", type: "button", onClick: () => {
                            if (projectLimits && projectLimits.remaining === 0)
                                return;
                            setIsCreateModalOpen(true);
                        }, disabled: projectLimits?.remaining === 0, children: "+ Novo projeto" }), projectLimits?.remaining === 0 && (_jsxs("div", { className: "projects-limit-hint", children: ["Voc\u00EA atingiu o limite de projetos do seu plano atual (", projectLimits.used, " de ", projectLimits.max, "). Arquive ou exclua um projeto para criar outro."] }))] }), projectsError && _jsx("p", { className: "error-text", children: projectsError }), portfolioLoading ? (_jsx("p", { className: "muted", children: "Carregando projetos..." })) : !hasProjects ? (canCreateProjects ? (_jsx(FirstProjectOnboarding, { onCreateProject: handleCreateFirstProject })) : (_jsx("p", { className: "muted", children: "Voc\u00EA tem acesso apenas para visualizar projetos nesta organiza\u00E7\u00E3o." }))) : (_jsx(ProjectPortfolio, { projects: portfolio, error: portfolioError, isLoading: portfolioLoading, onExport: onExportPortfolio, selectedProjectId: selectedProjectId, onSelectProject: onProjectChange, onCreateProject: onCreateProject })), _jsx(NewProjectModal, { isOpen: isCreateModalOpen, onClose: () => setIsCreateModalOpen(false), children: _jsxs("form", { onSubmit: handleModalSubmit, className: "gp-modal-body new-project-form", children: [createError && _jsx("div", { className: "gp-alert-error", children: createError }), _jsxs("div", { className: "form-field", children: [_jsx("label", { htmlFor: "projectName", children: "Nome do projeto *" }), _jsx("input", { id: "projectName", name: "name", type: "text", className: "gp-input", value: form.name ?? "", onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })), placeholder: "Ex.: Implanta\u00E7\u00E3o ERP 2025", required: true }), fieldErrors.name && _jsx("small", { className: "input-error", children: fieldErrors.name })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Organiza\u00E7\u00E3o do projeto" }), _jsx("input", { className: "gp-input gp-input-readonly", type: "text", value: currentOrganization?.name ?? "", placeholder: "Selecione uma organiza\u00E7\u00E3o no topo", readOnly: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "In\u00EDcio planejado *" }), _jsx("input", { className: "gp-input", type: "date", value: form.startDate, onChange: (event) => setForm((prev) => ({ ...prev, startDate: event.target.value })) }), fieldErrors.startDate && _jsx("small", { className: "input-error", children: fieldErrors.startDate })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Conclus\u00E3o prevista *" }), _jsx("input", { className: "gp-input", type: "date", value: form.endDate, onChange: (event) => setForm((prev) => ({ ...prev, endDate: event.target.value })) }), fieldErrors.endDate && _jsx("small", { className: "input-error", children: fieldErrors.endDate })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Or\u00E7amento aprovado (R$)" }), _jsx("input", { className: "gp-input gp-input-currency", type: "text", inputMode: "decimal", value: form.budget, onChange: (event) => setForm((prev) => ({ ...prev, budget: event.target.value })), placeholder: "250000" })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Reposit\u00F3rio GitHub" }), _jsx("input", { className: "gp-input", type: "url", value: form.repositoryUrl, onChange: (event) => setForm((prev) => ({ ...prev, repositoryUrl: event.target.value })), placeholder: "https://github.com/org/projeto" })] }), _jsxs("div", { className: "form-field form-field-span-2", children: [_jsx("label", { children: "Equipe (e-mails separados por v\u00EDrgula)" }), _jsx("textarea", { className: "gp-input", value: form.teamMembers, onChange: (event) => setForm((prev) => ({ ...prev, teamMembers: event.target.value })), placeholder: "ana@empresa.com, joao@empresa.com", rows: 2 })] }), _jsxs("div", { className: "form-field form-field-span-2", children: [_jsx("label", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "gp-input", value: form.description, onChange: (event) => setForm((prev) => ({ ...prev, description: event.target.value })), placeholder: "Objetivos, entregas e premissas iniciais...", rows: 3 })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setIsCreateModalOpen(false), disabled: isSubmitting, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: isSubmitting || !currentOrganization, children: isSubmitting ? "Criando..." : "Criar projeto" })] })] }) })] }));
};
