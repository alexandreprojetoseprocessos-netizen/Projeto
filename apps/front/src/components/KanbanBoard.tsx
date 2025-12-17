import React, { FormEvent, useMemo, useState } from "react";
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
  assignee?: { id: string; name: string; avatar?: string };
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
  const [modalColumn, setModalColumn] = useState<TaskStatus | null>(null);
  const [modalTaskTitle, setModalTaskTitle] = useState("");
  const [modalTaskPriority, setModalTaskPriority] =
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
    setModalColumn(columnId);
    setModalTaskTitle("");
    setModalTaskPriority("MEDIUM");
    onTaskColumnChange(columnId);
  };

  const closeCreateModal = () => {
    setModalColumn(null);
    setModalTaskTitle("");
    setModalTaskPriority("MEDIUM");
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modalColumn || !modalTaskTitle.trim()) return;

    onTaskTitleChange(modalTaskTitle);
    onTaskColumnChange(modalColumn);

    const success = await onCreate(event);
    if (success) {
      closeCreateModal();
    }
  };

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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return null;
    }
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
                        {(dragProvided, dragSnapshot) => (
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
                            <h4 className="kanban-card__title" title={task.title}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="kanban-card__description">
                                {task.description}
                              </p>
                            )}
                            {(task.assignee || task.dueDate || task.priority) && (
                              <div className="kanban-card__meta">
                                {task.assignee && (
                                  <div
                                    className="kanban-card__meta-item kanban-card__assignee-chip"
                                    title={task.assignee.name}
                                  >
                                    <div className="kanban-avatar">
                                      {task.assignee.avatar ? (
                                        <img
                                          src={task.assignee.avatar}
                                          alt={task.assignee.name}
                                        />
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
                                  </div>
                                )}
                                {task.dueDate && (
                                  <div className="kanban-card__meta-item kanban-card__due-date">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
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
                                    <span>{formatDate(task.dueDate)}</span>
                                  </div>
                                )}
                                {task.priority && (
                                  <div className="kanban-card__meta-item">
                                    {getPriorityBadge(task.priority)}
                                  </div>
                                )}
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
            </div>
          );
        })}
      </DragDropContext>

      {modalColumn && (
        <div className="kanban-modal-overlay" onClick={closeCreateModal}>
          <div
            className="kanban-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="kanban-modal__header">
              <h3>Nova tarefa em {STATUS_MAP[modalColumn]}</h3>
              <button
                type="button"
                className="kanban-modal__close"
                onClick={closeCreateModal}
                aria-label="Fechar modal"
              >
                ×
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
                  onChange={(e) =>
                    setModalTaskPriority(e.target.value as Priority)
                  }
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </label>
              <div className="kanban-modal__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!modalTaskTitle.trim()}
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
