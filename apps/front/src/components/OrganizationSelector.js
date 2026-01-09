import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrgActionsMenu from "./OrgActionsMenu";
import { canManageOrganizationSettings } from "./permissions";
import { getColorForName, getInitials } from "../utils/color";
export const OrganizationSelector = ({ organizations, onSelect, onCreateOrganization, userEmail, organizationLimits, currentOrgRole }) => {
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgDomain, setNewOrgDomain] = useState("");
    const [orgList, setOrgList] = useState(organizations);
    const formRef = useRef(null);
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
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!onCreateOrganization)
            return;
        const trimmedName = newOrgName.trim();
        if (!trimmedName || !canCreateMore)
            return;
        const trimmedDomain = newOrgDomain.trim();
        onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
        setNewOrgName("");
        setNewOrgDomain("");
    };
    const scrollToCreate = () => {
        const el = document.getElementById("org-create-card");
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
    };
    return (_jsxs("div", { className: "org-page", children: [showLimitBanner && (_jsxs("div", { className: "org-limit-banner", children: [_jsx("div", { className: "org-limit-stripe" }), _jsxs("div", { className: "org-limit-content", children: [_jsx("strong", { children: "Voc\u00EA atingiu o limite de organiza\u00E7\u00F5es do seu plano." }), _jsxs("span", { children: ["Para criar novas organiza\u00E7\u00F5es, atualize seu plano em ", " ", _jsx("button", { type: "button", className: "link-button", onClick: () => navigate("/plano"), children: "Meu plano" }), "."] })] })] })), _jsxs("div", { className: "org-header", children: [_jsxs("div", { className: "org-header-left", children: [_jsx("span", { className: "org-kicker", children: "BEM-VINDO(A)" }), _jsx("h1", { children: "Escolha onde voc\u00EA quer trabalhar hoje" }), userEmail && _jsx("p", { className: "org-user-email", children: userEmail })] }), _jsx("div", { className: "org-header-right", children: _jsxs("div", { className: "org-plan-card", children: [_jsx("span", { className: "org-plan-label", children: "Plano atual" }), _jsx("strong", { className: "org-plan-name", children: planName }), max === null ? (_jsxs("p", { className: "org-plan-meta", children: ["Organiza\u00E7\u00F5es: ", _jsx("strong", { children: "Ilimitadas" })] })) : (_jsxs("p", { className: "org-plan-meta", children: ["Organiza\u00E7\u00F5es: ", _jsxs("strong", { children: [used, " de ", max] }), " usadas"] })), max !== null && remaining !== null && remaining > 0 && (_jsxs("p", { className: "org-plan-extra", children: ["Voc\u00EA ainda pode criar ", _jsx("strong", { children: remaining }), " organiza\u00E7\u00E3o", remaining > 1 ? "s" : "", "."] })), max !== null && remaining === 0 && (_jsx("p", { className: "org-plan-warning", children: "Voc\u00EA atingiu o limite de organiza\u00E7\u00F5es do plano." })), _jsx("button", { type: "button", className: "primary-button", disabled: !canCreateMore, onClick: scrollToCreate, children: "Criar nova organiza\u00E7\u00E3o" }), !canCreateMore && (_jsx("button", { type: "button", className: "link-button", onClick: scrollToCreate, children: "Ver op\u00E7\u00F5es em \"Meu plano\"" }))] }) })] }), _jsxs("div", { className: "org-content", children: [orgList.length === 0 && (_jsxs("div", { className: "org-empty", children: [_jsx("h2", { children: "Voc\u00EA ainda n\u00E3o tem nenhuma organiza\u00E7\u00E3o" }), _jsx("p", { children: "Crie sua primeira organiza\u00E7\u00E3o para come\u00E7ar a cadastrar projetos, equipe e documentos." }), _jsx("button", { className: "primary-button", type: "button", onClick: scrollToCreate, children: "Criar primeira organiza\u00E7\u00E3o" })] })), _jsxs("div", { className: "org-grid", children: [orgList.map((organization) => {
                                const bgColor = getColorForName(organization.name || "Org");
                                const initials = getInitials(organization.name || "Org");
                                const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
                                const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
                                const isActive = organization.isActive ?? true;
                                const canManageThisOrg = canManageOrganizationSettings((currentOrgRole ?? organization.role ?? null));
                                const projectsCount = organization.projectsCount ?? organization.activeProjects ?? 0;
                                return (_jsxs("div", { className: "org-card", children: [_jsxs("div", { className: "org-card-header", children: [_jsxs("div", { className: "org-card-main", children: [_jsx("div", { className: "org-avatar", style: { backgroundColor: bgColor }, children: initials }), _jsxs("div", { className: "org-card-text", children: [_jsx("h2", { className: "org-name", children: organization.name }), _jsxs("p", { className: "org-meta-line", title: createdLabel ? `Criada em ${createdLabel}` : undefined, children: [projectsCount, " projeto(s) ativos \u0095 ", organization.role] }), _jsxs("p", { className: "org-plan-line", children: ["Plano: ", _jsx("span", { children: planName })] })] })] }), canManageThisOrg && (_jsx("div", { className: "org-actions-row", children: _jsx(OrgActionsMenu, { organization: organization, onRenamed: handleOrgRenamed, onToggledActive: handleOrgToggledActive, onDeleted: handleOrgDeleted, onStatusChange: handleOrgStatusChange, mode: "inline" }) }))] }), _jsx("div", { className: "org-card-right", children: _jsx("button", { type: "button", className: "button-primary", disabled: !isActive, onClick: () => onSelect(organization.id), children: "Entrar" }) })] }, organization.id));
                            }), _jsxs("div", { className: "org-card org-card-create", id: "org-create-card", children: [_jsx("h2", { children: "Criar nova organiza\u00E7\u00E3o" }), _jsx("p", { children: "A organiza\u00E7\u00E3o representa sua empresa, cl\u00EDnica ou neg\u00F3cio. Ela concentra projetos, pessoas e arquivos. Preencha os dados abaixo para continuar." }), _jsxs("form", { className: "org-form", onSubmit: handleSubmit, ref: formRef, children: [_jsxs("label", { children: ["Nome da organiza\u00E7\u00E3o", _jsx("input", { value: newOrgName, onChange: (e) => setNewOrgName(e.target.value), placeholder: "Ex.: Minha empresa LTDA", required: true })] }), _jsxs("label", { children: ["Dom\u00EDnio (opcional)", _jsx("input", { value: newOrgDomain, onChange: (e) => setNewOrgDomain(e.target.value), placeholder: "ex: minhaempresa.com" })] }), _jsx("button", { className: "primary-button", type: "submit", disabled: !canCreateMore, children: "Criar nova organiza\u00E7\u00E3o" }), !canCreateMore && (_jsx("p", { className: "org-plan-warning", children: "Voc\u00EA atingiu o limite de organiza\u00E7\u00F5es do seu plano. Veja op\u00E7\u00F5es em \"Meu plano\"." }))] })] })] })] })] }));
};
