import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";
import { X } from "lucide-react";
const getDaysLeft = (deletedAt) => {
    if (!deletedAt)
        return null;
    const start = new Date(deletedAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, 90 - diffDays);
};
const OrgLimitModal = ({ isOpen, onClose, maxOrganizations }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "gp-modal", onClick: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { children: "Limite do plano" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: onClose, "aria-label": "Fechar", children: "\u00D7" })] }), _jsx("p", { className: "gp-modal-subtitle", children: maxOrganizations === null
                        ? "Seu plano atual não possui limite de organizações."
                        : `Seu plano permite até ${maxOrganizations} organizações. Exclua uma organização para continuar.` }), _jsx("p", { className: "muted", children: "Organiza\u00E7\u00F5es desativadas contam para o limite do plano." }), _jsx("div", { className: "gp-modal-footer", children: _jsx("button", { type: "button", className: "btn-primary", onClick: onClose, children: "Entendi" }) })] }) }));
};
const OrgStatusModal = ({ type, open, onClose, onReload, limitMax }) => {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const title = type === "DEACTIVATED" ? "Organizações desativadas" : "Lixeira (90 dias)";
    const fetchItems = async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(apiUrl(`/organizations?status=${type}`), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message || "Erro ao carregar organizações");
            }
            setItems(body.organizations ?? []);
        }
        catch (err) {
            setError(err?.message || "Erro ao carregar organizações");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (open) {
            fetchItems();
        }
    }, [open, type]);
    const handleRestore = async (id) => {
        if (!token)
            return;
        setActionLoadingId(id);
        setActionError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${id}/restore`), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 409 && body?.code === "ORG_LIMIT_REACHED") {
                    setActionError(null);
                    setLimitModalOpen(true);
                    return;
                }
                throw new Error(body?.message || "Erro ao restaurar organização");
            }
            onReload?.();
            await fetchItems();
        }
        catch (err) {
            setActionError(err?.message || "Erro ao restaurar organização");
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const handleSendToTrash = async (id) => {
        if (!token)
            return;
        setActionLoadingId(id);
        setActionError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${id}/trash`), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body?.message || "Erro ao enviar para lixeira");
            }
            onReload?.();
            await fetchItems();
        }
        catch (err) {
            setActionError(err?.message || "Erro ao enviar para lixeira");
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const handleDeletePermanent = async (id) => {
        if (!token)
            return;
        if (!window.confirm("Excluir permanentemente esta organização? Isso removerá projetos vinculados."))
            return;
        setActionLoadingId(id);
        setActionError(null);
        try {
            const response = await fetch(apiUrl(`/organizations/${id}`), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body?.message || "Erro ao excluir permanentemente");
            }
            onReload?.();
            await fetchItems();
        }
        catch (err) {
            setActionError(err?.message || "Erro ao excluir permanentemente");
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const content = useMemo(() => {
        if (loading)
            return _jsx("p", { className: "muted", children: "Carregando..." });
        if (error)
            return _jsx("p", { className: "error-text", children: error });
        if (!items.length)
            return _jsx("p", { className: "muted", children: "Nenhuma organiza\u00E7\u00E3o encontrada." });
        return items.map((org) => {
            const daysLeft = type === "SOFT_DELETED" ? getDaysLeft(org.deletedAt) : null;
            return (_jsxs("div", { className: "org-modal-row", children: [_jsxs("div", { className: "org-modal-row__info", children: [_jsx("div", { className: "org-modal-row__avatar", children: (org.name || "Org").slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("div", { className: "org-modal-row__name", children: org.name }), type === "SOFT_DELETED" && (_jsx("div", { className: "org-modal-row__meta", children: daysLeft !== null
                                            ? `Restam ${daysLeft} dia${daysLeft === 1 ? "" : "s"} para exclusão permanente`
                                            : "Aguardando exclusão permanente" })), type === "DEACTIVATED" && _jsx("div", { className: "org-modal-row__meta", children: "Desativado" })] })] }), _jsxs("div", { className: "org-modal-row__actions", children: [_jsx("button", { type: "button", className: "button-primary", onClick: () => handleRestore(org.id), disabled: actionLoadingId === org.id, children: "Restaurar" }), type === "DEACTIVATED" ? (_jsx("button", { type: "button", className: "button-primary", onClick: () => handleSendToTrash(org.id), disabled: actionLoadingId === org.id, children: "Enviar para lixeira" })) : (_jsx("button", { type: "button", className: "button-primary", onClick: () => handleDeletePermanent(org.id), disabled: actionLoadingId === org.id, children: "Excluir permanentemente" }))] })] }, org.id));
        });
    }, [actionLoadingId, error, items, loading, type]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "org-modal-overlay", role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "org-modal", children: [_jsxs("header", { className: "org-modal__header", children: [_jsx("h3", { children: title }), _jsx("button", { type: "button", className: "org-modal__close", onClick: onClose, "aria-label": "Fechar", children: _jsx(X, { size: 18 }) })] }), actionError && _jsx("div", { className: "org-modal-error", children: actionError }), _jsx("div", { className: "org-modal__content", children: content })] }), _jsx(OrgLimitModal, { isOpen: limitModalOpen, onClose: () => setLimitModalOpen(false), maxOrganizations: limitMax ?? null })] }));
};
export default OrgStatusModal;
