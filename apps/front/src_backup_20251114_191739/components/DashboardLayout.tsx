import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Tree } from "@minoru/react-dnd-treeview";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { type FormEvent } from "react";

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
  onExportPortfolio
}: any) => {
  const flattenedTasks = boardColumns.flatMap((column: any) =>
    column.tasks.map((task: any) => ({ ...task, column: column.label }))
  );
  const myTasks = flattenedTasks.slice(0, 6);
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

          <section className="progresso-grid">
            <article className="card">
              <div className="card-header">
                <div>
                  <h2>Resumo do projeto</h2>
                  <p className="subtext">Visão das entregas dos últimos {filters.rangeDays} dias</p>
                </div>
                <label className="inline-select">
                  Intervalo
                  <select value={filters.rangeDays} onChange={(event) => onRangeChange(Number(event.target.value))}>
                    <option value={7}>7 dias</option>
                    <option value={14}>14 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </label>
              </div>
              {summaryError && <p className="error-text">{summaryError}</p>}
              {summary ? (
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
                    <span>Tarefas atrasadas</span>
                    <strong>{summary.overdueTasks}</strong>
                  </div>
                </div>
              ) : (
                <p className="muted">Selecione um projeto para ver o resumo.</p>
              )}
            </article>

            <article className="card">
              <h3>Burn-down / Horas</h3>
              {summary ? (
                <div className="chart-grid">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={summary.burnDown}>
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="done" stroke="#22c55e" />
                      <Line type="monotone" dataKey="remaining" stroke="#ef4444" />
                    </LineChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={summary.timeEntries}>
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#5b3fff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="muted">Sem dados suficientes.</p>
              )}
            </article>
          </section>

          <section className="split-grid">
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
          </section>

          <section className="split-grid">
            <article className="card">
              <div className="card-header">
                <h3>Kanban do projeto</h3>
              </div>
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
            </article>

            <article className="card">
              <div className="card-header">
                <h3>Registro rápido de horas</h3>
              </div>
              <form onSubmit={onLogTime} className="time-form">
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
                <button type="submit">Registrar horas</button>
              </form>
            </article>
          </section>

          <section className="split-grid">
            <article className="card">
              <div className="card-header">
                <h3>WBS (Resumo)</h3>
              </div>
              {wbsError && <p className="error-text">{wbsError}</p>}
              <WbsTreeView nodes={wbsNodes} onMove={onMoveNode} selectedNodeId={selectedNodeId} onSelect={onSelectNode} />
            </article>

            <article className="card">
              <div className="card-header">
                <h3>Gantt simplificado</h3>
              </div>
              {ganttError && <p className="error-text">{ganttError}</p>}
              <GanttTimeline tasks={ganttTasks} milestones={ganttMilestones} />
            </article>
