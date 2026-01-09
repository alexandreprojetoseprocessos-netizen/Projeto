import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, } from "@hello-pangea/dnd";
export const STATUS_MAP = {
    BACKLOG: "Não iniciado",
    IN_PROGRESS: "Em andamento",
    DELAYED: "Em atraso",
    RISK: "Em risco",
    REVIEW: "Homologação",
    DONE: "Finalizado",
};
export const KANBAN_STATUS_ORDER = [
    "BACKLOG",
    "IN_PROGRESS",
    "DELAYED",
    "RISK",
    "REVIEW",
    "DONE",
];
const PRIORITY_CONFIG = {
    HIGH: { label: "Alta", color: "#ef4444", bgColor: "#fee2e2" },
    MEDIUM: { label: "Média", color: "#f59e0b", bgColor: "#fef3c7" },
    LOW: { label: "Baixa", color: "#10b981", bgColor: "#d1fae5" },
};
export const KanbanBoard = ({ columns, onDragEnd, onCreate, onTaskClick, onTaskTitleChange, onTaskColumnChange, newTaskTitle: _newTaskTitle, newTaskColumn: _newTaskColumn, }) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createStatus, setCreateStatus] = useState(null);
    const [createTitle, setCreateTitle] = useState("");
    const [createPriority, setCreatePriority] = useState("MEDIUM");
    const standardColumns = useMemo(() => KANBAN_STATUS_ORDER.map((statusKey) => {
        const existingColumn = columns.find((col) => col.id === statusKey);
        return {
            id: statusKey,
            title: STATUS_MAP[statusKey],
            tasks: existingColumn?.tasks ?? [],
            wipLimit: existingColumn?.wipLimit,
        };
    }), [columns]);
    const openCreateModal = (columnId) => {
        setCreateStatus(columnId);
        setIsCreateOpen(true);
        setCreateTitle("");
        setCreatePriority("MEDIUM");
        onTaskColumnChange(columnId);
    };
    const closeCreateModal = () => {
        setIsCreateOpen(false);
        setCreateStatus(null);
        setCreateTitle("");
        setCreatePriority("MEDIUM");
    };
    const handleModalSubmit = async (event) => {
        event.preventDefault();
        if (!createStatus || !createTitle.trim())
            return;
        onTaskTitleChange(createTitle);
        onTaskColumnChange(createStatus);
        const success = await onCreate(event);
        if (success) {
            closeCreateModal();
        }
    };
    useEffect(() => {
        if (!isCreateOpen)
            return;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeCreateModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCreateOpen]);
    const getPriorityBadge = (priority) => {
        if (!priority)
            return null;
        const config = PRIORITY_CONFIG[priority];
        if (!config)
            return null;
        return (_jsx("span", { className: "kanban-priority-badge", style: { backgroundColor: config.bgColor, color: config.color }, children: config.label }));
    };
    const formatDateBR = (value) => {
        if (!value)
            return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return "";
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
        });
    };
    const getInitials = (value) => {
        if (!value)
            return "";
        const trimmed = value.trim();
        if (!trimmed)
            return "";
        const base = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
        const parts = base.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    };
    const getShortName = (value) => {
        if (!value)
            return "";
        const trimmed = value.trim();
        if (!trimmed)
            return "";
        if (trimmed.includes("@")) {
            return trimmed.split("@")[0];
        }
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length === 1)
            return parts[0];
        return `${parts[0]} ${parts[1][0]}.`;
    };
    if (!columns.length) {
        return (_jsx("p", { className: "muted", children: "Quadro vazio. Configure as colunas para come\u00E7ar." }));
    }
    return (_jsxs("div", { className: "kanbanBoard", children: [_jsx(DragDropContext, { onDragEnd: onDragEnd, children: standardColumns.map((column) => {
                    const taskCount = column.tasks.length;
                    const isOverLimit = column.wipLimit !== undefined && taskCount > column.wipLimit;
                    return (_jsxs("div", { className: "kanbanColumn", "data-column-id": column.id, children: [_jsxs("div", { className: "kanbanColumnHeader", children: [_jsxs("div", { className: "kanbanColumnHeaderLeft", children: [_jsx("div", { className: "kanbanColumnTitle", children: column.title }), _jsx("span", { className: "kanbanCountBadge", children: taskCount }), column.wipLimit !== undefined && (_jsxs("span", { className: `kanban-wip-limit ${isOverLimit ? "is-exceeded" : ""}`, children: ["/ ", column.wipLimit] }))] }), _jsxs("div", { className: "kanbanColumnActions", children: [_jsx("button", { className: "kanbanCreateBtn", type: "button", onClick: () => openCreateModal(column.id), "aria-label": `Criar tarefa em ${column.title}`, title: `Criar tarefa em ${column.title}`, children: "+ Criar" }), _jsx("button", { className: "kanbanMenuBtn", type: "button", "aria-label": "Mais a\u00E7\u00F5es", title: "Mais a\u00E7\u00F5es", children: "\u22EF" })] })] }), _jsx(Droppable, { droppableId: column.id, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: `kanbanColumnBody ${snapshot.isDraggingOver ? "is-dragging-over" : ""}`, children: [taskCount === 0 && (_jsx("div", { className: "kanban-empty-state", children: _jsx("p", { className: "muted", children: "Sem tarefas" }) })), column.tasks.map((task, index) => (_jsx(Draggable, { draggableId: task.id, index: index, children: (dragProvided, dragSnapshot) => {
                                                const assignee = task.assignee ?? task.responsible ?? null;
                                                const assigneeLabelRaw = assignee?.name ?? assignee?.email ?? "";
                                                const assigneeLabel = assigneeLabelRaw
                                                    ? getShortName(assigneeLabelRaw)
                                                    : "Sem responsavel";
                                                const assigneeInitials = assignee
                                                    ? getInitials(assigneeLabelRaw)
                                                    : "?";
                                                const startLabel = formatDateBR(task.startDate ?? task.startAt ?? task.start ?? null);
                                                const endLabel = formatDateBR(task.endDate ??
                                                    task.dueDate ??
                                                    task.endAt ??
                                                    task.end ??
                                                    null);
                                                const hasDates = Boolean(startLabel || endLabel);
                                                const priorityBadge = getPriorityBadge(task.priority);
                                                return (_jsxs("article", { ref: dragProvided.innerRef, ...dragProvided.draggableProps, ...dragProvided.dragHandleProps, className: `kanbanCard ${dragSnapshot.isDragging ? "is-dragging" : ""}`, onClick: () => onTaskClick?.(task), style: {
                                                        ...dragProvided.draggableProps.style,
                                                        transform: dragSnapshot.isDragging
                                                            ? `${dragProvided.draggableProps.style?.transform} scale(1.05)`
                                                            : dragProvided.draggableProps.style?.transform,
                                                    }, children: [task.code && (_jsx("span", { className: "kanban-card__code", children: task.code })), _jsx("div", { className: "kanban-card__header", children: _jsx("h4", { className: "kanban-card__title", title: task.title, children: task.title }) }), _jsxs("div", { className: "kanban-card__meta", children: [_jsx("div", { className: "kanban-card__meta-line", children: _jsxs("div", { className: "kanban-card__assignee", title: assigneeLabelRaw || "Sem responsavel", children: [_jsx("div", { className: `kanban-avatar${assignee ? "" : " is-muted"}`, children: assignee?.avatar ? (_jsx("img", { src: assignee.avatar, alt: assigneeLabelRaw || "Responsavel" })) : (_jsx("span", { children: assigneeInitials || "?" })) }), _jsx("span", { className: `kanban-card__meta-text${assignee ? "" : " is-muted"}`, children: assigneeLabel })] }) }), _jsx("div", { className: "kanban-card__meta-line", children: _jsxs("div", { className: "kanban-card__dates", children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "kanban-card__icon", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] }), hasDates ? (_jsxs("div", { className: "kanban-card__date-group", children: [startLabel && _jsxs("span", { children: ["Inicio: ", startLabel] }), endLabel && _jsxs("span", { children: ["Fim: ", endLabel] })] })) : (_jsx("span", { className: "kanban-card__meta-text is-muted", children: "Sem datas" }))] }) }), priorityBadge && (_jsx("div", { className: "kanban-card__meta-line", children: priorityBadge }))] })] }));
                                            } }, task.id))), provided.placeholder] })) })] }, column.id));
                }) }), isCreateOpen && createStatus && (_jsx("div", { className: "kanbanModalOverlay", onMouseDown: (event) => {
                    if (event.target === event.currentTarget) {
                        closeCreateModal();
                    }
                }, children: _jsxs("div", { className: "kanbanModal", onMouseDown: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-labelledby": "kanban-create-title", children: [_jsxs("div", { className: "kanbanModalHeader", children: [_jsxs("div", { children: [_jsx("div", { className: "kanbanModalTitle", id: "kanban-create-title", children: "Nova tarefa" }), _jsxs("div", { className: "kanbanModalSubtitle", children: ["Em ", STATUS_MAP[createStatus]] })] }), _jsx("button", { type: "button", className: "kanbanIconButton", onClick: closeCreateModal, "aria-label": "Fechar modal", children: "\u00D7" })] }), _jsxs("form", { onSubmit: handleModalSubmit, className: "kanbanModalBody", children: [_jsxs("label", { className: "kanbanField", children: [_jsx("span", { children: "T\u00EDtulo da tarefa" }), _jsx("input", { type: "text", value: createTitle, onChange: (e) => setCreateTitle(e.target.value), placeholder: "Digite o t\u00EDtulo...", autoFocus: true, required: true })] }), _jsxs("label", { className: "kanbanField", children: [_jsx("span", { children: "Prioridade" }), _jsxs("select", { value: createPriority, onChange: (e) => setCreatePriority(e.target.value), children: [_jsx("option", { value: "LOW", children: "Baixa" }), _jsx("option", { value: "MEDIUM", children: "M\u00E9dia" }), _jsx("option", { value: "HIGH", children: "Alta" })] })] }), _jsxs("div", { className: "kanbanModalFooter", children: [_jsx("button", { type: "button", className: "btnGhost", onClick: closeCreateModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btnPrimary", disabled: !createTitle.trim(), children: "Criar tarefa" })] })] })] }) }))] }));
};
export default KanbanBoard;
