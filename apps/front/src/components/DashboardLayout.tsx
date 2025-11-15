import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Tree } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useMemo, useState, type FormEvent } from "react";
import { ProjectPortfolio, type PortfolioProject } from "./ProjectPortfolio";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("pt-BR");
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
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
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

const WbsTreeView = ({
  nodes,
  onMove,
  selectedNodeId,
  onSelect
}: {
  nodes: any[];
  onMove: (id: string, parentId: string | null, position: number) => void;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
}) => {
  if (!nodes.length) return <p className="muted">Nenhum item cadastrado.</p>;

  const flatten = (tree: any[]): any[] =>
    tree.flatMap((node) => [
      node,
      ...flatten(node.children ?? []).map((child) => ({
        ...child,
        parentId: node.id
      }))
    ]);

  const treeNodes = flatten(nodes).map((node) => ({
    id: node.id,
    parent: node.parentId ?? 0,
    text: node.title,
    droppable: true,
    data: node
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <Tree
        tree={treeNodes}
        rootId={0}
        onDrop={(_event, options) => {
          const nodeId = options.dragSource?.id as string | undefined;
          if (!nodeId) return;
          const parentId = options.dropTarget?.id && options.dropTarget.id !== 0 ? (options.dropTarget.id as string) : null;
          onMove(nodeId, parentId, options.destinationIndex ?? 0);
        }}
        render={(node) => (
          <button
            type="button"
            className={`wbs-node ${selectedNodeId === node.id ? "is-active" : ""}`}
            onClick={() => onSelect(node.id as string)}
          >
            <strong>{node.data?.title}</strong> · {node.data?.type} ({node.data?.status})
          </button>
        )}
      />
    </DndProvider>
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
  boardColumns: any[];
  boardError: string | null;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  onDragTask: (result: DropResult) => void;
  newTaskTitle: string;
  onTaskTitleChange: (value: string) => void;
  newTaskColumn: string;
  onTaskColumnChange: (value: string) => void;
  wbsNodes: any[];
  wbsError: string | null;
  onMoveNode: (nodeId: string, parentId: string | null, position: number) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  comments: any[];
  commentsError: string | null;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  commentBody: string;
  onCommentBodyChange: (value: string) => void;
  timeEntryDate: string;
  timeEntryHours: string;
  timeEntryDescription: string;
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
  boardColumns,
  boardError,
  onCreateTask,
  onDragTask,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange,
  wbsNodes,
  wbsError,
  onMoveNode,
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
          <button type="button" className="secondary-button">
            Editar projeto
          </button>
          <button type="button" className="ghost-button">
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
      <WbsTreeView nodes={wbsNodes} onMove={onMoveNode} selectedNodeId={selectedNodeId} onSelect={onSelectNode} />
      <p className="muted">Selecione um item para comentar ou registrar horas na aba de atividade.</p>
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
    const skillPool = ["Scrum", "SQL", "UX", "DevOps", "PMO", "Design Thinking", "DataViz"];
    return members.map((member, index) => {
      const allocation = Math.min(100, Math.round(((member.capacityWeekly ?? 40) / 40) * 100));
      const status =
        allocation > 90 ? "Alocado" : allocation < 50 ? "Em férias / folga" : "Disponível";
      const skills = [
        skillPool[index % skillPool.length],
        skillPool[(index + 3) % skillPool.length]
      ];
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

  const statusData = useMemo(() => {
    if (!metrics?.byStatus) return [];
    return Object.entries(metrics.byStatus).map(([status, value]) => ({ status, value }));
  }, [metrics]);

  const riskData = metrics?.riskSummary ?? { open: 0, closed: 0 };
  const hoursByProject = (metrics?.hoursByProject ?? []).slice(0, 5);
  const progressSeries = metrics?.progressSeries ?? [];

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
  onDragTask,
  newTaskTitle,
  onTaskTitleChange,
  newTaskColumn,
  onTaskColumnChange,
  wbsNodes,
  wbsError,
  onMoveNode,
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
  onExportPortfolio
}: any) => {
  const flattenedTasks = boardColumns.flatMap((column: any) =>
    column.tasks.map((task: any) => ({ ...task, column: column.label }))
  );
  const myTasks = flattenedTasks.slice(0, 6);
  const projectMeta = (portfolio as PortfolioProject[]).find((project) => project.projectId === selectedProjectId) ?? null;
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

  return (
    <div className="app-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <span>G&P</span>
          <small>Gestão de Projetos</small>
        </div>
        <nav>
          {["Dashboard", "Projetos", "Equipe", "Relatórios", "Templates", "Configurações"].map((item) => (
            <button key={item} type="button" className={`sidebar-link ${item === "Dashboard" ? "is-active" : ""}`}>
              {item}
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
            <button type="button">🔔</button>
            <div className="avatar">{userEmail?.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <main>
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
              <button type="button" className="secondary-button">
                Criar projeto
              </button>
              <button type="button" className="ghost-button" onClick={onSignOut}>
                Sair
              </button>
            </div>
          </section>

          {orgError && <p className="error-text">{orgError}</p>}
          {projectsError && <p className="error-text">{projectsError}</p>}

          <section className="summary-grid">
            {kpis.map((kpi) => (
              <article key={kpi.label} className="summary-card">
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
                <small>{kpi.sub}</small>
              </article>
            ))}
          </section>

          <ProjectPortfolio
            projects={portfolio}
            error={portfolioError}
            isLoading={portfolioLoading}
            onExport={onExportPortfolio}
            selectedProjectId={selectedProjectId}
            onSelectProject={onProjectChange}
          />

          <ProjectDetailsTabs
            projectMeta={projectMeta}
            projectLoading={portfolioLoading}
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
            boardColumns={boardColumns}
            boardError={boardError}
            onCreateTask={onCreateTask}
            onDragTask={onDragTask}
            newTaskTitle={newTaskTitle}
            onTaskTitleChange={onTaskTitleChange}
            newTaskColumn={newTaskColumn}
            onTaskColumnChange={onTaskColumnChange}
            wbsNodes={wbsNodes}
            wbsError={wbsError}
            onMoveNode={onMoveNode}
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
            onTimeEntryDateChange={onTimeEntryDateChange}
            onTimeEntryHoursChange={onTimeEntryHoursChange}
            onTimeEntryDescriptionChange={onTimeEntryDescriptionChange}
            onLogTime={onLogTime}
            ganttTasks={ganttTasks}
            ganttMilestones={ganttMilestones}
            ganttError={ganttError}
          />

          <TeamPanel members={members} membersError={membersError} projectName={projectMeta?.projectName ?? null} />
          <ReportsPanel metrics={reportMetrics} metricsError={reportMetricsError} metricsLoading={reportMetricsLoading} />
        </main>
      </div>
    </div>
  );
};
