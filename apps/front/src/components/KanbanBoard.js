import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// ============================================================================
// MAPA DE STATUS PADRONIZADO
// ============================================================================
export const STATUS_MAP = {
    BACKLOG: "Backlog",
    TODO: "Planejamento",
    IN_PROGRESS: "Em andamento",
    REVIEW: "Revisão",
    DONE: "Concluído"
};
export const KANBAN_STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];
// ============================================================================
// MAPA DE PRIORIDADES COM CORES
// ============================================================================
const PRIORITY_CONFIG = {
    HIGH: { label: "Alta", color: "#ef4444", bgColor: "#fee2e2" },
    MEDIUM: { label: "Média", color: "#f59e0b", bgColor: "#fef3c7" },
    LOW: { label: "Baixa", color: "#10b981", bgColor: "#d1fae5" }
};
// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const KanbanBoard = ({ columns, onDragEnd, onCreate, onTaskClick, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange }) => {
    const [collapsedColumns, setCollapsedColumns] = useState(new Set());
    const [modalColumn, setModalColumn] = useState(null);
    const [modalTaskTitle, setModalTaskTitle] = useState("");
    const [modalTaskPriority, setModalTaskPriority] = useState("MEDIUM");
    // Configuração padronizada das colunas
    const standardColumns = useMemo(() => {
        return KANBAN_STATUS_ORDER.map((statusKey) => {
            const existingColumn = columns.find((col) => col.id === statusKey);
            return {
                id: statusKey,
                title: STATUS_MAP[statusKey],
                tasks: existingColumn?.tasks ?? [],
                wipLimit: existingColumn?.wipLimit,
                isCollapsed: collapsedColumns.has(statusKey)
            };
        });
    }, [columns, collapsedColumns]);
    const toggleColumnCollapse = (columnId) => {
        setCollapsedColumns((prev) => {
            const next = new Set(prev);
            if (next.has(columnId)) {
                next.delete(columnId);
            }
            else {
                next.add(columnId);
            }
            return next;
        });
    };
    const openCreateModal = (columnId) => {
        setModalColumn(columnId);
        setModalTaskTitle("");
        setModalTaskPriority("MEDIUM");
    };
    const closeCreateModal = () => {
        setModalColumn(null);
        setModalTaskTitle("");
        setModalTaskPriority("MEDIUM");
    };
    const handleModalSubmit = async (event) => {
        event.preventDefault();
        if (!modalColumn || !modalTaskTitle.trim())
            return;
        // Temporariamente, ajustamos os valores do formulário global
        onTaskTitleChange(modalTaskTitle);
        onTaskColumnChange(modalColumn);
        // Submetemos o formulário
        const success = await onCreate(event);
        if (success) {
            closeCreateModal();
        }
    };
    const getPriorityBadge = (priority) => {
        if (!priority)
            return null;
        const config = PRIORITY_CONFIG[priority];
        return (_jsx("span", { className: "kanban-priority-badge", style: {
                backgroundColor: config.bgColor,
                color: config.color,
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600
            }, children: config.label }));
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return null;
        try {
            return new Date(dateString).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short"
            });
        }
        catch {
            return null;
        }
    };
    if (!columns.length) {
        return _jsx("p", { className: "muted", children: "Quadro vazio. Configure as colunas para come\u00E7ar." });
    }
    return (_jsxs("div", { className: "kanban-container", children: [_jsx(DragDropContext, { onDragEnd: onDragEnd, children: _jsx("div", { className: "kanban-board", children: standardColumns.map((column) => {
                        const isCollapsed = column.isCollapsed;
                        const taskCount = column.tasks.length;
                        const isOverLimit = column.wipLimit && taskCount > column.wipLimit;
                        return (_jsxs("div", { className: `kanban-column ${isCollapsed ? "is-collapsed" : ""}`, "data-column-id": column.id, children: [_jsxs("div", { className: "kanban-column__header", children: [_jsxs("div", { className: "kanban-column__title-group", children: [_jsx("button", { type: "button", className: "kanban-collapse-btn", onClick: () => toggleColumnCollapse(column.id), "aria-label": isCollapsed ? "Expandir coluna" : "Recolher coluna", title: isCollapsed ? "Expandir coluna" : "Recolher coluna", children: isCollapsed ? "▶" : "▼" }), _jsx("h3", { children: column.title }), _jsx("span", { className: "kanban-column__count", children: taskCount }), column.wipLimit && (_jsxs("span", { className: `kanban-wip-limit ${isOverLimit ? "is-exceeded" : ""}`, children: ["/ ", column.wipLimit] }))] }), !isCollapsed && (_jsx("button", { type: "button", className: "kanban-add-btn", onClick: () => openCreateModal(column.id), "aria-label": `Criar tarefa em ${column.title}`, title: `Criar tarefa em ${column.title}`, children: "+ Criar" }))] }), !isCollapsed && (_jsx(Droppable, { droppableId: column.id, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: `kanban-column__body ${snapshot.isDraggingOver ? "is-dragging-over" : ""}`, children: [taskCount === 0 && (_jsx("div", { className: "kanban-empty-state", children: _jsx("p", { className: "muted", children: "Sem tarefas" }) })), column.tasks.map((task, index) => (_jsx(Draggable, { draggableId: task.id, index: index, children: (dragProvided, dragSnapshot) => (_jsxs("article", { ref: dragProvided.innerRef, ...dragProvided.draggableProps, ...dragProvided.dragHandleProps, className: `kanban-card ${dragSnapshot.isDragging ? "is-dragging" : ""}`, onClick: () => onTaskClick?.(task), style: {
                                                        ...dragProvided.draggableProps.style,
                                                        transform: dragSnapshot.isDragging
                                                            ? `${dragProvided.draggableProps.style?.transform} scale(1.05)`
                                                            : dragProvided.draggableProps.style?.transform
                                                    }, children: [_jsx("h4", { className: "kanban-card__title", children: task.title }), task.description && (_jsx("p", { className: "kanban-card__description", children: task.description })), _jsxs("div", { className: "kanban-card__meta", children: [_jsx("div", { className: "kanban-card__row", children: _jsxs("span", { className: "kanban-card__status", children: ["Status: ", _jsx("strong", { children: STATUS_MAP[task.status] })] }) }), task.priority && (_jsx("div", { className: "kanban-card__row", children: getPriorityBadge(task.priority) })), task.dueDate && (_jsxs("div", { className: "kanban-card__row kanban-card__due-date", children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] }), _jsx("span", { children: formatDate(task.dueDate) })] }))] }), task.assignee && (_jsxs("div", { className: "kanban-card__assignee", children: [_jsx("div", { className: "kanban-avatar", title: task.assignee.name, children: task.assignee.avatar ? (_jsx("img", { src: task.assignee.avatar, alt: task.assignee.name })) : (_jsx("span", { children: task.assignee.name
                                                                            .split(" ")
                                                                            .map((n) => n[0])
                                                                            .join("")
                                                                            .slice(0, 2)
                                                                            .toUpperCase() })) }), _jsx("span", { className: "kanban-assignee-name", children: task.assignee.name })] })), task.tags && task.tags.length > 0 && (_jsx("div", { className: "kanban-card__tags", children: task.tags.slice(0, 3).map((tag) => (_jsx("span", { className: "kanban-tag", children: tag }, tag))) }))] })) }, task.id))), provided.placeholder] })) }))] }, column.id));
                    }) }) }), modalColumn && (_jsx("div", { className: "kanban-modal-overlay", onClick: closeCreateModal, children: _jsxs("div", { className: "kanban-modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "kanban-modal__header", children: [_jsxs("h3", { children: ["Nova tarefa em ", STATUS_MAP[modalColumn]] }), _jsx("button", { type: "button", className: "kanban-modal__close", onClick: closeCreateModal, "aria-label": "Fechar modal", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleModalSubmit, className: "kanban-modal__form", children: [_jsxs("label", { children: [_jsx("span", { children: "T\u00EDtulo da tarefa" }), _jsx("input", { type: "text", value: modalTaskTitle, onChange: (e) => setModalTaskTitle(e.target.value), placeholder: "Digite o t\u00EDtulo...", autoFocus: true, required: true })] }), _jsxs("label", { children: [_jsx("span", { children: "Prioridade" }), _jsxs("select", { value: modalTaskPriority, onChange: (e) => setModalTaskPriority(e.target.value), children: [_jsx("option", { value: "LOW", children: "Baixa" }), _jsx("option", { value: "MEDIUM", children: "M\u00E9dia" }), _jsx("option", { value: "HIGH", children: "Alta" })] })] }), _jsxs("div", { className: "kanban-modal__actions", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: closeCreateModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: !modalTaskTitle.trim(), children: "Criar tarefa" })] })] })] }) }))] }));
};
