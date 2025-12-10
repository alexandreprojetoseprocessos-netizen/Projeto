import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { WbsTreeView } from "../components/DashboardLayout";
export const EDTPage = () => {
    const navigate = useNavigate();
    const { wbsNodes, wbsError, wbsLoading, onMoveNode, onUpdateWbsNode, selectedNodeId, onSelectNode, onCreateWbsItem, projects, selectedProjectId, } = useOutletContext();
    const currentProject = projects.find((project) => project.id === selectedProjectId) ?? null;
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [formError, setFormError] = useState(null);
    const [form, setForm] = useState({
        name: "",
        status: "BACKLOG",
        owner: "",
        description: "",
        duration: "",
        startDate: "",
        endDate: "",
        dependencies: "",
    });
    const handleOpenDetails = (node) => {
        setSelectedTask(node);
        setDetailsOpen(true);
    };
    const handleCreateTask = async (event) => {
        event.preventDefault();
        setFormError(null);
        if (!form.name.trim()) {
            setFormError("Informe o nome da tarefa.");
            return;
        }
        if (form.startDate && form.endDate && form.endDate < form.startDate) {
            setFormError("Término não pode ser anterior ao início.");
            return;
        }
        if (!onCreateWbsItem) {
            setFormError("Ação de criação não disponível.");
            return;
        }
        setCreatingTask(true);
        try {
            // Reutiliza o handler existente de criação. Hoje cria no nível raiz; campo de pai/dependências pode ser ligado depois.
            await onCreateWbsItem(null);
            setForm({
                name: "",
                status: "BACKLOG",
                owner: "",
                description: "",
                duration: "",
                startDate: "",
                endDate: "",
                dependencies: "",
            });
            setIsNewTaskOpen(false);
        }
        catch (error) {
            setFormError(error?.message ?? "Erro ao criar tarefa.");
        }
        finally {
            setCreatingTask(false);
        }
    };
    if (!selectedProjectId) {
        return (_jsx("section", { className: "page-container edt-page", children: _jsxs("div", { className: "workspace-empty-card", style: { marginTop: "1rem" }, children: [_jsx("h2", { children: "Nenhum projeto selecionado" }), _jsx("p", { children: "Para usar a EDT, selecione um projeto no topo da tela ou acesse a aba de projetos para escolher um." }), _jsx("button", { type: "button", className: "primary-button", onClick: () => navigate("/projects"), children: "Ir para projetos" })] }) }));
    }
    return (_jsxs("section", { className: "page-container edt-page", children: [_jsx("header", { className: "page-header edt-header", children: _jsxs("div", { children: [_jsx("p", { className: "page-kicker", children: "EDT" }), _jsx("h1", { className: "page-title", children: "Estrutura Anal\u00EDtica do Projeto" }), _jsx("p", { className: "page-subtitle", children: "Visualize e organize a \u00E1rvore de tarefas, respons\u00E1veis e prazos do projeto atual." }), currentProject && (_jsxs("p", { className: "edt-current-project", children: ["Projeto atual: ", _jsx("strong", { children: currentProject.name })] }))] }) }), _jsxs("div", { className: "edt-actions-bar", children: [_jsxs("div", { className: "edt-actions-bar-left", children: [_jsx("button", { type: "button", className: "btn-primary", onClick: () => setIsNewTaskOpen(true), children: "+ Nova tarefa" }), _jsx("span", { className: "edt-actions-hint", children: "A\u00E7\u00F5es r\u00E1pidas" })] }), _jsxs("div", { className: "edt-actions-bar-right", children: [_jsx("button", { type: "button", className: "btn-secondary", children: "Exportar" }), _jsx("button", { type: "button", className: "btn-secondary", children: "Importar" }), _jsx("button", { type: "button", className: "btn-ghost", children: "Lixeira" })] })] }), wbsError && _jsx("p", { className: "error-text", children: wbsError }), wbsLoading ? _jsx("p", { className: "muted", children: "Carregando EDT..." }) : null, (!wbsNodes || wbsNodes.length === 0) && !wbsLoading ? (_jsxs("div", { className: "workspace-empty-card", style: { marginTop: "1rem" }, children: [_jsx("h3", { children: "Nenhum item cadastrado" }), _jsx("p", { className: "muted", children: "Crie a primeira entrega ou tarefa para come\u00E7ar a estruturar a EDT. Voc\u00EA pode adicionar itens em qualquer n\u00EDvel e reorden\u00E1-los depois." }), _jsx("button", { type: "button", className: "primary-button", onClick: () => onCreateWbsItem?.(null), children: "Criar nova tarefa" })] })) : (_jsx("div", { className: "edt-card", children: _jsx("div", { className: "edt-scroll-wrapper", children: _jsx(WbsTreeView, { nodes: wbsNodes, loading: wbsLoading, error: wbsError, onCreate: (parentId) => onCreateWbsItem?.(parentId ?? null), onMove: onMoveNode, onUpdate: onUpdateWbsNode, selectedNodeId: selectedNodeId, onSelect: onSelectNode, onOpenDetails: handleOpenDetails }) }) })), isNewTaskOpen && (_jsx("div", { className: "gp-modal-backdrop", onClick: () => !creatingTask && setIsNewTaskOpen(false), children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "new-wbs-task-title", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { id: "new-wbs-task-title", children: "Nova tarefa" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: () => setIsNewTaskOpen(false), "aria-label": "Fechar", disabled: creatingTask, children: "\u00D7" })] }), _jsx("p", { className: "gp-modal-subtitle", children: "Preencha as informa\u00E7\u00F5es b\u00E1sicas da entrega." }), _jsxs("form", { className: "gp-modal-body new-project-form", onSubmit: handleCreateTask, children: [formError && _jsx("div", { className: "gp-alert-error", children: formError }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Nome da tarefa *" }), _jsx("input", { className: "gp-input", value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), disabled: creatingTask, required: true })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Situa\u00E7\u00E3o" }), _jsxs("select", { className: "gp-input", value: form.status, onChange: (e) => setForm((prev) => ({ ...prev, status: e.target.value })), disabled: creatingTask, children: [_jsx("option", { value: "BACKLOG", children: "N\u00E3o iniciado" }), _jsx("option", { value: "IN_PROGRESS", children: "Em andamento" }), _jsx("option", { value: "DONE", children: "Conclu\u00EDdo" }), _jsx("option", { value: "RISK", children: "Em risco" })] })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Respons\u00E1vel" }), _jsx("input", { className: "gp-input", value: form.owner, onChange: (e) => setForm((prev) => ({ ...prev, owner: e.target.value })), disabled: creatingTask, placeholder: "Use a lista de respons\u00E1veis da tabela" })] }), _jsxs("div", { className: "form-field form-field-span-2", children: [_jsx("label", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "gp-input", rows: 3, value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), disabled: creatingTask })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Dura\u00E7\u00E3o (dias)" }), _jsx("input", { className: "gp-input", type: "number", min: 1, value: form.duration, onChange: (e) => setForm((prev) => ({ ...prev, duration: e.target.value })), disabled: creatingTask })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "In\u00EDcio" }), _jsx("input", { className: "gp-input", type: "date", value: form.startDate, onChange: (e) => setForm((prev) => ({ ...prev, startDate: e.target.value })), disabled: creatingTask })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "T\u00E9rmino" }), _jsx("input", { className: "gp-input", type: "date", value: form.endDate, onChange: (e) => setForm((prev) => ({ ...prev, endDate: e.target.value })), disabled: creatingTask })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Depend\u00EAncias" }), _jsx("input", { className: "gp-input", value: form.dependencies, onChange: (e) => setForm((prev) => ({ ...prev, dependencies: e.target.value })), disabled: creatingTask, placeholder: "IDs ou tarefas relacionadas" })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setIsNewTaskOpen(false), disabled: creatingTask, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: creatingTask, children: creatingTask ? "Criando..." : "Criar tarefa" })] })] })] }) })), detailsOpen && selectedTask && (_jsx("div", { className: "gp-modal-backdrop", onClick: () => setDetailsOpen(false), children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "wbs-task-details-title", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { id: "wbs-task-details-title", children: "Detalhes da tarefa" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: () => setDetailsOpen(false), "aria-label": "Fechar", children: "\u00D7" })] }), _jsxs("div", { className: "gp-modal-body wbs-details-grid", children: [_jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Nome" }), _jsx("p", { className: "detail-value", children: selectedTask.title ?? "Tarefa sem nome" })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "ID / N\u00EDvel" }), _jsxs("p", { className: "detail-value", children: [selectedTask.wbsCode ?? selectedTask.displayId ?? selectedTask.id, " \u00B7 N", selectedTask.level ?? 0] })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Situa\u00E7\u00E3o" }), _jsx("p", { className: "detail-value", children: selectedTask.status ?? "Não informado" })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Respons\u00E1vel" }), _jsx("p", { className: "detail-value", children: selectedTask.owner?.name ?? selectedTask.owner?.email ?? "Sem responsável" })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Dura\u00E7\u00E3o" }), _jsx("p", { className: "detail-value", children: selectedTask.estimateHours ? `${selectedTask.estimateHours / 8}d` : "—" })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "In\u00EDcio / T\u00E9rmino" }), _jsxs("p", { className: "detail-value", children: [selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString("pt-BR") : "—", " \u2022 ", " ", selectedTask.endDate ? new Date(selectedTask.endDate).toLocaleDateString("pt-BR") : "—"] })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Depend\u00EAncias" }), _jsx("p", { className: "detail-value", children: selectedTask.dependencies?.length ? selectedTask.dependencies.join(", ") : "Sem dependências" })] }), _jsxs("div", { className: "detail-span-2", children: [_jsx("p", { className: "detail-label", children: "Descri\u00E7\u00E3o" }), _jsx("p", { className: "detail-value", children: selectedTask.description ?? "Sem descrição" })] }), _jsxs("div", { className: "detail-span-2", children: [_jsx("p", { className: "detail-label", children: "Progresso" }), _jsxs("div", { className: "wbs-progress-cell", children: [_jsx("div", { className: "wbs-progress-bar", children: _jsx("div", { className: "wbs-progress-fill", style: { width: `${Math.max(0, Math.min(100, selectedTask.progress ?? 0))}%` } }) }), _jsxs("span", { className: "wbs-progress-value", children: [Math.max(0, Math.min(100, selectedTask.progress ?? 0)), "%"] })] })] })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setDetailsOpen(false), children: "Fechar" }), _jsx("button", { type: "button", className: "btn-primary", onClick: () => setDetailsOpen(false), children: "Editar (em breve)" })] })] }) }))] }));
};
