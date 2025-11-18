import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type FormEvent,
  type MouseEvent,
  type CSSProperties,
  type KeyboardEvent
} from "react";
import { ProjectPortfolio, type PortfolioProject } from "./ProjectPortfolio";
import { NotFoundPage } from "./NotFoundPage";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("pt-BR");
};

const sidebarNavigation = [
  { id: "dashboard", label: "Dashboard" },
  { id: "projects", label: "Projetos" },
  { id: "team", label: "Equipe" },
  { id: "reports", label: "Relatórios" },
  { id: "settings", label: "Configurações" }
];

export type CreateProjectPayload = {
  name: string;
  clientName: string;
  budget: number;
  repositoryUrl?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  teamMembers: string[];
};

type TemplateTreeNode = {
  id: string;
  title: string;
  children?: TemplateTreeNode[];
};

type TemplateCustomField = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
};

export type TemplateNodeInput = {
  id?: string;
  title: string;
  children?: TemplateNodeInput[];
};

export type TemplateCustomFieldInput = {
  id?: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
};

export type TemplateEditorPayload = {
  name: string;
  type: string;
  clientName?: string;
  repositoryUrl?: string;
  budget?: number;
  columns: string[];
  wbs: TemplateNodeInput[];
  customFields: TemplateCustomFieldInput[];
};

type TemplateSummary = {
  id: string;
  name: string;
  type: string;
  clientName?: string | null;
  repositoryUrl?: string | null;
  budget?: number | null;
  columns?: string[];
  wbs?: TemplateNodeInput[];
  customFields?: TemplateCustomFieldInput[];
  updatedAt?: string | null;
};

type Organization = { id: string; name: string; role: string };
type Project = { id: string; name: string };

const createEmptyProjectForm = () => ({
  name: "",
  clientName: "",
  budget: "",
  repositoryUrl: "",
  startDate: "",
  endDate: "",
  description: "",
  teamMembers: ""
});

type DashboardLayoutProps = {
  userEmail: string | null;
  organizations: Organization[];
  selectedOrganizationId: string;
  onOrganizationChange: (organizationId: string) => void;
  orgError: string | null;
  onSignOut: () => void;
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projectsError: string | null;
  filters: { rangeDays: number };
  onRangeChange: (rangeDays: number) => void;
  summary: any | null;
  summaryError: string | null;
  members: any[];
  membersError: string | null;
  attachments: any[];
  attachmentsError: string | null;
  attachmentsLoading: boolean;
  reportMetrics: any | null;
  reportMetricsError: string | null;
  reportMetricsLoading: boolean;
  boardColumns: any[];
  boardError: string | null;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onReloadBoard?: () => Promise<void>;
  onDragTask: (result: DropResult) => void;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
  newTaskStartDate: string;
  onTaskStartDateChange: (value: string) => void;
  newTaskEndDate: string;
  onTaskEndDateChange: (value: string) => void;
  newTaskAssignee: string;
  onTaskAssigneeChange: (value: string) => void;
  newTaskEstimateHours: string;
  onTaskEstimateHoursChange: (value: string) => void;
  wbsNodes: any[];
  wbsError: string | null;
  onMoveNode: (id: string, parentId: string | null, position: number) => void;
  onUpdateWbsNode: (nodeId: string, changes: { title?: string; status?: string }) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  comments: any[];
  commentsError: string | null;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  commentBody: string;
  onCommentBodyChange: (value: string) => void;
  timeEntryDate: string;
  timeEntryHours: string;
  timeEntryDescription: string;
  timeEntryError: string | null;
  onTimeEntryDateChange: (value: string) => void;
  onTimeEntryHoursChange: (value: string) => void;
  onTimeEntryDescriptionChange: (value: string) => void;
  onLogTime: (event: FormEvent<HTMLFormElement>) => void;
  ganttTasks: any[];
  ganttMilestones: any[];
  ganttError: string | null;
  portfolio: PortfolioProject[];
  portfolioError: string | null;
  portfolioLoading: boolean;
  onExportPortfolio?: () => void;
  onCreateProject: (payload: CreateProjectPayload) => Promise<void>;
  onUpdateProject: (projectId: string, payload: CreateProjectPayload) => Promise<void>;
};

const KanbanBoard = ({
  columns,
  onDragEnd,
  onCreate,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange
}: {
  columns: any[];
  onDragEnd: (result: DropResult) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
}) => {
  if (!columns.length) return <p className="muted">Quadro vazio.</p>;

  return (
    <div className="kanban-wrapper">
      <form onSubmit={onCreate} className="kanban-form">
        <input
          placeholder="Título da tarefa"
          value={newTaskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value)}
          disabled={!columns.length}
        />
        <select value={newTaskColumn} onChange={(event) => onTaskColumnChange(event.target.value)} disabled={!columns.length}>
          {columns.map((column: any) => (
            <option key={column.id} value={column.id}>
              {column.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!newTaskTitle.trim() || !newTaskColumn}>
          Adicionar tarefa
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columns.map((column: any) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="kanban-column__header">
                    <strong>{column.label}</strong>
                    {column.wipLimit && (
                      <small>
                        ({column.tasks.length}/{column.wipLimit})
                      </small>
                    )}
                  </div>
                  <div className="kanban-column__body">
                    {column.tasks.length === 0 && <span className="muted">Sem tarefas</span>}
                    {column.tasks.map((task: any, index: number) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(dragProvided, snapshot) => (
                          <article
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`kanban-card ${snapshot.isDragging ? "is-dragging" : ""}`}
                          >
                            <strong>{task.title}</strong>
                            <div className="kanban-card__meta">
                              <span>Status: {task.status}</span>
                              {task.priority && <span> · Prioridade: {task.priority}</span>}
                            </div>
                          </article>
                        )}
                      </Draggable>
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};




const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="15" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 7.5a2.5 2.5 0 012.5-2.5H10l2.3 2.3c.3.3.7.5 1.1.5h7.1A1.5 1.5 0 0122 8.8v8.2A3 3 0 0119 20H5a3 3 0 01-3-3Z"
      fill="currentColor"
      opacity="0.15"
    />
    <path
      d="M4.5 6H10a2 2 0 011.4.6l1.2 1.3c.4.4.9.6 1.4.6h5.7A1.5 1.5 0 0120 10v7a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 012 17V9.5A3.5 3.5 0 015.5 6Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const TaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="6" width="16" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

const DetailsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm7 4v6m0-6V8m0 0h.01M7 12h4m-4 4h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type StatusTone = "success" | "info" | "neutral" | "danger" | "warning";

const statusDictionary: Record<string, { label: string; tone: StatusTone }> = {
  DONE: { label: "Finalizado", tone: "success" },
  COMPLETED: { label: "Finalizado", tone: "success" },
  FINISHED: { label: "Finalizado", tone: "success" },
  IN_PROGRESS: { label: "Em andamento", tone: "info" },
  WORKING: { label: "Em andamento", tone: "info" },
  BACKLOG: { label: "Não iniciado", tone: "neutral" },
  PLANNED: { label: "Não iniciado", tone: "neutral" },
  NOT_STARTED: { label: "Não iniciado", tone: "neutral" },
  WAITING: { label: "Não iniciado", tone: "neutral" },
  LATE: { label: "Em atraso", tone: "danger" },
  OVERDUE: { label: "Em atraso", tone: "danger" },
  AT_RISK: { label: "Em risco", tone: "warning" },
  BLOCKED: { label: "Em risco", tone: "warning" }
};

const editableStatusValues = ["BACKLOG", "IN_PROGRESS", "DONE", "LATE", "AT_RISK"];

const WbsTreeView = ({
  nodes,
  onMove,
  onUpdate,
  selectedNodeId,
  onSelect
}: {
  nodes: any[];
  onMove: (id: string, parentId: string | null, position: number) => void;
  onUpdate: (nodeId: string, changes: { title?: string; status?: string }) => void;
  selectedNodeId: string | null;
  onSelect: (nodeId: string | null) => void;
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [statusPickerId, setStatusPickerId] = useState<string | null>(null);

  type Row = {
    node: any;
    displayId: string;
    level: number;
    parentId: string | null;
    hasChildren: boolean;
  };

  const allRows = useMemo(() => {
    const buildRows = (tree: any[], marker: number[] = [], parentId: string | null = null, level = 0): Row[] =>
      tree.flatMap((node, index) => {
        const wbsMarker = [...marker, index + 1];
        const children = Array.isArray(node.children) ? node.children : [];
        const current: Row = {
          node,
          displayId: wbsMarker.join("."),
          level,
          parentId,
          hasChildren: children.length > 0
        };
        return [current, ...buildRows(children, wbsMarker, node.id, level + 1)];
      });

    return buildRows(nodes);
  }, [nodes]);

  const rowMap = useMemo(() => {
    const map = new Map<string, Row>();
    allRows.forEach((row) => map.set(row.node.id, row));
    return map;
  }, [allRows]);

  const cancelTitleEdit = () => {
    setEditingNodeId(null);
    setEditingTitle("");
  };

  const handleBeginTitleEdit = (event: MouseEvent<HTMLDivElement>, node: any) => {
    event.stopPropagation();
    setStatusPickerId(null);
    setEditingNodeId(node.id);
    setEditingTitle(node.title ?? "");
  };

  const commitTitleEdit = () => {
    if (!editingNodeId) return;
    const trimmed = editingTitle.trim();
    const previous = rowMap.get(editingNodeId)?.node.title ?? "";
    cancelTitleEdit();
    if (!trimmed || trimmed === previous) {
      return;
    }
    onUpdate(editingNodeId, { title: trimmed });
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTitleEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelTitleEdit();
    }
  };

  const handleStatusToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation();
    cancelTitleEdit();
    setStatusPickerId((current) => (current === nodeId ? null : nodeId));
  };

  const handleStatusChange = (event: MouseEvent<HTMLButtonElement>, nodeId: string, statusValue: string) => {
    event.stopPropagation();
    setStatusPickerId(null);
    const normalized = statusValue.toUpperCase();
    const current = (rowMap.get(nodeId)?.node.status ?? "").toUpperCase();
    if (current === normalized) return;
    onUpdate(nodeId, { status: normalized });
  };

  const statusPopoverStyle: CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    background: "#fff",
    borderRadius: "0.65rem",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
    padding: "0.35rem",
    display: "flex",
    flexDirection: "column",
    minWidth: "180px",
    gap: "0.25rem",
    zIndex: 20
  };

  const progressMap = useMemo(() => {
    const cache = new Map<string, number>();
    const compute = (node: any): number => {
      if (cache.has(node.id)) return cache.get(node.id)!;
      let value = 0;
      if (typeof node.progress === "number" && Number.isFinite(node.progress)) {
        value = Math.max(0, Math.min(100, Math.round(node.progress)));
      } else if (Array.isArray(node.children) && node.children.length) {
        const total = node.children.reduce((sum: number, child: any) => sum + compute(child), 0);
        value = node.children.length ? Math.round(total / node.children.length) : 0;
      }
      cache.set(node.id, value);
      return value;
    };
    nodes.forEach((node) => compute(node));
    return cache;
  }, [nodes]);

  const visibleRows = useMemo(() => {
    return allRows.filter((row) => {
      if (row.level === 0) return true;
      let parentId = row.parentId;
      while (parentId) {
        const parentRow = rowMap.get(parentId);
        if (!parentRow) break;
        const isExpanded = expandedNodes[parentId] ?? parentRow.level < 1;
        if (!isExpanded) return false;
        parentId = parentRow.parentId;
      }
      return true;
    });
  }, [allRows, rowMap, expandedNodes]);

  const handleLevelAdjust = (event: MouseEvent<HTMLButtonElement>, nodeId: string, direction: "up" | "down") => {
    event.stopPropagation();
    cancelTitleEdit();
    setStatusPickerId(null);
    const currentRow = rowMap.get(nodeId);
    if (!currentRow) return;

    if (direction === "up") {
      if (!currentRow.parentId) return;
      const parentRow = rowMap.get(currentRow.parentId);
      if (!parentRow) return;

      const newParentId = parentRow.parentId ?? null;
      const newParentRow = newParentId ? rowMap.get(newParentId) : null;
      const siblings = newParentRow ? newParentRow.node.children ?? [] : nodes;
      const parentIndex = siblings.findIndex((child: any) => child.id === parentRow.node.id);
      const position = parentIndex >= 0 ? parentIndex + 1 : siblings.length;
      onMove(nodeId, newParentId, position);
      return;
    }

    const parentRow = currentRow.parentId ? rowMap.get(currentRow.parentId) : null;
    const siblings = parentRow ? parentRow.node.children ?? [] : nodes;
    const currentIndex = siblings.findIndex((child: any) => child.id === nodeId);
    if (currentIndex <= 0) return;
    const newParentNode = siblings[currentIndex - 1];
    if (!newParentNode) return;
    const childCount = Array.isArray(newParentNode.children) ? newParentNode.children.length : 0;
    onMove(nodeId, newParentNode.id, childCount);
    setExpandedNodes((prev) => ({ ...prev, [newParentNode.id]: true }));
  };

  const resolveStatus = (status?: string | null) => {
    if (!status) return { label: "Não iniciado", tone: "neutral" as StatusTone };
    const normalized = status.toUpperCase();
    return statusDictionary[normalized] ?? { label: status, tone: "neutral" };
  };

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "—";
    const diff = Math.max(
      1,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
    );
    return `${diff}d`;
  };

  const selectedRow = selectedNodeId ? rowMap.get(selectedNodeId) ?? null : null;
  const selectedNode = selectedRow?.node ?? null;
  const selectedStatus = resolveStatus(selectedNode?.status);
  const selectedProgress = selectedNode ? progressMap.get(selectedNode.id) ?? 0 : 0;
  const selectedChecklist = Array.isArray(selectedNode?.checklist) ? selectedNode.checklist : [];

  const ensureAncestorsExpanded = useCallback(
    (nodeId: string) => {
      setExpandedNodes((current) => {
        const next = { ...current };
        let parentId = rowMap.get(nodeId)?.parentId ?? null;
        while (parentId) {
          next[parentId] = true;
          parentId = rowMap.get(parentId)?.parentId ?? null;
        }
        return next;
      });
    },
    [rowMap]
  );

  const handleToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string, level: number) => {
    event.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !(prev[nodeId] ?? level < 1)
    }));
  };

  const handleRowSelect = (nodeId: string) => {
    const isSame = selectedNodeId === nodeId;
    onSelect(isSame ? null : nodeId);
    setOpenMenuId(null);
    setStatusPickerId(null);
    cancelTitleEdit();
  };

  const handleDependencyClick = (event: MouseEvent<HTMLButtonElement>, dependencyId: string) => {
    event.stopPropagation();
    ensureAncestorsExpanded(dependencyId);
    handleRowSelect(dependencyId);
    setOpenMenuId(null);
  };

  const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation();
    cancelTitleEdit();
    setStatusPickerId(null);
    setOpenMenuId((current) => (current === nodeId ? null : nodeId));
  };

  const handleMenuAction = (event: MouseEvent<HTMLButtonElement>, label: string, node: any) => {
    event.stopPropagation();
    window.alert(`Ação "${label}" para ${node.title} disponível em breve.`);
    setOpenMenuId(null);
  };

  const handleCloseDetails = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect(null);
    setOpenMenuId(null);
  };

  const handleDetailsButton = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation();
    handleRowSelect(nodeId);
  };

  if (!nodes.length) {
    return <p className="muted">Nenhum item cadastrado.</p>;
  }

  return (
    <div className="wbs-table-card">
      <div className="wbs-table-scroll">
        <table className="wbs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nível</th>
              <th>Nome da tarefa</th>
              <th>Status</th>
              <th>Duração</th>
              <th>Início</th>
              <th>Término</th>
              <th>Responsável</th>
              <th>Progresso</th>
              <th>Dependências</th>
              <th>Detalhes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const displayId = row.node.wbsCode ?? row.displayId;
              const visualLevel = typeof row.node.level === "number" ? row.node.level : row.level;
              const progress = progressMap.get(row.node.id) ?? 0;
              const status = resolveStatus(row.node.status);
              const isExpanded = row.hasChildren ? expandedNodes[row.node.id] ?? visualLevel < 1 : false;
              const isActive = selectedNodeId === row.node.id;
              const ownerName = row.node.owner?.name ?? null;
              const ownerEmail = row.node.owner?.email ?? null;
              const initials = ownerName
                ? ownerName
                    .split(" ")
                    .map((part: string) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : null;
              const dependencyBadges = Array.isArray(row.node.dependencies) ? row.node.dependencies : [];
              const parentRow = row.parentId ? rowMap.get(row.parentId) : null;
              const siblingsAtLevel = parentRow ? parentRow.node.children ?? [] : nodes;
              const currentLevelIndex = siblingsAtLevel.findIndex((child: any) => child.id === row.node.id);
              const canLevelUp = Boolean(parentRow);
              const canLevelDown = currentLevelIndex > 0;
              const isEditingTitle = editingNodeId === row.node.id;
              const normalizedStatus = (row.node.status ?? "").toUpperCase();
              const isStatusPickerOpen = statusPickerId === row.node.id;
              const baseArrowStyle = (enabled: boolean): CSSProperties => ({
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "4px",
                padding: "0 0.35rem",
                background: enabled ? "transparent" : "rgba(0,0,0,0.04)",
                cursor: enabled ? "pointer" : "not-allowed",
                color: enabled ? "var(--text-muted, #5a5a5a)" : "rgba(0,0,0,0.35)",
                fontSize: "0.9rem",
                lineHeight: 1.2,
                transition: "background 0.2s ease"
              });

              return (
                <Fragment key={row.node.id}>
                  <tr className={`wbs-row ${isActive ? "is-active" : ""}`}>
                    <td>{displayId}</td>
                    <td>
                      <div
                        className="wbs-level-control"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem"
                        }}
                      >
                        <button
                          type="button"
                          className="level-arrow"
                          aria-label="Subir nível"
                          onClick={(event) => handleLevelAdjust(event, row.node.id, "up")}
                          disabled={!canLevelUp}
                          style={baseArrowStyle(canLevelUp)}
                        >
                          &lt;
                        </button>
                        <span className="wbs-level-value" style={{ fontWeight: 600 }}>
                          {visualLevel}
                        </span>
                        <button
                          type="button"
                          className="level-arrow"
                          aria-label="Descer nível"
                          onClick={(event) => handleLevelAdjust(event, row.node.id, "down")}
                          disabled={!canLevelDown}
                          style={baseArrowStyle(canLevelDown)}
                        >
                          &gt;
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className={`wbs-task-name ${visualLevel <= 1 ? "is-phase" : ""}`} style={{ paddingLeft: `${visualLevel * 18}px` }}>
                        {row.hasChildren ? (
                          <button
                            type="button"
                            className="wbs-toggle"
                            onClick={(event) => handleToggle(event, row.node.id, visualLevel)}
                            aria-label={isExpanded ? "Recolher subtarefas" : "Expandir subtarefas"}
                          >
                            {isExpanded ? "▾" : "▸"}
                          </button>
                        ) : (
                          <span className="wbs-toggle placeholder" />
                        )}
                        <span className={`wbs-node-icon ${row.hasChildren ? "is-folder" : "is-task"}`}>
                          {row.hasChildren ? <FolderIcon /> : <TaskIcon />}
                        </span>
                        <div
                          className="wbs-task-text"
                          onDoubleClick={(event) => handleBeginTitleEdit(event, row.node)}
                        >
                          {isEditingTitle ? (
                            <input
                              className="wbs-title-input"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onBlur={commitTitleEdit}
                              onKeyDown={handleTitleKeyDown}
                              onClick={(event) => event.stopPropagation()}
                              autoFocus
                              placeholder="Nome da tarefa"
                              style={{
                                width: "100%",
                                border: "1px solid rgba(99, 102, 241, 0.45)",
                                borderRadius: "6px",
                                padding: "0.2rem 0.4rem",
                                fontSize: "0.95rem",
                                background: "#fff"
                              }}
                            />
                          ) : (
                            <>
                              <strong>{row.node.title ?? "Tarefa sem nome"}</strong>
                              {row.node.description && <small>{row.node.description}</small>}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ position: "relative", display: "inline-flex" }}>
                        <button
                          type="button"
                          className={`wbs-status wbs-status--${status.tone}`}
                          onClick={(event) => handleStatusToggle(event, row.node.id)}
                        >
                          {status.label}
                        </button>
                        {isStatusPickerOpen && (
                          <div className="wbs-status-picker" style={statusPopoverStyle}>
                            {editableStatusValues.map((value) => {
                              const option = statusDictionary[value] ?? {
                                label: value,
                                tone: "neutral" as StatusTone
                              };
                              const isActiveOption = normalizedStatus === value;
                              return (
                                <button
                                  type="button"
                                  key={value}
                                  onClick={(event) => handleStatusChange(event, row.node.id, value)}
                                  style={{
                                    border: "none",
                                    background: isActiveOption ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                    padding: 0,
                                    textAlign: "left",
                                    cursor: "pointer"
                                  }}
                                >
                                  <span className={`wbs-status wbs-status--${option.tone}`}>{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="wbs-chip">{formatDuration(row.node.startDate, row.node.endDate)}</span>
                    </td>
                    <td>
                      <span className="wbs-date-chip" title={row.node.startDate ?? "Sem data definida"}>
                        <CalendarIcon />
                        {formatDate(row.node.startDate)}
                      </span>
                    </td>
                    <td>
                      <span className="wbs-date-chip" title={row.node.endDate ?? "Sem data definida"}>
                        <CalendarIcon />
                        {formatDate(row.node.endDate)}
                      </span>
                    </td>
                    <td>
                      {ownerName ? (
                        <div className="wbs-owner">
                          <span className="wbs-owner__avatar">{initials}</span>
                          <div>
                            <strong>{ownerName}</strong>
                            {ownerEmail && <small>{ownerEmail}</small>}
                          </div>
                        </div>
                      ) : (
                        <span className="muted">Sem responsável</span>
                      )}
                    </td>
                    <td>
                      <div className="wbs-progress">
                        <div className="wbs-progress__track">
                          <span className="wbs-progress__bar" style={{ width: `${progress}%` }} />
                        </div>
                        <strong>{progress}%</strong>
                      </div>
                    </td>
                    <td>
                      {dependencyBadges.length ? (
                        <div className="wbs-dependencies">
                          {dependencyBadges.map((dependencyId: string) => {
                            const dependencyRow = rowMap.get(dependencyId);
                            if (!dependencyRow) {
                              return (
                                <span key={`${row.node.id}-${dependencyId}`} className="wbs-chip muted">
                                  —
                                </span>
                              );
                            }
                            return (
                              <button
                                key={`${row.node.id}-${dependencyId}`}
                                type="button"
                                className="wbs-chip is-link"
                                title={`Depende de ${dependencyRow.node.title}`}
                                onClick={(event) => handleDependencyClick(event, dependencyId)}
                              >
                                {dependencyRow.node.wbsCode ?? dependencyRow.displayId}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="muted">Sem dependências</span>
                      )}
                    </td>
                    <td className="wbs-details-cell">
                      <button
                        type="button"
                        className={`wbs-details-button ${isActive ? "is-active" : ""}`}
                        onClick={(event) => handleDetailsButton(event, row.node.id)}
                      >
                        <DetailsIcon />
                        Ver detalhes
                      </button>
                    </td>
                    <td>
                      <div className="wbs-actions">
                        <button
                          type="button"
                          className="wbs-actions__trigger"
                          onClick={(event) => handleMenuToggle(event, row.node.id)}
                          aria-label="Opções da tarefa"
                        >
                          <MoreIcon />
                        </button>
                        {openMenuId === row.node.id && (
                          <div className="wbs-actions__menu">
                            {[
                              "Editar tarefa",
                              "Mover nível",
                              "Adicionar subtarefa",
                              "Duplicar",
                              "Excluir"
                            ].map((label) => (
                              <button type="button" key={label} onClick={(event) => handleMenuAction(event, label, row.node)}>
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isActive && selectedNode && (
                    <tr className="wbs-detail-row">
                      <td colSpan={11}>
                        <div className="wbs-detail-card">
                          <header className="wbs-detail-card__header">
                            <div>
                              <span className="wbs-level-tag">{selectedNode.wbsCode ?? selectedRow?.displayId}</span>
                              <h4>{selectedNode.title}</h4>
                              <span className={`wbs-status wbs-status--${selectedStatus.tone}`}>{selectedStatus.label}</span>
                            </div>
                            <button type="button" className="ghost-button" onClick={handleCloseDetails}>
                              Fechar
                            </button>
                          </header>
                          <p className="wbs-detail-card__description">
                            {selectedNode.description ?? "Nenhuma descrição registrada para esta tarefa."}
                          </p>
                          <div className="wbs-detail-card__grid">
                            <div>
                              <span className="subtext">Início</span>
                              <strong>{formatDate(selectedNode.startDate)}</strong>
                            </div>
                            <div>
                              <span className="subtext">Término</span>
                              <strong>{formatDate(selectedNode.endDate)}</strong>
                            </div>
                            <div>
                              <span className="subtext">Duração</span>
                              <strong>{formatDuration(selectedNode.startDate, selectedNode.endDate)}</strong>
                            </div>
                            <div>
                              <span className="subtext">Progresso</span>
                              <strong>{selectedProgress}%</strong>
                            </div>
                            <div>
                              <span className="subtext">Horas registradas</span>
                              <strong>{selectedNode.actualHours ?? 0}h</strong>
                            </div>
                            <div>
                              <span className="subtext">Documentos</span>
                              <strong>{selectedNode.documents ?? 0}</strong>
                            </div>
                          </div>
                          <div className="wbs-detail-card__responsible">
                            <h5>Responsável</h5>
                            {selectedNode.owner ? (
                              <div className="wbs-owner">
                                <span className="wbs-owner__avatar">
                                  {selectedNode.owner.name
                                    ?.split(" ")
                                    .map((part: string) => part[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                                <div>
                                  <strong>{selectedNode.owner.name}</strong>
                                  {selectedNode.owner.email && <small>{selectedNode.owner.email}</small>}
                                </div>
                              </div>
                            ) : (
                              <p className="muted">Defina um responsável para acompanhar esta atividade.</p>
                            )}
                          </div>
                          <div className="wbs-detail-card__checklist">
                            <h5>Checklist</h5>
                            {selectedChecklist.length ? (
                              <ul className="wbs-checklist">
                                {selectedChecklist.map((item: any) => (
                                  <li key={item.id ?? item.title}>
                                    <input type="checkbox" checked={Boolean(item.done)} readOnly />
                                    <span>{item.title}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="muted">Nenhum item de checklist cadastrado.</p>
                            )}
                          </div>
                          <div className="wbs-detail-card__documents">
                            <h5>Documentos</h5>
                            <p className="muted">
                              {selectedNode.documents
                                ? `${selectedNode.documents} arquivos vinculados a esta entrega.`
                                : "Sem anexos até o momento."}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const GanttTimeline = ({ tasks, milestones }: { tasks: any[]; milestones: any[] }) => {
  if (!tasks.length) return <p className="muted">Nenhuma tarefa com datas definidas.</p>;

  const allDates = [
    ...tasks.flatMap((task) => [task.startDate, task.endDate]),
    ...milestones.map((milestone) => milestone.dueDate)
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string));

  if (!allDates.length) {
    return <p className="muted">Defina datas para visualizar o cronograma.</p>;
  }

  const minDate = allDates.reduce((acc, date) => (acc.getTime() > date.getTime() ? date : acc), allDates[0]);
  const maxDate = allDates.reduce((acc, date) => (acc.getTime() < date.getTime() ? date : acc), allDates[0]);
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const offsetPercent = (value?: string | null) => {
    if (!value) return 0;
    const diff = new Date(value).getTime() - minDate.getTime();
    return Math.max(0, (diff / (1000 * 60 * 60 * 24)) / totalDays) * 100;
  };

  const widthPercent = (start?: string | null, end?: string | null) => {
    if (!start || !end) return 5;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(5, (diff / (1000 * 60 * 60 * 24)) / totalDays * 100);
  };

  return (
    <div className="gantt">
      {tasks.map((task) => (
        <div key={task.id} className="gantt-row">
          <div className="gantt-row__label">
            <strong>{task.title}</strong>
            <span>{task.status}</span>
          </div>
          <div className="gantt-row__bar">
            <span
              style={{
                left: `${offsetPercent(task.startDate)}%`,
                width: `${widthPercent(task.startDate, task.endDate)}%`
              }}
            />
          </div>
        </div>
      ))}
      <div className="gantt-milestones">
        <strong>Marcos:</strong>{" "}
        {milestones.length
          ? milestones.map((milestone) => `${milestone.name} (${formatDate(milestone.dueDate)})`).join(", ")
          : "Nenhum marco"}
      </div>
    </div>
  );
};

type ProjectDetailsTabsProps = {
  projectMeta: PortfolioProject | null;
  projectLoading?: boolean;
  onEditProject?: () => void;
  onAddTask?: () => void;
  summary: any;
  summaryError: string | null;
  filters: { rangeDays: number };
  onRangeChange: (range: number) => void;
  myTasks: any[];
  members: any[];
  membersError: string | null;
  attachments: any[];
  attachmentsError: string | null;
  attachmentsLoading: boolean;
  reportMetrics: any | null;
  reportMetricsError: string | null;
  reportMetricsLoading: boolean;
  boardColumns: any[];
  boardError: string | null;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onReloadBoard?: () => Promise<void>;
  onDragTask: (result: DropResult) => void;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
  newTaskStartDate: string;
  onTaskStartDateChange: (value: string) => void;
  newTaskEndDate: string;
  onTaskEndDateChange: (value: string) => void;
  newTaskAssignee: string;
  onTaskAssigneeChange: (value: string) => void;
  newTaskEstimateHours: string;
  onTaskEstimateHoursChange: (value: string) => void;
  wbsNodes: any[];
  wbsError: string | null;
  onMoveNode: (nodeId: string, parentId: string | null, position: number) => void;
  onUpdateNode: (nodeId: string, changes: { title?: string; status?: string }) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  comments: any[];
  commentsError: string | null;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  commentBody: string;
  onCommentBodyChange: (value: string) => void;
  timeEntryDate: string;
  timeEntryHours: string;
  timeEntryDescription: string;
  timeEntryError: string | null;
  onTimeEntryDateChange: (value: string) => void;
  onTimeEntryHoursChange: (value: string) => void;
  onTimeEntryDescriptionChange: (value: string) => void;
  onLogTime: (event: FormEvent<HTMLFormElement>) => void;
  ganttTasks: any[];
  ganttMilestones: any[];
  ganttError: string | null;
};

const ProjectDetailsTabs = ({
  projectMeta,
  projectLoading,
  onEditProject,
  onAddTask,
  summary,
  summaryError,
  filters,
  onRangeChange,
  myTasks,
  members,
  membersError,
  attachments,
  attachmentsError,
  attachmentsLoading,
  reportMetrics,
  reportMetricsError,
  reportMetricsLoading,
  boardColumns,
  boardError,
  onCreateTask,
  onReloadBoard,
  onDragTask,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange,
  newTaskStartDate,
  onTaskStartDateChange,
  newTaskEndDate,
  onTaskEndDateChange,
  newTaskAssignee,
  onTaskAssigneeChange,
  newTaskEstimateHours,
  onTaskEstimateHoursChange,
  wbsNodes,
  wbsError,
  onMoveNode,
  onUpdateNode,
  selectedNodeId,
  onSelectNode,
  comments,
  commentsError,
  onSubmitComment,
  commentBody,
  onCommentBodyChange,
  timeEntryDate,
  timeEntryHours,
  timeEntryDescription,
  timeEntryError,
  onTimeEntryDateChange,
  onTimeEntryHoursChange,
  onTimeEntryDescriptionChange,
  onLogTime,
  ganttTasks,
  ganttMilestones,
  ganttError
}: ProjectDetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Visão geral" },
    { id: "edt", label: "EDT" },
    { id: "board", label: "Board" },
    { id: "gantt", label: "Cronograma" },
    { id: "calendar", label: "Calendário" },
    { id: "docs", label: "Documentos" },
    { id: "activity", label: "Atividade" }
  ];

  const progressPercent = summary?.totals?.total
    ? Math.round((summary.totals.done / summary.totals.total) * 100)
    : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeValue = (progressPercent / 100) * circumference;

  const calendarEvents = useMemo(() => {
    const milestoneEvents = (ganttMilestones ?? [])
      .filter((milestone) => milestone?.dueDate)
      .map((milestone) => ({
        id: milestone.id ?? milestone.name,
        title: milestone.name ?? "Marco",
        date: milestone.dueDate,
        type: "Marco"
      }));

    const taskEvents = (ganttTasks ?? [])
      .filter((task) => task.startDate || task.endDate)
      .slice(0, 6)
      .map((task) => ({
        id: task.id,
        title: task.title,
        date: task.startDate ?? task.endDate,
        type: task.status ?? "Tarefa"
      }));

    return [...milestoneEvents, ...taskEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [ganttMilestones, ganttTasks]);

  const activityItems = useMemo(
    () =>
      (comments ?? []).map((comment) => ({
        id: comment.id,
        author: comment.author?.name ?? comment.authorName ?? "Colaborador",
        role: comment.author?.role ?? comment.authorRole ?? "Equipe",
        body: comment.body,
        createdAt: comment.createdAt ?? new Date().toISOString()
      })),
    [comments]
  );

  const formatShortDate = (value?: string | null) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short"
      });
    } catch {
      return "—";
    }
  };

  const formatFileSize = (value?: number | null) => {
    if (!value) return "—";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStatusBadge = (status?: string | null) => {
    if (!status) return <span className="pill pill-neutral">Sem status</span>;
    const normalized = status.toUpperCase();
    const toneMap: Record<string, string> = {
      DONE: "pill-success",
      COMPLETED: "pill-success",
      IN_PROGRESS: "pill-warning",
      PLANNED: "pill-neutral",
      AT_RISK: "pill-danger",
      BLOCKED: "pill-danger"
    };
    const labelMap: Record<string, string> = {
      DONE: "Concluído",
      COMPLETED: "Concluído",
      IN_PROGRESS: "Em andamento",
      PLANNED: "Planejado",
      AT_RISK: "Em risco",
      BLOCKED: "Bloqueado"
    };
    return <span className={`pill ${toneMap[normalized] ?? "pill-neutral"}`}>{labelMap[normalized] ?? status}</span>;
  };

  if (!projectMeta) {
    return (
      <section className="project-details">
        <article className="card">
          <h2>{projectLoading ? "Carregando dados do projeto..." : "Selecione um projeto"}</h2>
          <p className="muted">
            {projectLoading ? "Buscando cards do portfólio para montar o cabeçalho." : "Escolha um projeto no topo para ver os detalhes completos."}
          </p>
        </article>
      </section>
    );
  }

  const overviewHeader = (
    <>
      <div className="project-details__header">
        <div>
          <p className="eyebrow">Detalhes do projeto</p>
          <h2>{projectMeta.projectName}</h2>
          <p className="subtext">
            Código {projectMeta.code ?? "—"} · Cliente {projectMeta.clientName ?? "Não informado"}
          </p>
          <div className="project-header__meta">
            {renderStatusBadge(projectMeta.status)}
            <span>Responsável: {projectMeta.responsibleName ?? "—"}</span>
            <span>
              Período: {formatShortDate(projectMeta.startDate)} — {formatShortDate(projectMeta.endDate)}
            </span>
          </div>
        </div>
        <div className="project-header__actions">
          <button type="button" className="secondary-button" onClick={onEditProject} disabled={!onEditProject}>
            Editar projeto
          </button>
          <button type="button" className="ghost-button" onClick={onAddTask}>
            Adicionar tarefa
          </button>
          <button type="button" className="ghost-button">
            Compartilhar
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );

  const overviewContent = (
    <div className="tab-panel">
      <div className="status-grid">
        <article className="card status-card">
          <h3>Progresso geral</h3>
          <div className="progress-ring">
            <svg width="140" height="140">
              <circle cx="70" cy="70" r="54" strokeWidth="12" className="progress-ring__bg" />
              <circle
                cx="70"
                cy="70"
                r="54"
                strokeWidth="12"
                className="progress-ring__value"
                strokeDasharray={`${strokeValue} ${circumference}`}
              />
            </svg>
            <div className="progress-ring__label">
              <strong>{progressPercent}%</strong>
              <span>Concluído</span>
            </div>
          </div>
          <ul className="progress-legend">
            <li>
              <span className="dot dot-done" />
              {summary?.totals?.done ?? 0} concluídas
            </li>
            <li>
              <span className="dot dot-inprogress" />
              {summary?.totals?.inProgress ?? 0} em andamento
            </li>
            <li>
              <span className="dot dot-backlog" />
              {summary?.totals?.backlog ?? 0} backlog
            </li>
          </ul>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Burn-down / Horas</h3>
              <p className="subtext">Visão dos últimos {filters.rangeDays} dias</p>
            </div>
            <label className="inline-select">
              Intervalo
              <select value={filters.rangeDays} onChange={(event) => onRangeChange(Number(event.target.value))}>
                <option value={7}>7</option>
                <option value={14}>14</option>
                <option value={30}>30</option>
              </select>
            </label>
          </div>
          {summaryError && <p className="error-text">{summaryError}</p>}
          {summary ? (
            <div className="chart-grid">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={summary.burnDown}>
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="done" stroke="#22c55e" />
                  <Line type="monotone" dataKey="remaining" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={summary.timeEntries}>
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#5b3fff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Selecione um projeto para ver o resumo.</p>
          )}
        </article>
      </div>

      {summary && (
        <div className="summary-stats">
          <div>
            <span>Total</span>
            <strong>{summary.totals.total}</strong>
          </div>
          <div>
            <span>Concluídas</span>
            <strong>{summary.totals.done}</strong>
          </div>
          <div>
            <span>Em andamento</span>
            <strong>{summary.totals.inProgress}</strong>
          </div>
          <div>
            <span>Backlog</span>
            <strong>{summary.totals.backlog}</strong>
          </div>
          <div>
            <span>Bloqueadas</span>
            <strong>{summary.totals.blocked}</strong>
          </div>
          <div>
            <span>Atrasadas</span>
            <strong>{summary.overdueTasks}</strong>
          </div>
        </div>
      )}

      <div className="overview-grid">
        <article className="card">
          <div className="card-header">
            <h3>Marcos</h3>
          </div>
          {ganttMilestones?.length ? (
            <ul className="milestone-list">
              {ganttMilestones.slice(0, 4).map((milestone) => (
                <li key={milestone.id}>
                  <div>
                    <strong>{milestone.name}</strong>
                    <span>{formatShortDate(milestone.dueDate)}</span>
                  </div>
                  <span className="pill pill-neutral">{milestone.status ?? "Previsto"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhum marco cadastrado.</p>
          )}
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Riscos e impedimentos</h3>
          </div>
          <p className="highlight-number">{projectMeta.risksOpen ?? 0}</p>
          <p className="subtext">Riscos abertos</p>
          <p className="muted">Acompanhe o plano de mitigação e distribua responsáveis para cada item crítico.</p>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Horas registradas</h3>
          </div>
          <p className="highlight-number">
            {Number(projectMeta.hoursTracked ?? summary?.hoursTracked ?? 0).toFixed(1)}h
          </p>
          <p className="subtext">Somatório das últimas entregas</p>
        </article>
      </div>

      <div className="split-grid">
        <article className="card">
          <div className="card-header">
            <h3>Minhas tarefas</h3>
            <button type="button" className="ghost-button">
              Ver todas
            </button>
          </div>
          {myTasks.length ? (
            <ul className="task-list">
              {myTasks.map((task: any) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.column}</span>
                  </div>
                  <span className={`pill ${task.status.toLowerCase()}`}>{task.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhuma tarefa atribuída.</p>
          )}
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Equipe</h3>
          </div>
          {membersError && <p className="error-text">{membersError}</p>}
          {members.length ? (
            <ul className="team-list">
              {members.map((member: any) => (
                <li key={member.id}>
                  <div className="avatar">{member.name?.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </div>
                  <span>{member.capacityWeekly ?? 0}h</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhum membro vinculado.</p>
          )}
        </article>
      </div>
    </div>
  );

  const edtContent = (
    <div className="tab-panel">
      {wbsError && <p className="error-text">{wbsError}</p>}
      <WbsTreeView
        nodes={wbsNodes}
        onMove={onMoveNode}
        onUpdate={onUpdateNode}
        selectedNodeId={selectedNodeId}
        onSelect={onSelectNode}
      />
      <p className="muted">
        Selecione uma tarefa para visualizar detalhes, adicionar comentários, anexar arquivos ou registrar horas.
      </p>
    </div>
  );

  const boardContent = (
    <div className="tab-panel">
      {boardError && <p className="error-text">{boardError}</p>}
      <KanbanBoard
        columns={boardColumns}
        onDragEnd={onDragTask}
        onCreate={onCreateTask}
        newTaskTitle={newTaskTitle}
        onTaskTitleChange={onTaskTitleChange}
        newTaskColumn={newTaskColumn}
        onTaskColumnChange={onTaskColumnChange}
      />
    </div>
  );

  const ganttContent = (
    <div className="tab-panel">
      {ganttError && <p className="error-text">{ganttError}</p>}
      <GanttTimeline tasks={ganttTasks} milestones={ganttMilestones} />
    </div>
  );

  const calendarContent = (
    <div className="tab-panel">
      {calendarEvents.length ? (
        <ul className="calendar-list">
          {calendarEvents.map((event) => (
            <li key={event.id}>
              <div className="calendar-date">
                <span>{formatShortDate(event.date)}</span>
                <small>{event.type}</small>
              </div>
              <strong>{event.title}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nenhum evento agendado.</p>
      )}
    </div>
  );

  const docsContent = (
    <div className="tab-panel">
      {attachmentsError && <p className="error-text">{attachmentsError}</p>}
      {attachmentsLoading ? (
        <div className="docs-grid">
          {[0, 1, 2].map((index) => (
            <article key={index} className="doc-card skeleton-card">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            </article>
          ))}
        </div>
      ) : attachments.length ? (
        <div className="docs-grid">
          {attachments.map((doc) => (
            <article key={doc.id} className="doc-card">
              <div>
                <h4>{doc.fileName}</h4>
                <p className="subtext">{doc.category ?? "Documento"}</p>
              </div>
              <small>
                {doc.uploadedBy?.fullName ?? doc.uploadedBy?.email ?? "Equipe"} · {formatShortDate(doc.createdAt)}
              </small>
              <small>
                {formatFileSize(doc.fileSize)} · {doc.targetType === "WBS_NODE" ? "Vinculado à WBS" : "Projeto"}
              </small>
              <button
                type="button"
                className="ghost-button"
                onClick={() => window.alert("Integração de download em breve.")}
              >
                Baixar
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum documento enviado ainda.</p>
      )}
    </div>
  );

  const activityContent = (
    <div className="tab-panel activity-panel">
      <article className="card">
        <div className="card-header">
          <h3>Timeline de atividades</h3>
        </div>
        {commentsError && <p className="error-text">{commentsError}</p>}
        {activityItems.length ? (
          <ul className="activity-timeline">
            {activityItems.map((activity) => (
              <li key={activity.id}>
                <div className="activity-avatar">{activity.author?.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{activity.author}</strong>
                  <span>{activity.role}</span>
                  <p>{activity.body}</p>
                  <small>{formatShortDate(activity.createdAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nenhuma atividade registrada ainda.</p>
        )}
      </article>

      <div className="split-grid">
        <article className="card">
          <div className="card-header">
            <h3>Novo comentário</h3>
          </div>
          <form onSubmit={onSubmitComment} className="feedback-form">
            <p className="muted">Selecione um item na EDT para vincular o comentário.</p>
            <textarea
              placeholder="Anote atualizações ou decisões..."
              value={commentBody}
              onChange={(event) => onCommentBodyChange(event.target.value)}
            />
            <button type="submit" className="primary-button" disabled={!selectedNodeId || !commentBody.trim()}>
              Registrar comentário
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Registro rápido de horas</h3>
          </div>
          <form onSubmit={onLogTime} className="time-form">
            <p className="muted">Selecione uma tarefa na EDT antes de registrar.</p>
            <label>
              Data
              <input type="date" value={timeEntryDate} onChange={(event) => onTimeEntryDateChange(event.target.value)} />
            </label>
            <label>
              Horas
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={timeEntryHours}
                onChange={(event) => onTimeEntryHoursChange(event.target.value)}
              />
            </label>
            <label>
              Descrição
              <textarea value={timeEntryDescription} onChange={(event) => onTimeEntryDescriptionChange(event.target.value)} />
            </label>
            {timeEntryError && (
              <p className="error-text" role="status">
                {timeEntryError}
              </p>
            )}
            <button type="submit" className="primary-button" disabled={!selectedNodeId}>
              Registrar horas
            </button>
          </form>
        </article>
      </div>
    </div>
  );

  const tabContentMap: Record<string, JSX.Element> = {
    overview: overviewContent,
    edt: edtContent,
    board: boardContent,
    gantt: ganttContent,
    calendar: calendarContent,
    docs: docsContent,
    activity: activityContent
  };

  return (
    <section className="project-details">
      {overviewHeader}
      {tabContentMap[activeTab]}
    </section>
  );
};

const TeamPanel = ({
  members,
  membersError,
  projectName
}: {
  members: any[];
  membersError: string | null;
  projectName: string | null;
}) => {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const enrichedMembers = useMemo(() => {
    return members.map((member) => {
      const allocation = Math.min(100, Math.round(((member.capacityWeekly ?? 40) / 40) * 100));
      const status =
        allocation >= 90 ? "Alta carga" : allocation <= 40 ? "Disponível" : "Balanceado";
      const skills =
        Array.isArray((member as any).skills) && (member as any).skills.length
          ? (member as any).skills
          : [member.role, `Carga ${allocation}%`];
      return {
        ...member,
        allocation,
        status,
        skills,
        avatar: member.name?.slice(0, 2).toUpperCase() ?? "EQ",
        workload: allocation
      };
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    return enrichedMembers.filter((member) => {
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      const matchesSearch =
        !search ||
        member.name?.toLowerCase().includes(search.toLowerCase()) ||
        member.email?.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [enrichedMembers, roleFilter, statusFilter, search]);

  const roleOptions = useMemo(
    () => Array.from(new Set(members.map((member) => member.role))).filter(Boolean),
    [members]
  );

  if (!members.length && !membersError) {
    return null;
  }

  return (
    <section className="team-section">
      <div className="team-section__header">
        <div>
          <p className="eyebrow">Equipe</p>
          <h2>Visão da equipe do projeto</h2>
          <p className="subtext">
            Filtre por papel, status ou busque pessoas para abrir o painel detalhado.
          </p>
        </div>
        <div className="team-summary">
          <strong>{members.length}</strong>
          <span>Colaboradores no projeto {projectName ?? "atual"}</span>
        </div>
      </div>

      <div className="team-filters">
        <label>
          Papel
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Todos</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos</option>
            <option value="Disponível">Disponível</option>
            <option value="Alocado">Alocado</option>
            <option value="Em férias / folga">Em férias / folga</option>
          </select>
        </label>
        <label className="search-field">
          Busca
          <input
            type="search"
            placeholder="Nome ou e-mail..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {membersError && <p className="error-text">{membersError}</p>}

      {filteredMembers.length ? (
        <div className="team-grid">
          {filteredMembers.map((member) => (
            <article
              key={member.id}
              className="team-card"
              onClick={() => setSelectedMember(member)}
            >
              <div className="team-card__header">
                <div className="avatar">{member.avatar}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
                <span className="pill pill-neutral">{member.status}</span>
              </div>
              <div className="team-card__body">
                <p>{member.email}</p>
                <div className="progress-bar team-card__allocation">
                  <span style={{ width: `${member.allocation}%` }} />
                </div>
                <small>Alocação: {member.allocation}%</small>
                <div className="team-card__skills">
                  {member.skills.map((skill: string) => (
                    <span key={`${member.id}-${skill}`}>{skill}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="ghost-button">
                Ver detalhes
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Nenhum membro corresponde aos filtros selecionados.</p>
      )}

      {selectedMember && (
        <div className="team-drawer" onClick={() => setSelectedMember(null)}>
          <div className="team-drawer__content" onClick={(event) => event.stopPropagation()}>
            <header>
              <div className="avatar is-large">{selectedMember.avatar}</div>
              <div>
                <h3>{selectedMember.name}</h3>
                <p>{selectedMember.email}</p>
                <span className="pill pill-neutral">{selectedMember.status}</span>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedMember(null)}>
                Fechar
              </button>
            </header>
            <div className="team-drawer__details">
              <div>
                <strong>Papel</strong>
                <p>{selectedMember.role}</p>
              </div>
              <div>
                <strong>Capacidade semanal</strong>
                <p>{selectedMember.capacityWeekly ?? 0}h</p>
              </div>
              <div>
                <strong>Alocação</strong>
                <p>{selectedMember.allocation}%</p>
              </div>
            </div>
            <div>
              <strong>Skills</strong>
              <div className="team-card__skills">
                {selectedMember.skills.map((skill: string) => (
                  <span key={`${selectedMember.id}-${skill}`}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const ReportsPanel = ({
  metrics,
  metricsError,
  metricsLoading
}: {
  metrics: any | null;
  metricsError: string | null;
  metricsLoading: boolean;
}) => {
  const [activeTab, setActiveTab] = useState("status");

  const statusData = useMemo<{ status: string; value: number }[]>(() => {
    if (!metrics?.byStatus) return [];
    return Object.entries(metrics.byStatus).map(([status, value]) => ({
      status,
      value: Number(value)
    }));
  }, [metrics]);

  const riskData = metrics?.riskSummary ?? { open: 0, closed: 0 };
  const hoursByProject =
    ((metrics?.hoursByProject as { projectId: string; projectName: string; hours: number }[] | undefined) ?? []).slice(
      0,
      5
    );
  const progressSeries =
    (metrics?.progressSeries as { date: string; progress: number }[] | undefined) ?? [];

  if (!metrics && !metricsError && !metricsLoading) return null;

  return (
    <section className="reports-section">
      <header className="reports-header">
        <div>
          <p className="eyebrow">Relatórios</p>
          <h2>Visão analítica</h2>
          <p className="subtext">Escolha o foco para comparar resultados do portfólio.</p>
        </div>
        <div className="reports-tabs">
          {[
            { id: "status", label: "Status" },
            { id: "risks", label: "Riscos" },
            { id: "hours", label: "Horas" },
            { id: "progress", label: "Progresso" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {metricsError && <p className="error-text">{metricsError}</p>}

      {metricsLoading ? (
        <p className="muted">Carregando relatórios...</p>
      ) : (
        <div className="reports-grid">
          {activeTab === "status" && (
            <article className="reports-card">
              <h3>Status dos projetos</h3>
              <ul className="reports-list">
                {statusData.map((item) => (
                  <li key={item.status}>
                    <span>{item.status}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {activeTab === "risks" && (
            <article className="reports-card">
              <h3>Riscos</h3>
              <div className="reports-risk">
                <div>
                  <span>Abertos</span>
                  <strong>{riskData.open}</strong>
                </div>
                <div>
                  <span>Fechados</span>
                  <strong>{riskData.closed}</strong>
                </div>
              </div>
            </article>
          )}

          {activeTab === "hours" && (
            <article className="reports-card">
              <h3>Horas por projeto</h3>
              <ul className="reports-list">
                {hoursByProject.map((project: any) => (
                  <li key={project.projectId}>
                    <span>{project.projectName}</span>
                    <strong>{project.hours?.toFixed ? project.hours.toFixed(1) : project.hours}h</strong>
                  </li>
                ))}
              </ul>
            </article>
          )}

          {activeTab === "progress" && (
            <article className="reports-card">
              <h3>Progresso médio</h3>
              <div className="reports-sparkline">
                {progressSeries.map((point: any) => (
                  <span
                    key={point.date}
                    style={{ height: `${Math.max(5, point.progress)}%` }}
                    title={`${point.date} - ${point.progress}%`}
                  />
                ))}
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
};

const SettingsPanel = () => {
  const [activeSection, setActiveSection] = useState("profile");

  const sections = [
    { id: "profile", label: "Perfil" },
    { id: "notifications", label: "Notificações" },
    { id: "organization", label: "Organização" },
    { id: "permissions", label: "Permissões" },
    { id: "integrations", label: "Integrações" },
    { id: "billing", label: "Faturamento" }
  ];

  return (
    <section className="settings-section">
      <header>
        <div>
          <p className="eyebrow">Configurações</p>
          <h2>Central de ajustes</h2>
          <p className="subtext">Gerencie perfil, notificações, organização e integrações.</p>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-menu">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "is-active" : ""}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeSection === "profile" && (
            <form className="settings-form">
              <h3>Perfil</h3>
              <label>
                Nome completo
                <input type="text" placeholder="Seu nome" />
              </label>
              <label>
                E-mail
                <input type="email" placeholder="voce@empresa.com" />
              </label>
              <label>
                Idioma
                <select>
                  <option>Português (Brasil)</option>
                  <option>Inglês</option>
                </select>
              </label>
              <button type="button" className="primary-button">
                Atualizar perfil
              </button>
            </form>
          )}

          {activeSection === "notifications" && (
            <div className="settings-form">
              <h3>Notificações</h3>
              <label className="settings-toggle">
                <input type="checkbox" defaultChecked />
                <span>E-mails sobre tarefas atribuídas</span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" />
                <span>Mensagens em canais do Slack</span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" defaultChecked />
                <span>Alertas de riscos</span>
              </label>
            </div>
          )}

          {activeSection === "organization" && (
            <div className="settings-form">
              <h3>Organização</h3>
              <label>
                Nome da organização
                <input type="text" placeholder="Organização Demo" />
              </label>
              <label>
                Domínio
                <input type="text" placeholder="demo.local" />
              </label>
              <button type="button" className="secondary-button">
                Salvar
              </button>
            </div>
          )}

          {activeSection === "permissions" && (
            <div className="settings-form">
              <h3>Permissões e papéis</h3>
              <p className="muted">Gerencie quem pode criar projetos, alterar WBS e exportar dados.</p>
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Papel</th>
                    <th>Criar projeto</th>
                    <th>Editar WBS</th>
                    <th>Ver relatórios</th>
                  </tr>
                </thead>
                <tbody>
                  {["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((role) => (
                    <tr key={role}>
                      <td>{role}</td>
                      <td>
                        <input type="checkbox" defaultChecked={role !== "VIEWER"} />
                      </td>
                      <td>
                        <input type="checkbox" defaultChecked={role === "OWNER" || role === "ADMIN"} />
                      </td>
                      <td>
                        <input type="checkbox" defaultChecked={role !== "VIEWER"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="settings-form">
              <h3>Integrações</h3>
              <div className="integrations-grid">
                {["GitHub", "Google Drive", "Slack", "Google Calendar"].map((integration) => (
                  <article key={integration}>
                    <strong>{integration}</strong>
                    <p className="muted">Sincronize dados e automatize o fluxo.</p>
                    <button type="button" className="secondary-button">
                      Conectar
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="settings-form">
              <h3>Faturamento / Plano</h3>
              <p className="muted">Plano atual: <strong>Pro – 20/50 projetos</strong></p>
              <button type="button" className="secondary-button">
                Gerenciar plano
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};


export const DashboardLayout = ({
  userEmail,
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
  orgError,
  onSignOut,
  projects,
  selectedProjectId,
  onProjectChange,
  projectsError,
  filters,
  onRangeChange,
  summary,
  summaryError,
  members,
  membersError,
  attachments,
  attachmentsError,
  attachmentsLoading,
  reportMetrics,
  reportMetricsError,
  reportMetricsLoading,
  boardColumns,
  boardError,
  onCreateTask,
  onReloadBoard,
  onDragTask,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange,
  newTaskStartDate,
  onTaskStartDateChange,
  newTaskEndDate,
  onTaskEndDateChange,
  newTaskAssignee,
  onTaskAssigneeChange,
  newTaskEstimateHours,
  onTaskEstimateHoursChange,
  wbsNodes,
  wbsError,
  onMoveNode,
  onUpdateWbsNode,
  selectedNodeId,
  onSelectNode,
  comments,
  commentsError,
  onSubmitComment,
  commentBody,
  onCommentBodyChange,
  timeEntryDate,
  timeEntryHours,
  timeEntryDescription,
  timeEntryError,
  onTimeEntryDateChange,
  onTimeEntryHoursChange,
  onTimeEntryDescriptionChange,
  onLogTime,
  ganttTasks,
  ganttMilestones,
  ganttError,
  portfolio,
  portfolioError,
  portfolioLoading,
  onExportPortfolio,
  onCreateProject,
  onUpdateProject,
}: DashboardLayoutProps) => {
  const flattenedTasks = boardColumns.flatMap((column: any) =>
    column.tasks.map((task: any) => ({ ...task, column: column.label }))
  );
  const myTasks = flattenedTasks.slice(0, 6);
  const projectMeta = (portfolio as PortfolioProject[]).find((project) => project.projectId === selectedProjectId) ?? null;
  const [activeSidebarView, setActiveSidebarView] = useState("dashboard");
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState(createEmptyProjectForm());
  const [projectModalError, setProjectModalError] = useState<string | null>(null);
  const [projectModalLoading, setProjectModalLoading] = useState(false);
  const [projectToast, setProjectToast] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalLoading, setTaskModalLoading] = useState(false);
  useEffect(() => {
    if (selectedProjectId && !projectMeta && !portfolioLoading) {
      setShowNotFound(true);
    } else {
      setShowNotFound(false);
    }
  }, [selectedProjectId, projectMeta, portfolioLoading]);

  useEffect(() => {
    if (!newTaskColumn && boardColumns.length) {
      onTaskColumnChange(boardColumns[0].id);
    }
  }, [boardColumns, newTaskColumn, onTaskColumnChange]);

  useEffect(() => {
    if (!projectToast) return;
    const timeout = setTimeout(() => setProjectToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [projectToast]);

  const kpis = [
    {
      label: "Projetos ativos",
      value: projects.length,
      sub: `${organizations.length} organizações`
    },
    {
      label: "Tarefas em andamento",
      value: flattenedTasks.filter((task) => task.status === "IN_PROGRESS").length,
      sub: "Hoje"
    },
    {
      label: "Tarefas atrasadas",
      value: summary?.overdueTasks ?? 0,
      sub: "Priorizar"
    },
    {
      label: "Horas registradas (14d)",
      value: summary?.hoursTracked?.toFixed ? summary.hoursTracked.toFixed(1) : "0.0",
      sub: "Últimos 14 dias"
    }
  ];

  const handleProjectFieldChange = (field: keyof ReturnType<typeof createEmptyProjectForm>, value: string) =>
    setProjectForm((prev) => ({ ...prev, [field]: value }));

  const resetProjectForm = () => {
    setProjectForm(createEmptyProjectForm());
    setEditingProjectId(null);
    setProjectModalMode("create");
  };

  const handleOpenProjectModal = () => {
    setProjectModalError(null);
    resetProjectForm();
    setProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = () => {
    if (!projectMeta) return;
    setProjectModalError(null);
    setProjectModalMode("edit");
    setEditingProjectId(projectMeta.projectId);
    setProjectForm({
      name: projectMeta.projectName ?? "",
      clientName: projectMeta.clientName ?? "",
      budget: "",
      repositoryUrl: "",
      startDate: projectMeta.startDate ? projectMeta.startDate.slice(0, 10) : "",
      endDate: projectMeta.endDate ? projectMeta.endDate.slice(0, 10) : "",
      description: "",
      teamMembers: ""
    });
    setProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setProjectModalOpen(false);
    setProjectModalMode("create");
    setEditingProjectId(null);
  };

  const handleOpenTaskModal = async () => {
    if (!boardColumns.length && onReloadBoard) {
      await onReloadBoard();
    }
    if (!newTaskColumn && boardColumns.length) {
      onTaskColumnChange(boardColumns[0].id);
    }
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setTaskModalLoading(false);
  };

  const handleProjectModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProjectModalError(null);
    if (!projectForm.name.trim()) {
      setProjectModalError("O nome do projeto é obrigatório.");
      return;
    }
    if (!projectForm.clientName.trim()) {
      setProjectModalError("Informe o cliente responsável.");
      return;
    }

    const payload = {
      name: projectForm.name.trim(),
      clientName: projectForm.clientName.trim(),
      budget: Number(projectForm.budget) || 0,
      repositoryUrl: projectForm.repositoryUrl.trim() || undefined,
      startDate: projectForm.startDate || undefined,
      endDate: projectForm.endDate || undefined,
      description: projectForm.description.trim() || undefined,
      teamMembers: projectForm.teamMembers
        .split(",")
        .map((member) => member.trim())
        .filter(Boolean)
    };

    setProjectModalLoading(true);
    try {
      if (projectModalMode === "edit" && editingProjectId) {
        await onUpdateProject(editingProjectId, payload);
        setProjectToast("Projeto atualizado com sucesso.");
      } else {
        await onCreateProject(payload);
        setProjectToast("Projeto criado com sucesso.");
      }
      resetProjectForm();
      setProjectModalOpen(false);
    } catch (error) {
      setProjectModalError(error instanceof Error ? error.message : "Erro ao salvar projeto");
    } finally {
      setProjectModalLoading(false);
    }
  };

  const handleTaskModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTaskModalLoading(true);
    const success = await onCreateTask(event);
    setTaskModalLoading(false);
    if (success) {
      setTaskModalOpen(false);
    }
  };

  const heroSection = (
    <section className="hero-card">
      <div>
        <p className="eyebrow">Bem-vindo(a)</p>
        <h1>Visão geral do trabalho</h1>
        <p className="subtext">Acompanhe o progresso dos projetos, tarefas e riscos em tempo real.</p>
      </div>
      <div className="hero-selectors">
        <label>
          Organização
          <select value={selectedOrganizationId} onChange={(event) => onOrganizationChange(event.target.value)}>
            {organizations.map((org: Organization) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.role})
              </option>
            ))}
          </select>
        </label>
        {projects.length > 0 && (
          <label>
            Projeto
            <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
              {projects.map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="hero-meta">
        <button type="button" className="secondary-button" onClick={handleOpenProjectModal}>
          Criar projeto
        </button>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </section>
  );

  const renderProjectDetails = () => (
    <ProjectDetailsTabs
      projectMeta={projectMeta}
      projectLoading={portfolioLoading}
      onEditProject={handleOpenEditProjectModal}
      onAddTask={handleOpenTaskModal}
      summary={summary}
      summaryError={summaryError}
      filters={filters}
      onRangeChange={onRangeChange}
      myTasks={myTasks}
      members={members}
      membersError={membersError}
      attachments={attachments}
      attachmentsError={attachmentsError}
      attachmentsLoading={attachmentsLoading}
      reportMetrics={reportMetrics}
      reportMetricsError={reportMetricsError}
      reportMetricsLoading={reportMetricsLoading}
      boardColumns={boardColumns}
      boardError={boardError}
      onCreateTask={onCreateTask}
      onReloadBoard={onReloadBoard}
      onDragTask={onDragTask}
      newTaskTitle={newTaskTitle}
      onTaskTitleChange={onTaskTitleChange}
      newTaskColumn={newTaskColumn}
      onTaskColumnChange={onTaskColumnChange}
      newTaskStartDate={newTaskStartDate}
      onTaskStartDateChange={onTaskStartDateChange}
      newTaskEndDate={newTaskEndDate}
      onTaskEndDateChange={onTaskEndDateChange}
      newTaskAssignee={newTaskAssignee}
      onTaskAssigneeChange={onTaskAssigneeChange}
      newTaskEstimateHours={newTaskEstimateHours}
      onTaskEstimateHoursChange={onTaskEstimateHoursChange}
      wbsNodes={wbsNodes}
      wbsError={wbsError}
      onMoveNode={onMoveNode}
      onUpdateNode={onUpdateWbsNode}
      selectedNodeId={selectedNodeId}
      onSelectNode={onSelectNode}
      comments={comments}
      commentsError={commentsError}
      onSubmitComment={onSubmitComment}
      commentBody={commentBody}
      onCommentBodyChange={onCommentBodyChange}
      timeEntryDate={timeEntryDate}
      timeEntryHours={timeEntryHours}
      timeEntryDescription={timeEntryDescription}
      timeEntryError={timeEntryError}
      onTimeEntryDateChange={onTimeEntryDateChange}
      onTimeEntryHoursChange={onTimeEntryHoursChange}
      onTimeEntryDescriptionChange={onTimeEntryDescriptionChange}
      onLogTime={onLogTime}
      ganttTasks={ganttTasks}
      ganttMilestones={ganttMilestones}
      ganttError={ganttError}
    />
  );

  const handleViewProjectDetails = useCallback(
    (projectId: string) => {
      if (projectId && projectId !== selectedProjectId) {
        onProjectChange(projectId);
      }
      setActiveSidebarView("projects");
      setShowNotFound(false);
    },
    [onProjectChange, selectedProjectId]
  );

  const renderProjectsList = () => (
    <ProjectPortfolio
      projects={portfolio}
      error={portfolioError}
      isLoading={portfolioLoading}
      onExport={onExportPortfolio}
      selectedProjectId={selectedProjectId}
      onSelectProject={onProjectChange}
      onCreateProject={handleOpenProjectModal}
      onViewProjectDetails={handleViewProjectDetails}
    />
  );

  const renderDashboardContent = () => (
    <>
      <section className="summary-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="summary-card">
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.sub}</small>
          </article>
        ))}
      </section>

      {renderProjectsList()}
    </>
  );

  const renderProjectsContent = () => (
    <>
      {renderProjectsList()}
      {renderProjectDetails()}
    </>
  );

  const renderTeamContent = () => (
    <TeamPanel members={members} membersError={membersError} projectName={projectMeta?.projectName ?? null} />
  );

  const renderReportsContent = () => (
    <ReportsPanel metrics={reportMetrics} metricsError={reportMetricsError} metricsLoading={reportMetricsLoading} />
  );

  const handleBackToDashboard = () => {
    setActiveSidebarView("dashboard");
    if (selectedProjectId) {
      onProjectChange("");
    }
    setShowNotFound(false);
  };

  const handleGoToProjects = () => {
    setActiveSidebarView("projects");
    setShowNotFound(false);
  };

  const getMainContent = () => {
    switch (activeSidebarView) {
      case "projects":
        return renderProjectsContent();
      case "team":
        return renderTeamContent();
      case "reports":
        return renderReportsContent();
      case "settings":
        return (
          <SettingsPanel />
        );
      case "dashboard":
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="app-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <span>G&P</span>
          <small>Gestão de Projetos</small>
        </div>
        <nav>
          {sidebarNavigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${activeSidebarView === item.id ? "is-active" : ""}`}
              onClick={() => setActiveSidebarView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-plan">
          <p>
            Plano Pro · <strong>20/50</strong> projetos
          </p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <input type="search" placeholder="Buscar projetos, tarefas, pessoas..." />
          <div className="topbar-actions">
            <button type="button">?</button>
            <button type="button">ðŸ””</button>
            <div className="avatar">{userEmail?.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <main>
          {heroSection}

          {projectToast && <p className="success-text">{projectToast}</p>}

          {orgError && <p className="error-text">{orgError}</p>}
          {projectsError && <p className="error-text">{projectsError}</p>}

          {showNotFound ? (
            <NotFoundPage onBackToDashboard={handleBackToDashboard} onViewProjects={handleGoToProjects} />
          ) : (
            getMainContent()
          )}
        </main>

        {isProjectModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
              <header className="modal-header">
                <div>
                  <p className="eyebrow">{projectModalMode === "edit" ? "Editar projeto" : "Novo projeto"}</p>
                  <h3>{projectModalMode === "edit" ? "Atualize as informações principais" : "Planeje um novo trabalho"}</h3>
                  <p className="subtext">
                    {projectModalMode === "edit"
                      ? "Ajuste cliente, datas ou links principais do projeto selecionado."
                      : "Informe dados básicos para criarmos o projeto no portfólio."}
                  </p>
                </div>
                <button type="button" className="ghost-button" onClick={handleCloseProjectModal}>
                  Fechar
                </button>
              </header>

              <form className="modal-form" onSubmit={handleProjectModalSubmit}>
                <label>
                  Nome do projeto
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(event) => handleProjectFieldChange("name", event.target.value)}
                    placeholder="Implementação ERP 2025"
                    required
                  />
                </label>
                <label>
                  Cliente / unidade
                  <input
                    type="text"
                    value={projectForm.clientName}
                    onChange={(event) => handleProjectFieldChange("clientName", event.target.value)}
                    placeholder="Corp Holding"
                    required
                  />
                </label>
                <label>
                  Orçamento aprovado (R$)
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={projectForm.budget}
                    onChange={(event) => handleProjectFieldChange("budget", event.target.value)}
                    placeholder="250000"
                  />
                </label>
                <label>
                  Repositório GitHub
                  <input
                    type="url"
                    value={projectForm.repositoryUrl}
                    onChange={(event) => handleProjectFieldChange("repositoryUrl", event.target.value)}
                    placeholder="https://github.com/org/projeto"
                  />
                </label>
                <div className="modal-grid">
                  <label>
                    Início planejado
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={(event) => handleProjectFieldChange("startDate", event.target.value)}
                    />
                  </label>
                  <label>
                    Conclusão prevista
                    <input
                      type="date"
                      value={projectForm.endDate}
                      onChange={(event) => handleProjectFieldChange("endDate", event.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Equipe (e-mails separados por vírgula)
                  <textarea
                    value={projectForm.teamMembers}
                    onChange={(event) => handleProjectFieldChange("teamMembers", event.target.value)}
                    placeholder="ana@empresa.com, joao@empresa.com"
                  />
                </label>
                <label>
                  Descrição
                  <textarea
                    value={projectForm.description}
                    onChange={(event) => handleProjectFieldChange("description", event.target.value)}
                    placeholder="Objetivos, entregas e premissas iniciais..."
                  />
                </label>

                {projectModalError && <p className="error-text">{projectModalError}</p>}

                <footer className="modal-actions">
                  <button type="button" className="ghost-button" onClick={handleCloseProjectModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="primary-button" disabled={projectModalLoading}>
                    {projectModalLoading
                      ? "Enviando..."
                      : projectModalMode === "edit"
                      ? "Salvar alterações"
                      : "Criar projeto"}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {isTaskModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
              <header className="modal-header">
                <div>
                  <p className="eyebrow">Nova tarefa</p>
                  <h3>Adicionar item ao quadro</h3>
                  <p className="subtext">Informe o título e escolha a coluna inicial.</p>
                </div>
                <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>
                  Fechar
                </button>
              </header>

              {boardColumns.length ? (
                <form className="modal-form" onSubmit={handleTaskModalSubmit}>
                  <label>
                    Título da tarefa
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(event) => onTaskTitleChange(event.target.value)}
                      placeholder="Configurar ambiente, revisar contrato..."
                      required
                    />
                  </label>

                  <label>
                    Coluna inicial
                    <select value={newTaskColumn} onChange={(event) => onTaskColumnChange(event.target.value)}>
                      {boardColumns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="modal-grid">
                    <label>
                      Início planejado
                      <input
                        type="date"
                        value={newTaskStartDate}
                        onChange={(event) => onTaskStartDateChange(event.target.value)}
                      />
                    </label>
                    <label>
                      Fim planejado
                      <input
                        type="date"
                        value={newTaskEndDate}
                        onChange={(event) => onTaskEndDateChange(event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    Responsável
                    <select value={newTaskAssignee} onChange={(event) => onTaskAssigneeChange(event.target.value)}>
                      <option value="">Selecione...</option>
                      {members.map((member: any) => (
                        <option key={member.id} value={member.userId ?? member.id}>
                          {member.name ?? member.fullName ?? member.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Horas estimadas
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTaskEstimateHours}
                      onChange={(event) => onTaskEstimateHoursChange(event.target.value)}
                      placeholder="Ex.: 4"
                    />
                  </label>

                  {boardError && (
                    <p className="error-text" role="status">
                      {boardError}
                    </p>
                  )}

                  <footer className="modal-actions">
                    <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary-button" disabled={taskModalLoading || !newTaskTitle.trim()}>
                      {taskModalLoading ? "Salvando..." : "Criar tarefa"}
                    </button>
                  </footer>
                </form>
              ) : (
                <div className="modal-form">
                  <p className="muted">
                    Este projeto ainda não possui colunas configuradas. Configure o quadro para criar tarefas.
                  </p>
                  <footer className="modal-actions">
                    <button type="button" className="ghost-button" onClick={handleCloseTaskModal}>
                      Fechar
                    </button>
                  </footer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export const TemplatesPanel = ({
  templates,
  isLoading,
  error,
  onSaveTemplate
}: {
  templates: TemplateSummary[];
  isLoading: boolean;
  error: string | null;
  onSaveTemplate: (templateId: string, payload: TemplateEditorPayload) => Promise<void>;
}) => {
  type TemplateCard = {
    id: string;
    name: string;
    type: string;
    clientName?: string;
    repositoryUrl?: string;
    defaultBudget?: number;
    phases: number;
    tasks: number;
    tags: string[];
    updatedAt: string;
    columns: string[];
    wbs: TemplateTreeNode[];
    customFields: TemplateCustomField[];
  };

  const defaultColumns = ["Backlog", "Planejamento", "Execucao", "Concluido"];

  const sampleTemplates: TemplateCard[] = [
    {
      id: "temp-pmo",
      name: "Projeto PMO",
      type: "PMO / Governanca",
      clientName: "Corp PMO",
      repositoryUrl: "https://github.com/gp/templates-pmo",
      defaultBudget: 250000,
      phases: 5,
      tasks: 42,
      tags: ["PMO", "Governanca", "Compliance"],
      updatedAt: "2025-02-10",
      columns: ["Backlog", "Planejamento", "Execucao", "Aprovacao", "Concluido"],
      wbs: [
        {
          id: "temp-pmo-1",
          title: "Iniciacao",
          children: [
            { id: "temp-pmo-1-1", title: "Business case" },
            { id: "temp-pmo-1-2", title: "Stakeholders" }
          ]
        },
        {
          id: "temp-pmo-2",
          title: "Planejamento",
          children: [
            { id: "temp-pmo-2-1", title: "Plano do projeto" },
            { id: "temp-pmo-2-2", title: "Estrategia de riscos" }
          ]
        }
      ],
      customFields: [
        { id: "field-owner", label: "Patrocinador", type: "text", required: true },
        { id: "field-budget", label: "Orcamento aprovado", type: "number" }
      ]
    },
    {
      id: "temp-ti",
      name: "Implantacao de TI",
      type: "Tecnologia",
      clientName: "Squad Infra",
      repositoryUrl: "https://github.com/gp/templates-ti",
      defaultBudget: 180000,
      phases: 4,
      tasks: 30,
      tags: ["Infra", "Seguranca", "Deploy"],
      updatedAt: "2025-02-08",
      columns: ["Backlog", "Planejamento", "Em andamento", "QA", "Done"],
      wbs: [
        {
          id: "temp-ti-1",
          title: "Discovery",
          children: [
            { id: "temp-ti-1-1", title: "Mapear sistemas" },
            { id: "temp-ti-1-2", title: "Inventario de acessos" }
          ]
        },
        {
          id: "temp-ti-2",
          title: "Deploy",
          children: [
            { id: "temp-ti-2-1", title: "Ambiente de staging" },
            { id: "temp-ti-2-2", title: "Go live" }
          ]
        }
      ],
      customFields: [
        { id: "field-env", label: "Ambiente alvo", type: "select" },
        { id: "field-risk", label: "Nivel de risco", type: "select" }
      ]
    },
    {
      id: "temp-mkt",
      name: "Campanha de Marketing",
      type: "Marketing",
      clientName: "Equipe Growth",
      repositoryUrl: "https://github.com/gp/templates-mkt",
      defaultBudget: 120000,
      phases: 3,
      tasks: 24,
      tags: ["Growth", "Social", "Paid Media"],
      updatedAt: "2025-02-05",
      columns: ["Ideias", "Criacao", "Producao", "Publicacao", "Mensuracao"],
      wbs: [
        {
          id: "temp-mkt-1",
          title: "Briefing",
          children: [
            { id: "temp-mkt-1-1", title: "Mapear publico" },
            { id: "temp-mkt-1-2", title: "Definir verba" }
          ]
        },
        {
          id: "temp-mkt-2",
          title: "Execucao",
          children: [
            { id: "temp-mkt-2-1", title: "Pecas criativas" },
            { id: "temp-mkt-2-2", title: "Veiculacao" }
          ]
        }
      ],
      customFields: [
        { id: "field-channel", label: "Canal principal", type: "text" },
        { id: "field-kpi", label: "KPI alvo", type: "text", required: true }
      ]
    }
  ];

  const countWbsNodes = (nodes: TemplateNodeInput[] = []): number =>
    nodes.reduce((acc, node) => acc + 1 + countWbsNodes(node.children ?? []), 0);

  const mapTemplateNodes = (nodes?: TemplateNodeInput[], parentPath = "tpl"): TemplateTreeNode[] =>
    (nodes ?? []).map((node, index) => {
      const path = `${parentPath}-${index}`;
      return {
        id: node.id ?? path,
        title: node.title ?? "Entrega",
        children: mapTemplateNodes(node.children, path)
      };
    });

  const normalizeFieldType = (value?: string): TemplateCustomField["type"] => {
    if (value === "number" || value === "select" || value === "date") {
      return value;
    }
    return "text";
  };

  const normalizeTemplate = (template: TemplateSummary): TemplateCard => ({
    id: template.id,
    name: template.name,
    type: template.type,
    clientName: template.clientName ?? undefined,
    repositoryUrl: template.repositoryUrl ?? undefined,
    defaultBudget: template.budget ?? undefined,
    phases: template.wbs?.length ?? 0,
    tasks: countWbsNodes(template.wbs ?? []),
    tags: (template.customFields ?? []).map((field) => field.label).filter(Boolean) as string[],
    updatedAt: template.updatedAt ?? new Date().toISOString(),
    columns: template.columns ?? defaultColumns,
    wbs: mapTemplateNodes(template.wbs),
    customFields: (template.customFields ?? []).map((field) => ({
      id: field.id ?? `field-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      label: field.label ?? "Campo",
      type: normalizeFieldType(field.type),
      required: Boolean(field.required)
    }))
  });

  const templatesToUse: TemplateCard[] = useMemo(() => {
    if (templates.length) {
      return templates.map(normalizeTemplate);
    }
    return sampleTemplates;
  }, [templates]);
  const initialTemplate = templatesToUse[0];

  useEffect(() => {
    if (!templates.length) return;
    setSelectedTemplateId((current) => {
      if (templates.some((template) => template.id === current)) {
        return current;
      }
      return templates[0].id;
    });
  }, [templates]);

  const cloneNodes = (nodes: TemplateTreeNode[]): TemplateTreeNode[] =>
    nodes.map((node) => ({
      ...node,
      children: node.children ? cloneNodes(node.children) : []
    }));

  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templatesToUse[0]?.id ?? "");
  const selectedTemplate = templatesToUse.find((template) => template.id === selectedTemplateId) ?? null;

  const [wbsDraft, setWbsDraft] = useState<TemplateTreeNode[]>(initialTemplate ? cloneNodes(initialTemplate.wbs) : []);
  const [boardColumnsDraft, setBoardColumnsDraft] = useState<string[]>(
    initialTemplate ? [...initialTemplate.columns] : defaultColumns
  );
  const [customFieldsDraft, setCustomFieldsDraft] = useState<TemplateCustomField[]>(
    initialTemplate ? initialTemplate.customFields.map((field) => ({ ...field })) : []
  );
  const [templateMeta, setTemplateMeta] = useState({
    name: initialTemplate?.name ?? "Novo template",
    type: initialTemplate?.type ?? "Custom",
    clientName: initialTemplate?.clientName ?? "",
    repositoryUrl: initialTemplate?.repositoryUrl ?? "",
    budget: initialTemplate?.defaultBudget?.toString() ?? ""
  });
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalError, setTemplateModalError] = useState<string | null>(null);
  const [templateModalLoading, setTemplateModalLoading] = useState(false);
  const [templateToast, setTemplateToast] = useState<string | null>(null);
  const [isDraftTemplate, setIsDraftTemplate] = useState(false);

  useEffect(() => {
    if (!selectedTemplate || isDraftTemplate) return;
    setWbsDraft(cloneNodes(selectedTemplate.wbs));
    setBoardColumnsDraft([...selectedTemplate.columns]);
    setCustomFieldsDraft(selectedTemplate.customFields.map((field) => ({ ...field })));
    setTemplateMeta({
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      clientName: selectedTemplate.clientName ?? "",
      repositoryUrl: selectedTemplate.repositoryUrl ?? "",
      budget: selectedTemplate.defaultBudget?.toString() ?? ""
    });
  }, [selectedTemplate, isDraftTemplate]);

  useEffect(() => {
    if (!templateToast) return;
    const timeout = setTimeout(() => setTemplateToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [templateToast]);

  const createTreeNode = (title = "Nova etapa"): TemplateTreeNode => ({
    id: `node-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    title,
    children: []
  });

  const updateNodeTitle = (nodes: TemplateTreeNode[], nodeId: string, value: string): TemplateTreeNode[] =>
    nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, title: value };
      }
      return {
        ...node,
        children: node.children ? updateNodeTitle(node.children, nodeId, value) : []
      };
    });

  const addChildToTree = (nodes: TemplateTreeNode[], nodeId: string, child: TemplateTreeNode): TemplateTreeNode[] =>
    nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, children: [...(node.children ?? []), child] };
      }
      return {
        ...node,
        children: node.children ? addChildToTree(node.children, nodeId, child) : []
      };
    });

  const removeNodeFromTree = (nodes: TemplateTreeNode[], nodeId: string): TemplateTreeNode[] =>
    nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => ({
        ...node,
        children: node.children ? removeNodeFromTree(node.children, nodeId) : []
      }));

  const handleNodeTitleChange = (nodeId: string, value: string) =>
    setWbsDraft((prev) => updateNodeTitle(prev, nodeId, value));

  const handleAddChild = (nodeId: string) =>
    setWbsDraft((prev) => addChildToTree(prev, nodeId, createTreeNode("Nova entrega")));

  const handleRemoveNode = (nodeId: string) => setWbsDraft((prev) => removeNodeFromTree(prev, nodeId));

  const handleAddStage = () => setWbsDraft((prev) => [...prev, createTreeNode()]);

  const handleColumnChange = (index: number, value: string) =>
    setBoardColumnsDraft((prev) => {
      const clone = [...prev];
      clone[index] = value;
      return clone;
    });

  const handleAddColumn = () => setBoardColumnsDraft((prev) => [...prev, `Etapa ${prev.length + 1}`]);

  const handleRemoveColumn = (index: number) =>
    setBoardColumnsDraft((prev) => prev.filter((_, columnIndex) => columnIndex !== index));

  const handleFieldChange = (fieldId: string, key: keyof TemplateCustomField, value: string | boolean) =>
    setCustomFieldsDraft((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              [key]:
                key === "type"
                  ? (value as TemplateCustomField["type"])
                  : key === "required"
                  ? Boolean(value)
                  : (value as string)
            }
          : field
      )
    );

  const handleAddField = () =>
    setCustomFieldsDraft((prev) => [
      ...prev,
      { id: `field-${Date.now()}`, label: "Novo campo", type: "text", required: false }
    ]);

  const handleRemoveField = (fieldId: string) =>
    setCustomFieldsDraft((prev) => prev.filter((field) => field.id !== fieldId));

  const handleTemplateMetaChange = (field: keyof typeof templateMeta, value: string) =>
    setTemplateMeta((prev) => ({ ...prev, [field]: value }));

  const handleStartTemplate = () => {
    setIsDraftTemplate(true);
    const draftId = `draft-${Date.now()}`;
    setSelectedTemplateId(draftId);
    setTemplateMeta({
      name: "Novo template",
      type: "Custom",
      clientName: "",
      repositoryUrl: "",
      budget: ""
    });
    setBoardColumnsDraft([...defaultColumns]);
    setWbsDraft([createTreeNode("Iniciação")]);
    setCustomFieldsDraft([]);
    setTemplateModalError(null);
    setTemplateModalOpen(true);
  };

  const openTemplateModal = (templateId: string) => {
    if (templateId !== selectedTemplateId) {
      setSelectedTemplateId(templateId);
    }
    setIsDraftTemplate(false);
    setTemplateModalError(null);
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => setTemplateModalOpen(false);

  const renderWbsNodes = (nodes: TemplateTreeNode[]) => (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="wbs-node">
            <input value={node.title} onChange={(event) => handleNodeTitleChange(node.id, event.target.value)} />
            <div className="wbs-node__actions">
              <button type="button" className="ghost-button" onClick={() => handleAddChild(node.id)}>
                + Subtarefa
              </button>
              <button type="button" className="ghost-button" onClick={() => handleRemoveNode(node.id)}>
                Remover
              </button>
            </div>
          </div>
          {node.children && node.children.length > 0 && renderWbsNodes(node.children)}
        </li>
      ))}
    </ul>
  );

  const mapNodesToPayload = (nodes: TemplateTreeNode[]): TemplateNodeInput[] =>
    nodes.map((node) => ({
      title: node.title.trim(),
      children: node.children && node.children.length ? mapNodesToPayload(node.children) : undefined
    }));

  const handleTemplateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateMeta.name.trim()) {
      setTemplateModalError("O nome do template é obrigatório.");
      return;
    }

    setTemplateModalLoading(true);
    try {
      const templateId = selectedTemplateId || `template-${Date.now()}`;
      await onSaveTemplate(templateId, {
        name: templateMeta.name.trim(),
        type: templateMeta.type.trim(),
        clientName: templateMeta.clientName.trim() || undefined,
        repositoryUrl: templateMeta.repositoryUrl.trim() || undefined,
        budget: templateMeta.budget ? Number(templateMeta.budget) : undefined,
        columns: boardColumnsDraft,
        wbs: mapNodesToPayload(wbsDraft),
        customFields: customFieldsDraft.map((field) => ({
          id: field.id,
          label: field.label.trim(),
          type: field.type,
          required: field.required
        }))
      });
      setTemplateToast("Template atualizado com sucesso.");
      setSelectedTemplateId(templateId);
      setIsDraftTemplate(false);
      setTemplateModalOpen(false);
    } catch (error) {
      setTemplateModalError(error instanceof Error ? error.message : "Erro ao salvar template");
    } finally {
      setTemplateModalLoading(false);
    }
  };

  return (
    <div className="templates-panel">
      <div className="templates-actions">
        <button type="button" className="primary-button" onClick={handleStartTemplate}>
          + Criar template
        </button>
        <button type="button" className="secondary-button">
          Importar modelo
        </button>
      </div>

      {templateToast && <p className="success-text">{templateToast}</p>}

      <div className="templates-layout">
        <div className="templates-grid">
          {isLoading && <p className="muted">Carregando templates...</p>}
          {!isLoading &&
            templatesToUse.map((template) => (
              <article
                key={template.id}
                className={`template-card ${selectedTemplateId === template.id ? "is-active" : ""}`}
                onClick={() => {
                  setIsDraftTemplate(false);
                  setSelectedTemplateId(template.id);
                }}
              role="button"
              tabIndex={0}
            >
              <header>
                <div>
                  <p className="eyebrow">{template.type}</p>
                  <h4>{template.name}</h4>
                </div>
                <span className="pill pill-neutral">{template.phases} fases</span>
              </header>
              <p className="muted">
                {template.tasks} tarefas - Atualizado em {new Date(template.updatedAt).toLocaleDateString("pt-BR")}
              </p>
              <div className="template-tags">
                {template.tags.map((tag) => (
                  <span key={`${template.id}-${tag}`}>{tag}</span>
                ))}
              </div>
              <div className="template-columns">
                {template.columns.map((column) => (
                  <small key={`${template.id}-${column}`}>{column}</small>
                ))}
              </div>
              <div className="template-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openTemplateModal(template.id);
                  }}
                >
                  Editar
                </button>
                <button type="button" className="ghost-button">
                  Duplicar
                </button>
                <button type="button" className="ghost-button">
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="templates-editor">
          <header>
            <p className="eyebrow">Editor do template</p>
            <h3>{templateMeta.name}</h3>
            <p className="subtext">
              Pre-visualize a EDT padrao, ajuste colunas do board e defina campos customizados para novos projetos.
            </p>
          </header>

          <article className="editor-card">
            <div className="editor-card__header">
              <h4>Previa da EDT</h4>
              <button type="button" className="ghost-button" onClick={handleAddStage}>
                + Adicionar etapa
              </button>
            </div>
            <div className="wbs-preview">{renderWbsNodes(wbsDraft)}</div>
          </article>

          <article className="editor-card">
            <div className="editor-card__header">
              <h4>Colunas do board</h4>
              <button type="button" className="ghost-button" onClick={handleAddColumn}>
                + Nova coluna
              </button>
            </div>
            <ul className="board-columns-editor">
              {boardColumnsDraft.map((column, index) => (
                <li key={`${selectedTemplateId}-column-${column}-${index}`}>
                  <input value={column} onChange={(event) => handleColumnChange(index, event.target.value)} />
                  <button type="button" className="ghost-button" onClick={() => handleRemoveColumn(index)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </article>

          <article className="editor-card">
            <div className="editor-card__header">
              <h4>Campos customizados</h4>
              <button type="button" className="ghost-button" onClick={handleAddField}>
                + Novo campo
              </button>
            </div>
            <div className="custom-fields-editor">
              {customFieldsDraft.map((field) => (
                <div key={field.id} className="custom-field-card">
                  <label>
                    Nome
                    <input value={field.label} onChange={(event) => handleFieldChange(field.id, "label", event.target.value)} />
                  </label>
                  <label>
                    Tipo
                    <select value={field.type} onChange={(event) => handleFieldChange(field.id, "type", event.target.value)}>
                      <option value="text">Texto</option>
                      <option value="number">Numero</option>
                      <option value="date">Data</option>
                      <option value="select">Lista</option>
                    </select>
                  </label>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      onChange={(event) => handleFieldChange(field.id, "required", event.target.checked)}
                    />
                    <span>Obrigatorio</span>
                  </label>
                  <button type="button" className="ghost-button" onClick={() => handleRemoveField(field.id)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>

      {templateModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <div>
                <p className="eyebrow">Editar template</p>
                <h3>{templateMeta.name}</h3>
                <p className="subtext">
                  Ajuste os metadados do template e sincronize com o backend para novos projetos.
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={closeTemplateModal}>
                Fechar
              </button>
            </header>

            <form className="modal-form" onSubmit={handleTemplateSubmit}>
              <label>
                Nome
                <input
                  type="text"
                  value={templateMeta.name}
                  onChange={(event) => handleTemplateMetaChange("name", event.target.value)}
                  required
                />
              </label>
              <label>
                Categoria
                <input
                  type="text"
                  value={templateMeta.type}
                  onChange={(event) => handleTemplateMetaChange("type", event.target.value)}
                  required
                />
              </label>
              <label>
                Cliente/área padrão
                <input
                  type="text"
                  value={templateMeta.clientName}
                  onChange={(event) => handleTemplateMetaChange("clientName", event.target.value)}
                  placeholder="Ex.: Corp PMO"
                />
              </label>
              <label>
                Repositório GitHub
                <input
                  type="url"
                  value={templateMeta.repositoryUrl}
                  onChange={(event) => handleTemplateMetaChange("repositoryUrl", event.target.value)}
                  placeholder="https://github.com/org/template"
                />
              </label>
              <label>
                Orçamento base (R$)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={templateMeta.budget}
                  onChange={(event) => handleTemplateMetaChange("budget", event.target.value)}
                  placeholder="150000"
                />
              </label>

              <p className="subtext">
                Este envio inclui a estrutura da EDT, colunas do board e campos customizados configurados nesta tela.
              </p>

              {templateModalError && <p className="error-text">{templateModalError}</p>}

              <footer className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeTemplateModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={templateModalLoading}>
                  {templateModalLoading ? "Salvando..." : "Salvar template"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};







