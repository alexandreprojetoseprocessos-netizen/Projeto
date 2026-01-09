import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { WbsTreeView } from "../components/DashboardLayout";
import { StatusSelect } from "../components/StatusSelect";
import { normalizeStatus } from "../utils/status";
console.log("[EAP] page mounted:", "EDTPage.clean.tsx", new Date().toISOString());
const EDTPage = () => {
    const { wbsNodes, wbsError, wbsLoading, onMoveNode, onUpdateWbsNode, onUpdateWbsResponsible, members, selectedNodeId, onSelectNode, onCreateWbsItem, projects, selectedProjectId, onReloadWbs, serviceCatalog, } = useOutletContext();
    const [filterText, setFilterText] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState("");
    const [createStatus, setCreateStatus] = useState("Não iniciado");
    const filteredNodes = useMemo(() => {
        const q = filterText.trim().toLowerCase();
        return (wbsNodes ?? []).filter((node) => {
            const normalized = normalizeStatus(node.status);
            if (filterStatus !== "ALL" && normalized !== filterStatus)
                return false;
            if (!q)
                return true;
            const code = String(node.wbsCode ?? node.code ?? node.id ?? "").toLowerCase();
            const title = String(node.title ?? "").toLowerCase();
            const owner = String(node.owner?.name ?? node.owner?.email ?? "").toLowerCase();
            return code.includes(q) || title.includes(q) || owner.includes(q);
        });
    }, [filterStatus, filterText, wbsNodes]);
    const handleCreate = async (event) => {
        event.preventDefault();
        if (!createTitle.trim())
            return;
        await onCreateWbsItem?.(null, { title: createTitle.trim(), status: createStatus });
        setIsCreateOpen(false);
        setCreateTitle("");
        setCreateStatus("Não iniciado");
        onReloadWbs?.();
    };
    const currentProjectName = projects?.find((project) => project.id === selectedProjectId)?.name ?? "Selecionar";
    return (_jsxs("section", { className: "edt-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("p", { className: "eyebrow", children: "EAP" }), _jsx("h1", { children: "Estrutura Anal\u00EDtica do Projeto" }), projects?.length ? _jsxs("p", { className: "subtext", children: ["Projeto atual: ", currentProjectName] }) : null] }), _jsxs("div", { className: "eap-toolbar2", style: { marginBottom: 12 }, children: [_jsxs("div", { className: "eap-actions-left", children: [_jsx("button", { className: "eap-btn", onClick: () => setIsCreateOpen(true), children: "+ Nova tarefa" }), _jsx("button", { className: "eap-btn", onClick: () => onReloadWbs?.(), children: "Recarregar" }), _jsx("button", { className: "eap-btn", onClick: () => onReloadWbs?.(), children: "Exportar" }), _jsx("button", { className: "eap-btn", onClick: () => onReloadWbs?.(), children: "Importar" }), _jsx("button", { className: "eap-btn", onClick: () => onReloadWbs?.(), children: "Importar servi\u00E7os" }), _jsx("button", { className: "eap-btn eap-btn-danger", onClick: () => onReloadWbs?.(), children: "Lixeira" })] }), _jsxs("div", { className: "eap-actions-right no-grow", style: { gap: 12 }, children: [_jsx("div", { className: "eap-filters", children: _jsxs("div", { className: "eap-filter-field", children: [_jsx("label", { children: "Status" }), _jsx(StatusSelect, { className: "eap-filter-select", value: filterStatus === "ALL" ? undefined : filterStatus, onChange: (value) => setFilterStatus(value) })] }) }), _jsxs("div", { className: "eap-filter-field", children: [_jsx("label", { children: "Tarefas" }), _jsxs("div", { className: "eap-search", children: [_jsx("input", { className: "eap-search-input compact", placeholder: "Filtrar tarefas...", value: filterText, onChange: (event) => setFilterText(event.target.value) }), !!filterText && (_jsx("button", { className: "eap-search-clear", onClick: () => setFilterText(""), "aria-label": "Limpar filtro", type: "button", children: "\u00D7" }))] })] })] })] }), wbsError && _jsx("p", { className: "error-text", children: wbsError }), wbsLoading && _jsx("p", { className: "muted", children: "Carregando EAP..." }), !wbsLoading && (_jsx("div", { className: "edt-card", children: _jsx("div", { className: "edt-scroll-wrapper", children: _jsx(WbsTreeView, { nodes: wbsNodes, loading: wbsLoading, error: wbsError, onCreate: (parentId) => onCreateWbsItem?.(parentId ?? null), onMove: onMoveNode, onUpdate: onUpdateWbsNode, onChangeResponsible: onUpdateWbsResponsible, members: members, selectedNodeId: selectedNodeId, onSelect: onSelectNode, onOpenDetails: () => { }, serviceCatalog: serviceCatalog, onSelectionChange: () => { }, clearSelectionKey: 0, filterText: filterText, filterStatus: filterStatus === "ALL" ? undefined : filterStatus, filterService: "ALL", filterOwner: "ALL", filterOverdue: "ALL" }) }) })), isCreateOpen && (_jsx("div", { className: "gp-modal-backdrop", onClick: () => setIsCreateOpen(false), children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { children: "Nova tarefa" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: () => setIsCreateOpen(false), "aria-label": "Fechar", children: "\u00D7" })] }), _jsxs("form", { className: "gp-modal-body new-project-form", onSubmit: handleCreate, children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Nome da tarefa *" }), _jsx("input", { className: "gp-input", value: createTitle, onChange: (event) => setCreateTitle(event.target.value), required: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Status" }), _jsx(StatusSelect, { value: createStatus, onChange: (value) => setCreateStatus(value) })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setIsCreateOpen(false), children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: !createTitle.trim(), children: "Criar" })] })] })] }) }))] }));
};
export default EDTPage;
