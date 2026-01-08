import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export type TaskStatus =
  | "BACKLOG"
  | "IN_PROGRESS"
  | "DELAYED"
  | "RISK"
  | "REVIEW"
  | "DONE";

export const STATUS_MAP: Record<TaskStatus, string> = {
  BACKLOG: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  DELAYED: "Em atraso",
  RISK: "Em risco",
  REVIEW: "Homologação",
  DONE: "Finalizado",
};

export const KANBAN_STATUS_ORDER: TaskStatus[] = [
  "BACKLOG",
  "IN_PROGRESS",
  "DELAYED",
  "RISK",
  "REVIEW",
  "DONE",
];

type Priority = "LOW" | "MEDIUM" | "HIGH" | (string & {});

export type KanbanTask = {
  id: string;
  title: string;
  status: TaskStatus;
  code?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  startAt?: string;
  endAt?: string;
  start?: string;
  end?: string;
  assignee?: { id: string; name?: string; email?: string; avatar?: string };
  responsible?: { id: string; name?: string; email?: string; avatar?: string };
  tags?: string[];
  priority?: Priority;
};

export type KanbanColumn = {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  wipLimit?: number;
};

type KanbanBoardProps = {
  columns: KanbanColumn[];
  onDragEnd: (result: DropResult) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onTaskClick?: (task: KanbanTask) => void;
  newTaskTitle: string;
  onTaskTitleChange: (title: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (columnId: string) => void;
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  HIGH: { label: "Alta", color: "#ef4444", bgColor: "#fee2e2" },
  MEDIUM: { label: "Média", color: "#f59e0b", bgColor: "#fef3c7" },
  LOW: { label: "Baixa", color: "#10b981", bgColor: "#d1fae5" },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onDragEnd,
  onCreate,
  onTaskClick,
  onTaskTitleChange,
  onTaskColumnChange,
  newTaskTitle: _newTaskTitle,
  newTaskColumn: _newTaskColumn,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [createTitle, setCreateTitle] = useState("");
  const [createPriority, setCreatePriority] =
    useState<Priority>("MEDIUM");

  const standardColumns = useMemo(
    () =>
      KANBAN_STATUS_ORDER.map((statusKey) => {
        const existingColumn = columns.find((col) => col.id === statusKey);
        return {
          id: statusKey,
          title: STATUS_MAP[statusKey],
          tasks: existingColumn?.tasks ?? [],
          wipLimit: existingColumn?.wipLimit,
        };
      }),
    [columns]
  );

  const openCreateModal = (columnId: TaskStatus) => {
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

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createStatus || !createTitle.trim()) return;

    onTaskTitleChange(createTitle);
    onTaskColumnChange(createStatus);

    const success = await onCreate(event);
    if (success) {
      closeCreateModal();
    }
  };

  useEffect(() => {
    if (!isCreateOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCreateModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateOpen]);

  const getPriorityBadge = (priority?: Priority) => {
    if (!priority) return null;
    const config = PRIORITY_CONFIG[priority];
    if (!config) return null;
    return (
      <span
        className="kanban-priority-badge"
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const formatDateBR = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getInitials = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const base = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const getShortName = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("@")) {
      return trimmed.split("@")[0];
    }
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  };

  if (!columns.length) {
    return (
      <p className="muted">Quadro vazio. Configure as colunas para começar.</p>
    );
  }

  return (
    <div className="kanbanBoard">
      <DragDropContext onDragEnd={onDragEnd}>
        {standardColumns.map((column) => {
          const taskCount = column.tasks.length;
          const isOverLimit =
            column.wipLimit !== undefined && taskCount > column.wipLimit;

          return (
            <div
              className="kanbanColumn"
              key={column.id}
              data-column-id={column.id}
            >
              <div className="kanbanColumnHeader">
                <div className="kanbanColumnHeaderLeft">
                  <div className="kanbanColumnTitle">{column.title}</div>
                  <span className="kanbanCountBadge">{taskCount}</span>
                  {column.wipLimit !== undefined && (
                    <span
                      className={`kanban-wip-limit ${
                        isOverLimit ? "is-exceeded" : ""
                      }`}
                    >
                      / {column.wipLimit}
                    </span>
                  )}
                </div>
                <div className="kanbanColumnActions">
                  <button
                    className="kanbanCreateBtn"
                    type="button"
                    onClick={() => openCreateModal(column.id)}
                    aria-label={`Criar tarefa em ${column.title}`}
                    title={`Criar tarefa em ${column.title}`}
                  >
                    + Criar
                  </button>
                  <button
                    className="kanbanMenuBtn"
                    type="button"
                    aria-label="Mais ações"
                    title="Mais ações"
                  >
                    ⋯
                  </button>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanbanColumnBody ${
                      snapshot.isDraggingOver ? "is-dragging-over" : ""
                    }`}
                  >
                    {taskCount === 0 && (
                      <div className="kanban-empty-state">
                        <p className="muted">Sem tarefas</p>
                      </div>
                    )}

                    {column.tasks.map((task, index) => (
                      <Draggable
                        draggableId={task.id}
                        index={index}
                        key={task.id}
                      >
                        {(dragProvided, dragSnapshot) => {
                          const assignee = task.assignee ?? task.responsible ?? null;
                          const assigneeLabelRaw = assignee?.name ?? assignee?.email ?? "";
                          const assigneeLabel = assigneeLabelRaw
                            ? getShortName(assigneeLabelRaw)
                            : "Sem responsavel";
                          const assigneeInitials = assignee
                            ? getInitials(assigneeLabelRaw)
                            : "?";
                          const startLabel = formatDateBR(
                            task.startDate ?? task.startAt ?? task.start ?? null
                          );
                          const endLabel = formatDateBR(
                            task.endDate ??
                              task.dueDate ??
                              task.endAt ??
                              task.end ??
                              null
                          );
                          const hasDates = Boolean(startLabel || endLabel);
                          const priorityBadge = getPriorityBadge(task.priority);

                          return (
                            <article
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`kanbanCard ${
                                dragSnapshot.isDragging ? "is-dragging" : ""
                              }`}
                              onClick={() => onTaskClick?.(task)}
                              style={{
                                ...dragProvided.draggableProps.style,
                                transform: dragSnapshot.isDragging
                                  ? `${
                                      dragProvided.draggableProps.style?.transform
                                    } scale(1.05)`
                                  : dragProvided.draggableProps.style?.transform,
                              }}
                            >
                              {task.code && (
                                <span className="kanban-card__code">
                                  {task.code}
                                </span>
                              )}
                              <div className="kanban-card__header">
                                <h4 className="kanban-card__title" title={task.title}>
                                  {task.title}
                                </h4>
                              </div>
                              <div className="kanban-card__meta">
                                <div className="kanban-card__meta-line">
                                  <div
                                    className="kanban-card__assignee"
                                    title={assigneeLabelRaw || "Sem responsavel"}
                                  >
                                    <div
                                      className={`kanban-avatar${assignee ? "" : " is-muted"}`}
                                    >
                                      {assignee?.avatar ? (
                                        <img
                                          src={assignee.avatar}
                                          alt={assigneeLabelRaw || "Responsavel"}
                                        />
                                      ) : (
                                        <span>{assigneeInitials || "?"}</span>
                                      )}
                                    </div>
                                    <span
                                      className={`kanban-card__meta-text${
                                        assignee ? "" : " is-muted"
                                      }`}
                                    >
                                      {assigneeLabel}
                                    </span>
                                  </div>
                                </div>
                                <div className="kanban-card__meta-line">
                                  <div className="kanban-card__dates">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="kanban-card__icon"
                                    >
                                      <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <line x1="16" y1="2" x2="16" y2="6" />
                                      <line x1="8" y1="2" x2="8" y2="6" />
                                      <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    {hasDates ? (
                                      <div className="kanban-card__date-group">
                                        {startLabel && <span>Inicio: {startLabel}</span>}
                                        {endLabel && <span>Fim: {endLabel}</span>}
                                      </div>
                                    ) : (
                                      <span className="kanban-card__meta-text is-muted">
                                        Sem datas
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {priorityBadge && (
                                  <div className="kanban-card__meta-line">
                                    {priorityBadge}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>

      {isCreateOpen && createStatus && (
        <div
          className="kanbanModalOverlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div
            className="kanbanModal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kanban-create-title"
          >
            <div className="kanbanModalHeader">
              <div>
                <div className="kanbanModalTitle" id="kanban-create-title">
                  Nova tarefa
                </div>
                <div className="kanbanModalSubtitle">
                  Em {STATUS_MAP[createStatus]}
                </div>
              </div>
              <button
                type="button"
                className="kanbanIconButton"
                onClick={closeCreateModal}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="kanbanModalBody">
              <label className="kanbanField">
                <span>Título da tarefa</span>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Digite o título..."
                  autoFocus
                  required
                />
              </label>
              <label className="kanbanField">
                <span>Prioridade</span>
                <select
                  value={createPriority}
                  onChange={(e) =>
                    setCreatePriority(e.target.value as Priority)
                  }
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </label>
              <div className="kanbanModalFooter">
                <button
                  type="button"
                  className="btnGhost"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btnPrimary"
                  disabled={!createTitle.trim()}
                >
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

export default KanbanBoard;
