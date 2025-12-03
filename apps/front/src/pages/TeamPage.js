import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canManageTeam } from "../components/permissions";
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const TeamPage = () => {
    const { token, user } = useAuth();
    const { selectedOrganizationId, currentOrgRole } = useOutletContext();
    const orgRole = (currentOrgRole ?? "MEMBER");
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteError, setInviteError] = useState(null);
    const fetchMembers = async () => {
        if (!token || !selectedOrganizationId)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBaseUrl}/organizations/${selectedOrganizationId}/members`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = body?.message ?? "Falha ao carregar equipe";
                throw new Error(message);
            }
            setMembers(body.members ?? []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar equipe");
            setMembers([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrganizationId, token]);
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
            const response = await fetch(`${apiBaseUrl}/organizations/${selectedOrganizationId}/members`, {
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
        }
        catch (err) {
            setInviteError(err instanceof Error ? err.message : "Falha ao enviar convite");
        }
        finally {
            setInviteSubmitting(false);
        }
    };
    const isOnboarding = useMemo(() => members.length <= 1, [members.length]);
    const canInvite = canManageTeam(orgRole);
    const roleLabels = {
        OWNER: "Owner",
        ADMIN: "Admin",
        MEMBER: "Membro",
        VIEWER: "Visualizador"
    };
    const currentUserId = user?.id ?? null;
    return (_jsxs("section", { className: "team-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("p", { className: "eyebrow", children: "Administra\u00E7\u00E3o" }), _jsx("h1", { children: "Equipe" })] }), loading ? (_jsx("p", { className: "muted", children: "Carregando equipe..." })) : error ? (_jsx("p", { className: "error-text", children: error })) : isOnboarding ? (_jsxs("div", { className: "workspace-empty-card team-onboarding", children: [_jsx("h2", { children: "Passo 3 de 3: Convide sua equipe" }), _jsx("p", { children: "Convide colegas para colaborar em projetos, quadros, cronogramas e relat\u00F3rios." }), canInvite ? (_jsxs("form", { className: "workspace-form", onSubmit: handleInvite, children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "E-mail" }), _jsx("input", { type: "email", placeholder: "colega@empresa.com", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), required: true })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Papel" }), _jsxs("select", { value: inviteRole, onChange: (event) => setInviteRole(event.target.value), children: [_jsx("option", { value: "ADMIN", children: "Admin" }), _jsx("option", { value: "MEMBER", children: "Membro" }), _jsx("option", { value: "VIEWER", children: "Visualizador" })] })] }), inviteError && _jsx("p", { className: "error-text", children: inviteError }), _jsx("button", { type: "submit", className: "primary-button", disabled: inviteSubmitting, children: inviteSubmitting ? "Enviando..." : "Enviar convite" })] })) : (_jsx("p", { className: "muted", children: "Voc\u00EA pode visualizar a equipe, mas n\u00E3o pode convidar novos membros." }))] })) : (_jsxs("div", { className: "team-list", children: [_jsxs("div", { className: "team-list__header", children: [_jsx("h2", { children: "Membros da organiza\u00E7\u00E3o" }), canInvite ? (_jsx("button", { className: "secondary-button", type: "button", onClick: () => setInviteRole("MEMBER"), children: "Convidar novo membro" })) : null] }), _jsxs("table", { className: "team-members-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Nome" }), _jsx("th", { children: "E-mail" }), _jsx("th", { children: "Papel" })] }) }), _jsx("tbody", { children: members.map((member) => (_jsxs("tr", { children: [_jsxs("td", { children: [member.user.fullName || member.user.email, " ", currentUserId === member.user.id ? _jsx("span", { className: "muted", children: "(voc\u00EA)" }) : null] }), _jsx("td", { children: member.user.email }), _jsx("td", { children: roleLabels[member.role] ?? member.role })] }, member.id))) })] }), canInvite ? (_jsxs("div", { className: "team-invite-inline", children: [_jsx("h3", { children: "Convidar mais algu\u00E9m" }), _jsxs("form", { className: "workspace-form", onSubmit: handleInvite, children: [_jsxs("label", { className: "input-group", children: [_jsx("span", { children: "E-mail" }), _jsx("input", { type: "email", placeholder: "colega@empresa.com", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), required: true })] }), _jsxs("label", { className: "input-group", children: [_jsx("span", { children: "Papel" }), _jsxs("select", { value: inviteRole, onChange: (event) => setInviteRole(event.target.value), children: [_jsx("option", { value: "ADMIN", children: "Admin" }), _jsx("option", { value: "MEMBER", children: "Membro" }), _jsx("option", { value: "VIEWER", children: "Visualizador" })] })] }), inviteError && _jsx("p", { className: "error-text", children: inviteError }), _jsx("button", { type: "submit", className: "primary-button", disabled: inviteSubmitting, children: inviteSubmitting ? "Enviando..." : "Convidar" })] })] })) : (_jsx("p", { className: "muted", children: "Voc\u00EA n\u00E3o tem permiss\u00E3o para convidar novos membros nesta organiza\u00E7\u00E3o." }))] }))] }));
};
