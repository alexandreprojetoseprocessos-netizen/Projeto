import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Crown, PauseCircle, Trash2 } from "lucide-react";
import OrgActionsMenu from "./OrgActionsMenu";
import OrgStatusModal from "./OrgStatusModal";
import { canManageOrganizationSettings } from "./permissions";
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
                : "Não informado";
    const max = organizationLimits?.max ?? null;
    const remaining = organizationLimits?.remaining ?? null;
    const used = organizationLimits?.used ?? orgList.length;
    const canCreateMore = max === null ? true : remaining !== null && remaining > 0;
    const showLimitBanner = !canCreateMore && max !== null;
    const canManageOrg = canManageOrganizationSettings(currentOrgRole);
    const totalSlotsLabel = max === null ? "ilimitadas" : `${used} de ${max}`;
    const organizationsPercent = max === null || max === 0 ? 100 : Math.min(100, Math.round((used / max) * 100));
    const limitReachedTitle = !canCreateMore ? "Limite de organizações do seu plano atingido." : undefined;
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
    return (_jsxs("div", { className: "org-onboarding", children: [showLimitBanner && (_jsxs("div", { className: "org-limit-banner", children: [_jsx("div", { className: "org-limit-stripe" }), _jsxs("div", { className: "org-limit-content", children: [_jsx("strong", { children: "Voc\u00EA atingiu o limite de organiza\u00E7\u00F5es do seu plano." }), _jsxs("span", { children: ["Para criar novas organiza\u00E7\u00F5es, atualize seu plano em", " ", _jsx("button", { type: "button", className: "link-button", onClick: () => navigate("/plano"), children: "Meu plano" }), "."] })] })] })), _jsxs("div", { className: "page-header org-page-header", children: [_jsx("div", { className: "page-header-kicker", children: "BEM-VINDO(A)" }), _jsx("h1", { className: "page-header-title", children: "Criar nova organiza\u00E7\u00E3o" }), _jsx("p", { className: "page-header-subtitle", children: "A organiza\u00E7\u00E3o representa sua empresa, cl\u00EDnica ou neg\u00F3cio. \u00C9 aqui que voc\u00EA concentra projetos, pessoas e documentos." })] }), _jsxs("div", { className: "org-grid", children: [_jsxs("div", { className: "org-left-column", children: [_jsxs("section", { id: "org-create-section", className: "org-card org-create-card", children: [_jsxs("div", { className: "org-card-head", children: [_jsx("div", { className: "org-card-icon", children: _jsx(Building2, { className: "org-card-icon-svg" }) }), _jsx("h3", { children: "Nova organiza\u00E7\u00E3o" })] }), _jsxs("form", { className: "org-form", onSubmit: handleSubmit, ref: formRef, children: [_jsx("div", { className: "form-group", children: _jsxs("label", { children: ["Nome da organiza\u00E7\u00E3o", _jsx("input", { type: "text", placeholder: "Ex.: Minha empresa LTDA", value: newOrgName, onChange: (e) => setNewOrgName(e.target.value), required: true })] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: ["Dominio (opcional)", _jsx("input", { type: "text", placeholder: "ex: minhaempresa.com", value: newOrgDomain, onChange: (e) => setNewOrgDomain(e.target.value) })] }) }), _jsx("span", { title: limitReachedTitle, children: _jsx("button", { type: "submit", className: "primary-button org-create-button", disabled: isCreateDisabled, "aria-disabled": isCreateDisabled, children: creating ? "Criando..." : "Criar nova organização" }) })] })] }), _jsxs("div", { className: "org-quick-actions", children: [_jsxs("button", { type: "button", className: "org-quick-card", onClick: () => setShowDeactivatedModal(true), children: [_jsx("div", { className: "org-quick-icon is-muted", children: _jsx(PauseCircle, { className: "org-quick-icon-svg" }) }), _jsx("span", { children: "Desativados" })] }), _jsxs("button", { type: "button", className: "org-quick-card", onClick: () => setShowTrashModal(true), children: [_jsx("div", { className: "org-quick-icon is-accent", children: _jsx(Trash2, { className: "org-quick-icon-svg" }) }), _jsx("span", { children: "Lixeira (90 dias)" })] })] }), _jsxs("section", { className: "org-list-section", children: [_jsx("div", { className: "org-list-header", children: _jsxs("div", { children: [_jsx("h2", { className: "org-section-title", children: "Suas organiza\u00E7\u00F5es" }), _jsx("p", { className: "org-section-subtitle", children: "Escolha onde voc\u00EA quer trabalhar hoje." })] }) }), _jsx("div", { className: "org-list-divider" }), orgList.length === 0 ? (_jsxs("div", { className: "org-empty", children: [_jsx("h3", { children: "Nenhuma organiza\u00E7\u00E3o cadastrada ainda" }), _jsx("p", { children: "Crie a sua primeira organiza\u00E7\u00E3o para come\u00E7ar a estruturar seus projetos. Voc\u00EA pode adicionar quantas precisar dentro do seu plano." }), _jsx("button", { type: "button", className: "primary-button", onClick: scrollToCreate, children: "Criar primeira organiza\u00E7\u00E3o" })] })) : (_jsx("div", { className: "org-list-grid", children: orgList.map((organization) => {
                                            const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
                                            const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
                                            const isActive = organization.isActive ?? true;
                                            const canManageThisOrg = canManageOrganizationSettings((currentOrgRole ?? organization.role ?? null));
                                            const projectsCount = organization.projectsCount ?? organization.activeProjects ?? organization.projectCount ?? 0;
                                            const membersCount = organization.membersCount ??
                                                organization.members?.length ??
                                                organization.usersCount ??
                                                0;
                                            return (_jsxs("div", { className: "org-card org-item-card", children: [_jsxs("div", { className: "org-card-left", children: [_jsx("div", { className: "org-card-avatar", children: _jsx(Building2, { className: "org-card-avatar-icon" }) }), _jsxs("div", { className: "org-card-info", children: [_jsx("div", { className: "org-card-header-row", children: _jsx("span", { className: "org-card-name", children: organization.name }) }), _jsxs("div", { className: "org-card-meta", title: createdLabel ? `Criada em ${createdLabel}` : undefined, children: [projectsCount, " projetos ", "\u2022", " ", membersCount, " membros"] })] })] }), _jsxs("div", { className: "org-card-right", children: [canManageThisOrg && (_jsx("div", { className: "org-actions-row", children: _jsx(OrgActionsMenu, { organization: organization, onRenamed: handleOrgRenamed, onToggledActive: handleOrgToggledActive, onDeleted: handleOrgDeleted, onStatusChange: handleOrgStatusChange, mode: "menu" }) })), _jsxs("button", { type: "button", className: "org-card-action", disabled: !isActive, onClick: () => onSelect(organization.id), "aria-label": "Entrar", title: "Entrar", children: [_jsx("span", { className: "org-card-action-text", children: "Entrar" }), _jsx(ChevronRight, { className: "org-card-action-icon" })] })] })] }, organization.id));
                                        }) }))] })] }), _jsx("div", { className: "org-plan-column", children: _jsxs("div", { className: "org-card org-plan-card", children: [_jsxs("div", { className: "org-plan-header", children: [_jsx("span", { className: "plan-badge", children: "Plano Atual" }), _jsx(Crown, { className: "org-plan-icon" })] }), _jsx("div", { className: "org-plan-name", children: planName }), _jsx("p", { className: "org-plan-section-title", children: "Detalhes do plano" }), userEmail && (_jsxs("div", { className: "org-plan-pill", children: [_jsx("div", { className: "org-plan-pill-label", children: "Respons\u00E1vel pelas organiza\u00E7\u00F5es" }), _jsx("div", { className: "org-plan-pill-value", children: userEmail })] })), _jsxs("div", { className: "org-plan-body", children: [_jsx("p", { className: "org-plan-label", children: "Organiza\u00E7\u00F5es inclu\u00EDdas" }), _jsx("p", { className: "org-plan-value", children: totalSlotsLabel }), _jsx("div", { className: "org-plan-progress", children: _jsx("div", { className: "org-plan-progress-fill", style: { width: `${organizationsPercent}%` } }) }), _jsx("p", { className: "org-plan-helper", children: "Use esta conta para centralizar suas empresas, cl\u00EDnicas ou unidades." })] }), _jsx("button", { type: "button", className: "button-outline org-plan-button", onClick: () => navigate("/plano"), children: "Ver detalhes do plano" })] }) })] }), _jsx(OrgStatusModal, { type: "DEACTIVATED", open: showDeactivatedModal, onClose: () => setShowDeactivatedModal(false), onReload: onReloadOrganizations, limitMax: organizationLimits?.max ?? null }), _jsx(OrgStatusModal, { type: "SOFT_DELETED", open: showTrashModal, onClose: () => setShowTrashModal(false), onReload: onReloadOrganizations, limitMax: organizationLimits?.max ?? null })] }));
};
export default OrganizationSelector;
