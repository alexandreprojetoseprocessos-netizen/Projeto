import { useState, useMemo, type FormEvent } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

// ============================================================================
// MAPA DE STATUS PADRONIZADO
// ============================================================================
export const STATUS_MAP = {
  BACKLOG: "Backlog",
  TODO: "Planejamento",
  IN_PROGRESS: "Em andamento",
  REVIEW: "Revisão",
  DONE: "Concluído"
} as const;

export type TaskStatus = keyof typeof STATUS_MAP;
export const KANBAN_STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

// ============================================================================
// MAPA DE PRIORIDADES COM CORES
// ============================================================================
const PRIORITY_CONFIG = {
  HIGH: { label: "Alta", color: "#ef4444", bgColor: "#fee2e2" },
  MEDIUM: { label: "Média", color: "#f59e0b", bgColor: "#fef3c7" },
  LOW: { label: "Baixa", color: "#10b981", bgColor: "#d1fae5" }
} as const;

export type TaskPriority = keyof typeof PRIORITY_CONFIG;

// ============================================================================
// TIPOS
// ============================================================================
export type KanbanTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  tags?: string[];
  order?: number;
};

export type KanbanColumn = {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  wipLimit?: number;
  isCollapsed?: boolean;
};

type KanbanBoardProps = {
  columns: KanbanColumn[];
  onDragEnd: (result: DropResult) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onTaskClick?: (task: KanbanTask) => void;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const KanbanBoard = ({
  columns,
  onDragEnd,
  onCreate,
  onTaskClick,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange
}: KanbanBoardProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [modalColumn, setModalColumn] = useState<TaskStatus | null>(null);
  const [modalTaskTitle, setModalTaskTitle] = useState("");
  const [modalTaskPriority, setModalTaskPriority] = useState<TaskPriority>("MEDIUM");

  // Configuração padronizada das colunas
  const standardColumns: KanbanColumn[] = useMemo(() => {
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

  const toggleColumnCollapse = (columnId: TaskStatus) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const openCreateModal = (columnId: TaskStatus) => {
    setModalColumn(columnId);
    setModalTaskTitle("");
    setModalTaskPriority("MEDIUM");
  };

  const closeCreateModal = () => {
    setModalColumn(null);
    setModalTaskTitle("");
    setModalTaskPriority("MEDIUM");
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modalColumn || !modalTaskTitle.trim()) return;

    // Temporariamente, ajustamos os valores do formulário global
    onTaskTitleChange(modalTaskTitle);
    onTaskColumnChange(modalColumn);

    // Submetemos o formulário
    const success = await onCreate(event);
    
    if (success) {
      closeCreateModal();
    }
  };

  const getPriorityBadge = (priority?: TaskPriority) => {
    if (!priority) return null;
    const config = PRIORITY_CONFIG[priority];
    return (
      <span
        className="kanban-priority-badge"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600
        }}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short"
      });
    } catch {
      return null;
    }
  };

  if (!columns.length) {
    return <p className="muted">Quadro vazio. Configure as colunas para começar.</p>;
  }

  return (
    <div className="kanban-container">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {standardColumns.map((column) => {
            const isCollapsed = column.isCollapsed;
            const taskCount = column.tasks.length;
            const isOverLimit = column.wipLimit && taskCount > column.wipLimit;

            return (
              <div
                key={column.id}
                className={`kanban-column ${isCollapsed ? "is-collapsed" : ""}`}
                data-column-id={column.id}
              >
                {/* HEADER DA COLUNA */}
                <div className="kanban-column__header">
                  <div className="kanban-column__title-group">
                    <button
                      type="button"
                      className="kanban-collapse-btn"
                      onClick={() => toggleColumnCollapse(column.id)}
                      aria-label={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                      title={isCollapsed ? "Expandir coluna" : "Recolher coluna"}
                    >
                      {isCollapsed ? "▶" : "▼"}
                    </button>
                    <h3>{column.title}</h3>
                    <span className="kanban-column__count">{taskCount}</span>
                    {column.wipLimit && (
                      <span className={`kanban-wip-limit ${isOverLimit ? "is-exceeded" : ""}`}>
                        / {column.wipLimit}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <button
                      type="button"
                      className="kanban-add-btn"
                      onClick={() => openCreateModal(column.id)}
                      aria-label={`Criar tarefa em ${column.title}`}
                      title={`Criar tarefa em ${column.title}`}
                    >
                      + Criar
                    </button>
                  )}
                </div>

                {/* LISTA DE TAREFAS (droppable) */}
                {!isCollapsed && (
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`kanban-column__body ${snapshot.isDraggingOver ? "is-dragging-over" : ""}`}
                      >
                        {taskCount === 0 && (
                          <div className="kanban-empty-state">
                            <p className="muted">Sem tarefas</p>
                          </div>
                        )}

                        {column.tasks.map((task, index) => (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(dragProvided, dragSnapshot) => (
                              <article
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`kanban-card ${dragSnapshot.isDragging ? "is-dragging" : ""}`}
                                onClick={() => onTaskClick?.(task)}
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  transform: dragSnapshot.isDragging
                                    ? `${dragProvided.draggableProps.style?.transform} scale(1.05)`
                                    : dragProvided.draggableProps.style?.transform
                                }}
                              >
                                {/* TÍTULO */}
                                <h4 className="kanban-card__title">{task.title}</h4>

                                {/* DESCRIÇÃO (se houver) */}
                                {task.description && (
                                  <p className="kanban-card__description">{task.description}</p>
                                )}

                                {/* METADADOS */}
                                <div className="kanban-card__meta">
                                  <div className="kanban-card__row">
                                    <span className="kanban-card__status">
                                      Status: <strong>{STATUS_MAP[task.status]}</strong>
                                    </span>
                                  </div>

                                  {task.priority && (
                                    <div className="kanban-card__row">
                                      {getPriorityBadge(task.priority)}
                                    </div>
                                  )}

                                  {task.dueDate && (
                                    <div className="kanban-card__row kanban-card__due-date">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                      </svg>
                                      <span>{formatDate(task.dueDate)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* ASSIGNEE */}
                                {task.assignee && (
                                  <div className="kanban-card__assignee">
                                    <div className="kanban-avatar" title={task.assignee.name}>
                                      {task.assignee.avatar ? (
                                        <img src={task.assignee.avatar} alt={task.assignee.name} />
                                      ) : (
                                        <span>
                                          {task.assignee.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <span className="kanban-assignee-name">{task.assignee.name}</span>
                                  </div>
                                )}

                                {/* TAGS */}
                                {task.tags && task.tags.length > 0 && (
                                  <div className="kanban-card__tags">
                                    {task.tags.slice(0, 3).map((tag) => (
                                      <span key={tag} className="kanban-tag">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </article>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* MODAL DE CRIAÇÃO RÁPIDA */}
      {modalColumn && (
        <div className="kanban-modal-overlay" onClick={closeCreateModal}>
          <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kanban-modal__header">
              <h3>Nova tarefa em {STATUS_MAP[modalColumn]}</h3>
              <button
                type="button"
                className="kanban-modal__close"
                onClick={closeCreateModal}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="kanban-modal__form">
              <label>
                <span>Título da tarefa</span>
                <input
                  type="text"
                  value={modalTaskTitle}
                  onChange={(e) => setModalTaskTitle(e.target.value)}
                  placeholder="Digite o título..."
                  autoFocus
                  required
                />
              </label>

              <label>
                <span>Prioridade</span>
                <select
                  value={modalTaskPriority}
                  onChange={(e) => setModalTaskPriority(e.target.value as TaskPriority)}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </label>

              <div className="kanban-modal__actions">
                <button type="button" className="secondary-button" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={!modalTaskTitle.trim()}>
                  Criar tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
