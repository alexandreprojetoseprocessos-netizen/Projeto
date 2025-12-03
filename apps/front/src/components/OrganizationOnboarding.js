import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PauseCircle, Trash2 } from "lucide-react";
import OrgActionsMenu from "./OrgActionsMenu";
import OrgStatusModal from "./OrgStatusModal";
import { canManageOrganizationSettings } from "./permissions";
import { getColorForName, getInitials } from "../utils/color";
export const OrganizationSelector = ({ organizations, onSelect, onCreateOrganization, userEmail, organizationLimits, currentOrgRole, onReloadOrganizations }) => {
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgDomain, setNewOrgDomain] = useState("");
    const [orgList, setOrgList] = useState(organizations);
    const [creating, setCreating] = useState(false);
    const formRef = useRef(null);
    const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
    const [showTrashModal, setShowTrashModal] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        setOrgList(organizations);
    }, [organizations]);
    const planCode = organizationLimits?.planCode ?? null;
    const planName = planCode === "START"
        ? "Start"
        : planCode === "BUSINESS"
            ? "Business"
            : planCode === "ENTERPRISE"
                ? "Enterprise"
                : "Nao informado";
    const max = organizationLimits?.max ?? null;
    const remaining = organizationLimits?.remaining ?? null;
    const used = organizationLimits?.used ?? orgList.length;
    const canCreateMore = max === null ? true : remaining !== null && remaining > 0;
    const showLimitBanner = !canCreateMore && max !== null;
    const canManageOrg = canManageOrganizationSettings(currentOrgRole);
    const totalSlotsLabel = max === null ? "ilimitadas" : `${used} de ${max}`;
    const organizationsPercent = max === null || max === 0 ? 100 : Math.min(100, Math.round((used / max) * 100));
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!onCreateOrganization)
            return;
        const trimmedName = newOrgName.trim();
        if (!trimmedName || !canCreateMore || creating)
            return;
        const trimmedDomain = newOrgDomain.trim();
        setCreating(true);
        try {
            await onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
            setNewOrgName("");
            setNewOrgDomain("");
            formRef.current?.reset();
        }
        catch (error) {
            // erro tratado fora
        }
        finally {
            setCreating(false);
        }
    };
    const scrollToCreate = () => {
        const el = document.getElementById("org-create-section");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };
    const handleOrgRenamed = (orgId, newName) => {
        setOrgList((current) => current.map((org) => (org.id === orgId ? { ...org, name: newName } : org)));
    };
    const handleOrgToggledActive = (orgId, isActive) => {
        if (!isActive) {
            setOrgList((current) => current.filter((org) => org.id !== orgId));
        }
        else {
            setOrgList((current) => current.map((org) => (org.id === orgId ? { ...org, isActive } : org)));
        }
    };
    const handleOrgDeleted = (orgId) => {
        setOrgList((current) => current.filter((org) => org.id !== orgId));
    };
    const handleOrgStatusChange = (orgId, status) => {
        if (status && status !== "ACTIVE") {
            setOrgList((current) => current.filter((org) => org.id !== orgId));
        }
        onReloadOrganizations?.();
    };
    const isCreateDisabled = !canCreateMore || creating || !newOrgName.trim();
    return (_jsxs("div", { className: "org-page", children: [showLimitBanner && (_jsxs("div", { className: "org-limit-banner", children: [_jsx("div", { className: "org-limit-stripe" }), _jsxs("div", { className: "org-limit-content", children: [_jsx("strong", { children: "Voce atingiu o limite de organizacoes do seu plano." }), _jsxs("span", { children: ["Para criar novas organizacoes, atualize seu plano em ", " ", _jsx("button", { type: "button", className: "link-button", onClick: () => navigate("/plano"), children: "Meu plano" }), "."] })] })] })), _jsxs("div", { className: "page-header", children: [_jsx("div", { className: "page-header-kicker", children: "BEM-VINDO(A)" }), _jsx("h1", { className: "page-header-title", children: "Criar nova organizacao" }), _jsx("p", { className: "page-header-subtitle", children: "A organizacao representa sua empresa, clinica ou negocio. E aqui que voce concentra projetos, pessoas e documentos." })] }), _jsxs("div", { className: "org-grid", children: [_jsxs("div", { className: "org-left-column", children: [_jsxs("section", { id: "org-create-section", className: "form-card org-form-card", children: [_jsx("h3", { children: "Nova organizacao" }), _jsxs("form", { className: "org-form", onSubmit: handleSubmit, ref: formRef, children: [_jsx("div", { className: "form-group", children: _jsxs("label", { children: ["Nome da organizacao", _jsx("input", { type: "text", placeholder: "Ex.: Minha empresa LTDA", value: newOrgName, onChange: (e) => setNewOrgName(e.target.value), required: true })] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: ["Dominio (opcional)", _jsx("input", { type: "text", placeholder: "ex: minhaempresa.com", value: newOrgDomain, onChange: (e) => setNewOrgDomain(e.target.value) })] }) }), _jsx("button", { type: "submit", className: "primary-button org-create-button", disabled: isCreateDisabled, children: creating ? "Criando..." : "Criar nova organizacao" })] })] }), _jsxs("div", { className: "org-status-row", children: [_jsxs("button", { type: "button", className: "org-status-box", onClick: () => setShowDeactivatedModal(true), children: [_jsx(PauseCircle, { className: "status-icon status-icon--paused" }), _jsx("span", { children: "Desativados" })] }), _jsxs("button", { type: "button", className: "org-status-box", onClick: () => setShowTrashModal(true), children: [_jsx(Trash2, { className: "status-icon status-icon--trash" }), _jsx("span", { children: "Lixeira (90 dias)" })] })] })] }), _jsxs("div", { className: "plan-card org-plan-card", children: [_jsxs("div", { children: [_jsx("span", { className: "plan-badge", children: "Plano atual" }), _jsx("div", { className: "plan-title", children: planName })] }), _jsx("h3", { children: "Detalhes do plano" }), userEmail && (_jsxs("div", { className: "email-box", children: [_jsx("div", { className: "org-responsible-label", children: "Responsavel pelas organizacoes" }), _jsx("div", { className: "org-responsible-email", children: userEmail })] })), _jsxs("div", { className: "org-plan-body", children: [_jsx("p", { className: "org-plan-label", children: "Organizacoes incluidas" }), _jsx("p", { className: "org-plan-value", children: totalSlotsLabel }), _jsx("div", { className: "org-plan-progress", children: _jsx("div", { className: "org-plan-progress-fill", style: { width: `${organizationsPercent}%` } }) }), _jsx("p", { className: "org-plan-helper", children: "Use esta conta para centralizar suas empresas, clinicas ou unidades." })] }), _jsx("button", { type: "button", className: "button-primary org-plan-button", onClick: () => navigate("/plano"), children: "Ver detalhes do plano" })] })] }), _jsxs("section", { className: "org-list-section", children: [_jsx("h2", { className: "org-section-title", children: "Suas organizacoes" }), _jsx("p", { className: "org-section-subtitle", children: "Escolha onde voce quer trabalhar hoje." }), orgList.length === 0 ? (_jsxs("div", { className: "org-empty", children: [_jsx("h3", { children: "Nenhuma organizacao cadastrada ainda" }), _jsx("p", { children: "Crie a sua primeira organizacao para comecar a estruturar seus projetos. Voce pode adicionar quantas precisar dentro do seu plano." }), _jsx("button", { type: "button", className: "primary-button", onClick: scrollToCreate, children: "Criar primeira organizacao" })] })) : (_jsx("div", { className: "org-list-grid", children: orgList.map((organization) => {
                            const bgColor = getColorForName(organization.name || "Org");
                            const initials = getInitials(organization.name || "Org");
                            const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
                            const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
                            const isActive = organization.isActive ?? true;
                            const canManageThisOrg = canManageOrganizationSettings(currentOrgRole ?? organization.role ?? null);
                            const projectsCount = organization.projectsCount ?? organization.activeProjects ?? organization.projectCount ?? 0;
                            return (_jsxs("div", { className: "org-card", children: [_jsxs("div", { className: "org-card-left", children: [_jsx("div", { className: "org-card-avatar", style: { backgroundColor: bgColor }, children: initials }), _jsxs("div", { className: "org-card-info", children: [_jsx("div", { className: "org-card-header-row", children: _jsx("span", { className: "org-card-name", children: organization.name }) }), canManageThisOrg && (_jsx("div", { className: "org-actions-row org-card-actions-inline", children: _jsx(OrgActionsMenu, { organization: organization, onRenamed: handleOrgRenamed, onToggledActive: handleOrgToggledActive, onDeleted: handleOrgDeleted, onStatusChange: handleOrgStatusChange, mode: "inline" }) })), _jsxs("div", { className: "org-card-meta", title: createdLabel ? `Criada em ${createdLabel}` : undefined, children: [projectsCount, " projeto(s) ativos ", "\u00b7", " ", organization.role, " ", "\u00b7", " Plano: ", planName] })] })] }), _jsx("div", { className: "org-card-right", children: _jsx("button", { type: "button", className: "button-primary", disabled: !isActive, onClick: () => onSelect(organization.id), children: "Entrar" }) })] }, organization.id));
                        }) }))] }), _jsx(OrgStatusModal, { type: "DEACTIVATED", open: showDeactivatedModal, onClose: () => setShowDeactivatedModal(false), onReload: onReloadOrganizations }), _jsx(OrgStatusModal, { type: "SOFT_DELETED", open: showTrashModal, onClose: () => setShowTrashModal(false), onReload: onReloadOrganizations })] }));
};
export default OrganizationSelector;
