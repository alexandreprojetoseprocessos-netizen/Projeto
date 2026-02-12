import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";
const getDaysLeft = (archivedAt) => {
    if (!archivedAt)
        return null;
    const start = new Date(archivedAt).getTime();
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
};
const ProjectTrashModal = ({ open, onClose, onReload, organizationId }) => {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const fetchItems = async () => {
        if (!token || !organizationId)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(apiUrl("/projects?status=ARCHIVED"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Organization-Id": organizationId
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message || "Erro ao carregar projetos arquivados");
            }
            const projects = body.projects ?? [];
            setItems(projects.map((project) => ({
                id: project.id,
                name: project.name,
                archivedAt: project.archivedAt ?? null
            })));
        }
        catch (err) {
            setError(err?.message || "Erro ao carregar projetos arquivados");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (open) {
            fetchItems();
        }
    }, [open, organizationId]);
    const handleRestore = async (id) => {
        if (!token || !organizationId)
            return;
        setActionLoadingId(id);
        setActionError(null);
        try {
            const response = await fetch(apiUrl(`/projects/${id}/restore`), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Organization-Id": organizationId
                }
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message || "Erro ao restaurar projeto");
            }
            onReload?.();
            await fetchItems();
        }
        catch (err) {
            setActionError(err?.message || "Erro ao restaurar projeto");
        }
        finally {
            setActionLoadingId(null);
        }
    };
    const handleDeletePermanent = async (id) => {
        if (!token || !organizationId)
            return;
        if (!window.confirm("Excluir permanentemente este projeto? Essa ação não pode ser desfeita."))
            return;
        setActionLoadingId(id);
        setActionError(null);
        try {
            const response = await fetch(apiUrl(`/projects/${id}`), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "X-Organization-Id": organizationId
                }
            });
            if (!response.ok && response.status !== 204) {
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
    if (!open)
        return null;
    return (_jsx("div", { className: "org-modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "org-modal", children: [_jsxs("header", { className: "org-modal__header", children: [_jsx("h3", { children: "Projetos arquivados" }), _jsx("button", { type: "button", className: "org-modal__close", onClick: onClose, "aria-label": "Fechar", children: _jsx(X, { size: 18 }) })] }), actionError && _jsx("div", { className: "org-modal-error", children: actionError }), _jsxs("div", { className: "org-modal__content", children: [loading && _jsx("p", { className: "muted", children: "Carregando..." }), !loading && error && _jsx("p", { className: "error-text", children: error }), !loading && !error && items.length === 0 && _jsx("p", { className: "muted", children: "Nenhum projeto na lixeira." }), !loading && !error && items.length > 0 &&
                            items.map((project) => {
                                const daysLeft = getDaysLeft(project.archivedAt);
                                return (_jsxs("div", { className: "org-modal-row", children: [_jsxs("div", { className: "org-modal-row__info", children: [_jsx("div", { className: "org-modal-row__avatar", children: _jsx(Trash2, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "org-modal-row__name", children: project.name }), _jsx("div", { className: "org-modal-row__meta", children: daysLeft !== null
                                                                ? `Restam ${daysLeft} dia${daysLeft === 1 ? "" : "s"} para exclusão permanente`
                                                                : "Arquivado" })] })] }), _jsxs("div", { className: "org-modal-row__actions", children: [_jsx("button", { type: "button", className: "button-primary", onClick: () => handleRestore(project.id), disabled: actionLoadingId === project.id, children: "Restaurar" }), _jsx("button", { type: "button", className: "button-primary", onClick: () => handleDeletePermanent(project.id), disabled: actionLoadingId === project.id, children: "Excluir" })] })] }, project.id));
                            })] })] }) }));
};
export default ProjectTrashModal;
