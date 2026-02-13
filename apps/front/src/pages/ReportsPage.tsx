import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { normalizeStatus } from "../utils/status";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";

type ProjectTone = "neutral" | "info" | "warning" | "danger" | "success";

type ProjectSummary = {
  projectId: string;
  projectName: string;
  tasksDone?: number;
  tasksTotal?: number;
  endDate?: string | null;
  clientName?: string | null;
  code?: string | null;
  responsibleName?: string | null;
  status?: string | null;
  priority?: string | null;
  priorityLevel?: string | null;
};

type PanelNode = {
  id: string;
  title: string;
  status?: string | null;
  level?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number | null;
  children?: PanelNode[];
};

type LevelFilter = "1" | "2" | "1-2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type ScopeRow = {
  id: string;
  title: string;
  status: string;
  level: number;
  progress: number;
  startDate?: string | null;
  endDate?: string | null;
};

type PanelState = {
  nodes: PanelNode[];
  loading: boolean;
  error: string | null;
};

const projectStatusMap: Record<string, { label: string; tone: ProjectTone }> = {
  PLANNED: { label: "Planejado", tone: "neutral" },
  PLANEJADO: { label: "Planejado", tone: "neutral" },
  PLANNING: { label: "Planejamento", tone: "neutral" },
  PLANEJAMENTO: { label: "Planejamento", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "warning" },
  "EM ANDAMENTO": { label: "Em andamento", tone: "warning" },
  EM_ANDAMENTO: { label: "Em andamento", tone: "warning" },
  ACTIVE: { label: "Em andamento", tone: "warning" },
  ON_HOLD: { label: "Pausado", tone: "neutral" },
  PAUSADO: { label: "Pausado", tone: "neutral" },
  PAUSED: { label: "Pausado", tone: "neutral" },
  "NÃO INICIADO": { label: "Não iniciado", tone: "neutral" },
  "NAO INICIADO": { label: "Não iniciado", tone: "neutral" },
  NAO_INICIADO: { label: "Não iniciado", tone: "neutral" },
  DONE: { label: "Concluído", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "success" },
  FINALIZADO: { label: "Concluído", tone: "success" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
  "CONCLUÍDO": { label: "Concluído", tone: "success" },
  DELAYED: { label: "Atrasado", tone: "danger" },
  LATE: { label: "Atrasado", tone: "danger" },
  OVERDUE: { label: "Atrasado", tone: "danger" },
  ATRASADO: { label: "Atrasado", tone: "danger" },
  AT_RISK: { label: "Em risco", tone: "danger" },
  BLOCKED: { label: "Em risco", tone: "danger" },
  "EM RISCO": { label: "Em risco", tone: "danger" },
  RISCO: { label: "Em risco", tone: "danger" },
  CANCELED: { label: "Cancelado", tone: "neutral" },
  CANCELADO: { label: "Cancelado", tone: "neutral" }
};

const priorityMap: Record<string, { label: string; tone: ProjectTone; rank: number }> = {
  LOW: { label: "Baixa", tone: "neutral", rank: 4 },
  BAIXA: { label: "Baixa", tone: "neutral", rank: 4 },
  MEDIUM: { label: "Média", tone: "info", rank: 3 },
  MEDIA: { label: "Média", tone: "info", rank: 3 },
  "MÉDIA": { label: "Média", tone: "info", rank: 3 },
  HIGH: { label: "Alta", tone: "warning", rank: 2 },
  ALTA: { label: "Alta", tone: "warning", rank: 2 },
  URGENT: { label: "Urgente", tone: "danger", rank: 1 },
  URGENTE: { label: "Urgente", tone: "danger", rank: 1 },
  CRITICAL: { label: "Urgente", tone: "danger", rank: 1 }
};

const normalizeValue = (value?: string | null) => (value ?? "").trim().toUpperCase();

const getProjectStatusValue = (project: ProjectSummary) =>
  project.status ??
  (project as { statusLabel?: string | null; projectStatus?: string | null }).statusLabel ??
  (project as { projectStatus?: string | null }).projectStatus ??
  null;

const resolveProjectStatusKey = (status?: string | null) => {
  const normalized = normalizeValue(status);
  if (!normalized) return "UNKNOWN";
  if (["DONE", "COMPLETED", "FINALIZADO", "CONCLUIDO", "CONCLUÍDO"].includes(normalized)) return "COMPLETED";
  if (["IN_PROGRESS", "ACTIVE", "EM ANDAMENTO", "EM_ANDAMENTO"].includes(normalized)) return "IN_PROGRESS";
  if (
    ["PLANNED", "PLANNING", "PLANEJADO", "PLANEJAMENTO", "NAO INICIADO", "NÃO INICIADO", "NAO_INICIADO"].includes(
      normalized
    )
  ) {
    return "PLANNED";
  }
  if (["ON_HOLD", "PAUSED", "PAUSADO"].includes(normalized)) return "PAUSED";
  if (["DELAYED", "LATE", "OVERDUE", "ATRASADO"].includes(normalized)) return "LATE";
  if (["AT_RISK", "BLOCKED", "EM RISCO", "RISCO"].includes(normalized)) return "RISK";
  if (["CANCELED", "CANCELADO", "CANCELLED"].includes(normalized)) return "CANCELED";
  return "UNKNOWN";
};

const getProjectStatusMeta = (status?: string | null) => {
  if (!status) return { label: "Sem status", tone: "neutral" as const };
  const normalized = normalizeValue(status);
  return projectStatusMap[normalized] ?? { label: status, tone: "neutral" as const };
};

const getProjectPriorityMeta = (priority?: string | null) => {
  if (!priority) return { label: "Média", tone: "info" as const, rank: 3 };
  const normalized = normalizeValue(priority);
  return priorityMap[normalized] ?? { label: priority, tone: "neutral" as const, rank: 4 };
};

const formatShortDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return safeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const calcProgress = (done?: number, total?: number) => {
  if (!total || total === 0) return 0;
  if (!done) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

const getScopeTone = (statusLabel: string): ProjectTone => {
  const normalized = statusLabel.toLowerCase();
  if (normalized.includes("final")) return "success";
  if (normalized.includes("atras") || normalized.includes("risco")) return "danger";
  if (normalized.includes("andam") || normalized.includes("homolog")) return "warning";
  return "neutral";
};

const computeNodeProgress = (node: PanelNode): number => {
  if (Array.isArray(node.children) && node.children.length) {
    const total = node.children.reduce((sum, child) => sum + computeNodeProgress(child), 0);
    return Math.round(total / node.children.length);
  }
  const statusLabel = normalizeStatus(node.status);
  if (statusLabel === "Finalizado") return 100;
  if (statusLabel === "Em andamento") return 50;
  if (typeof node.progress === "number" && Number.isFinite(node.progress)) {
    return Math.max(0, Math.min(100, Math.round(node.progress)));
  }
  return 0;
};

const flattenNodes = (nodes: PanelNode[], levelOffset: number, rows: ScopeRow[]) => {
  nodes.forEach((node) => {
    const levelValue = typeof node.level === "number" ? node.level : levelOffset;
    rows.push({
      id: node.id,
      title: node.title?.trim() || "Tarefa sem nome",
      status: node.status ?? "",
      level: levelValue,
      progress: computeNodeProgress(node),
      startDate: node.startDate ?? null,
      endDate: node.endDate ?? null
    });
    if (Array.isArray(node.children) && node.children.length) {
      flattenNodes(node.children, levelValue + 1, rows);
    }
  });
};

const ProjectProgressPill = ({ percent, variant }: { percent: number; variant: "success" | "info" | "neutral" }) => {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.round(percent))) : 0;
  return (
    <div className={`reports-progress-pill is-${variant}`}>
      <span className="reports-progress-pill-track">
        <span className="reports-progress-pill-fill" style={{ width: `${safePercent}%` }} />
      </span>
      <strong>{safePercent}%</strong>
    </div>
  );
};

const ProjectMiniCard = ({ project }: { project: ProjectSummary }) => {
  const progress = calcProgress(project.tasksDone, project.tasksTotal);
  const priorityMeta = getProjectPriorityMeta(project.priority ?? project.priorityLevel ?? null);
  const statusMeta = getProjectStatusMeta(getProjectStatusValue(project));
  const tasksTotal = project.tasksTotal ?? 0;
  const tasksDone = project.tasksDone ?? 0;
  const scheduleLabel = project.endDate ? formatShortDate(project.endDate) : "Sem prazo";
  const clientLabel = project.clientName ?? project.code ?? "Cliente não informado";
  const responsibleLabel = project.responsibleName ?? "Responsável não definido";
  return (
    <article className={`reports-mini-card tone-${priorityMeta.tone}`}>
      <div className="reports-mini-card__header">
        <span className={`reports-pill tone-${statusMeta.tone}`}>{statusMeta.label}</span>
        <span className={`reports-pill tone-${priorityMeta.tone}`}>{priorityMeta.label}</span>
      </div>
      <h3>{project.projectName}</h3>
      <p className="reports-project-subtitle">{clientLabel}</p>
      <div className="reports-progress-bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="reports-project-meta">
        <span>
          {tasksDone}/{tasksTotal} tarefas
        </span>
        <span>Entrega: {scheduleLabel}</span>
      </div>
      <div className="reports-project-owner">
        <span>Responsável</span>
        <strong title={responsibleLabel}>{responsibleLabel}</strong>
      </div>
    </article>
  );
};

const buildPanelRows = (nodes: PanelNode[], levelFilter: LevelFilter, query: string) => {
  const rows: ScopeRow[] = [];
  flattenNodes(nodes, 0, rows);
  const normalized = rows.map((row) => ({
    ...row,
    level: row.level + 1
  }));
  const search = query.trim().toLowerCase();
  return normalized.filter((row) => {
    if (levelFilter === "1" && row.level !== 1) return false;
    if (levelFilter === "2" && row.level !== 2) return false;
    if (levelFilter === "1-2" && row.level > 2) return false;
    if (levelFilter !== "1" && levelFilter !== "2" && levelFilter !== "1-2") {
      const target = Number(levelFilter);
      if (Number.isFinite(target) && row.level !== target) return false;
    }
    if (!search) return true;
    return row.title.toLowerCase().includes(search);
  });
};

const formatProjectsCount = (count: number) => `${count} projeto${count === 1 ? "" : "s"}`;

const ReportsPage = () => {
  const {
    portfolio,
    portfolioError,
    portfolioLoading,
    reportsError,
    reportsLoading,
    selectedOrganizationId
  } = useOutletContext<DashboardOutletContext>();
  const { token } = useAuth();

  const [scopeLevel, setScopeLevel] = useState<LevelFilter>("1-2");
  const [scopeSearch, setScopeSearch] = useState("");
  const [panelData, setPanelData] = useState<Record<string, PanelState>>({});

  const selectedProjectName = "Todos os projetos";

  const groupedProjects = useMemo(() => {
    const normalized = portfolio as ProjectSummary[];
    const getKey = (project: ProjectSummary) => resolveProjectStatusKey(getProjectStatusValue(project));
    const finished = normalized.filter((project) => getKey(project) === "COMPLETED");
    const planned = normalized.filter((project) => getKey(project) === "PLANNED");
    const inProgress = normalized
      .filter((project) => getKey(project) === "IN_PROGRESS")
      .sort((a, b) => {
        const priorityA = getProjectPriorityMeta(a.priority ?? a.priorityLevel ?? null).rank;
        const priorityB = getProjectPriorityMeta(b.priority ?? b.priorityLevel ?? null).rank;
        if (priorityA !== priorityB) return priorityA - priorityB;
        const dateA = a.endDate ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
        return dateA - dateB;
      });
    return {
      finished,
      planned,
      inProgress,
      all: normalized
    };
  }, [portfolio]);

  const currentProjectsLabel = groupedProjects.inProgress.length === 1
    ? groupedProjects.inProgress[0].projectName
    : groupedProjects.inProgress.length
      ? `Vários projetos (${groupedProjects.inProgress.length})`
      : "Nenhum projeto";


  useEffect(() => {
    const loadPanels = async () => {
      const targets = groupedProjects.inProgress.map((project) => project.projectId);
      if (!targets.length) return;
      await Promise.all(
        targets.map(async (projectId) => {
          const existing = panelData[projectId];
          if (existing && (existing.loading || existing.nodes.length)) return;
          setPanelData((prev) => ({
            ...prev,
            [projectId]: { nodes: prev[projectId]?.nodes ?? [], loading: true, error: null }
          }));
          try {
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;
            const response = await fetch(apiUrl(`/projects/${projectId}/wbs`), {
              headers,
              credentials: "include"
            });
            if (!response.ok) {
              const text = await response.text();
              throw new Error(text || "Erro ao carregar EAP");
            }
            const data = await response.json();
            setPanelData((prev) => ({
              ...prev,
              [projectId]: {
                nodes: Array.isArray(data?.nodes) ? data.nodes : [],
                loading: false,
                error: null
              }
            }));
          } catch (error: any) {
            setPanelData((prev) => ({
              ...prev,
              [projectId]: {
                nodes: prev[projectId]?.nodes ?? [],
                loading: false,
                error: error?.message ?? "Erro ao carregar EAP"
              }
            }));
          }
        })
      );
    };
    loadPanels();
  }, [groupedProjects.inProgress, panelData, selectedOrganizationId, token]);

  const maxLevel = Math.max(2, ...groupedProjects.inProgress.map((project) => {
    const state = panelData[project.projectId];
    if (!state?.nodes?.length) return 2;
    const rows: ScopeRow[] = [];
    flattenNodes(state.nodes, 0, rows);
    const deepest = rows.reduce((max, row) => Math.max(max, row.level + 1), 2);
    return deepest;
  }));

  const levelOptions = [
    { value: "1", label: "Nível 1" },
    { value: "2", label: "Nível 2" },
    { value: "1-2", label: "Nível 1 e 2" }
  ];

  for (let level = 3; level <= maxLevel; level += 1) {
    levelOptions.push({ value: String(level), label: `Nível ${level}` });
  }

  return (
    <section className="reports-page reports-page--timeline">
      <header className="reports-header">
        <div className="reports-header__intro">
          <p className="eyebrow">Relatórios</p>
          <h2>Projetos e atualizações</h2>
          <p className="subtext">Visão macro do portfólio e do escopo por nível da EAP.</p>
        </div>
        <div className="reports-header__actions">
          <button type="button" className="reports-print-button" onClick={() => window.print()}>
            Salvar em PDF
          </button>
        </div>
      </header>

      {portfolioError && <p className="error-text">{portfolioError}</p>}

      <section className="reports-section reports-section--success">
        <div className="reports-section-title reports-section-title--success">
          <h2>
            PROJETOS <span>FINALIZADOS</span>
          </h2>
          <span className="reports-count-pill">{formatProjectsCount(groupedProjects.finished.length)}</span>
        </div>
        {portfolioLoading ? (
          <p className="muted">Carregando projetos...</p>
        ) : groupedProjects.finished.length ? (
          <div className="reports-projects-grid reports-projects-grid--compact">
            {groupedProjects.finished.map((project) => (
              <div key={project.projectId} className="reports-project-item">
                <ProjectProgressPill percent={100} variant="success" />
                <ProjectMiniCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum projeto finalizado.</p>
        )}
      </section>

      <section className="reports-section reports-section--info">
        <div className="reports-section-title reports-section-title--info">
          <h2>
            PROJETOS <span>EM ANDAMENTO</span>
          </h2>
          <span className="reports-count-pill">{formatProjectsCount(groupedProjects.inProgress.length)}</span>
        </div>
        {portfolioLoading ? (
          <p className="muted">Carregando projetos...</p>
        ) : groupedProjects.inProgress.length ? (
          <div className="reports-projects-grid reports-projects-grid--compact">
            {groupedProjects.inProgress.map((project) => {
              const progress = calcProgress(project.tasksDone, project.tasksTotal);
              return (
                <div key={project.projectId} className="reports-project-item">
                  <ProjectProgressPill percent={progress} variant="info" />
                  <ProjectMiniCard project={project} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Nenhum projeto em andamento.</p>
        )}
      </section>

      <section className="reports-section reports-section--neutral">
        <div className="reports-section-title reports-section-title--neutral">
          <h2>
            PROJETOS <span>PLANEJADOS</span>
          </h2>
          <span className="reports-count-pill">{formatProjectsCount(groupedProjects.planned.length)}</span>
        </div>
        {portfolioLoading ? (
          <p className="muted">Carregando projetos...</p>
        ) : groupedProjects.planned.length ? (
          <div className="reports-projects-grid reports-projects-grid--compact">
            {groupedProjects.planned.map((project) => (
              <div key={project.projectId} className="reports-project-item">
                <ProjectProgressPill percent={0} variant="neutral" />
                <ProjectMiniCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhum projeto planejado.</p>
        )}
      </section>

      <section className="reports-block reports-block--scope">
        <header className="reports-block-header">
          <div>
            <p className="reports-block-kicker">Atualizações em andamento</p>
            <h2>
              PROJETOS ATUALIZAÇÕES <span className="reports-title-accent">EM ANDAMENTO</span>
            </h2>
            <p>Mostrando apenas projetos em andamento. Se houver mais, eles aparecem abaixo.</p>
          </div>
          <div className="reports-block-meta">
            <span className="reports-meta-pill">{groupedProjects.inProgress.length} projetos</span>
          </div>
        </header>

        <div className="reports-scope-controls">
          <label className="reports-control">
            <span>Nível (macro)</span>
            <select value={scopeLevel} onChange={(event) => setScopeLevel(event.target.value as LevelFilter)}>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="reports-control">
            <span>Buscar etapa</span>
            <input
              type="search"
              placeholder="Buscar etapa..."
              value={scopeSearch}
              onChange={(event) => setScopeSearch(event.target.value)}
            />
          </label>
          <div className="reports-control reports-control--readonly">
            <span>Projetos (atual)</span>
            <div className="reports-control-value">{currentProjectsLabel}</div>
          </div>
        </div>

        {groupedProjects.inProgress.length === 0 ? (
          <p className="muted">Nenhum projeto em andamento.</p>
        ) : (
          groupedProjects.inProgress.map((project) => {
            const panelState = panelData[project.projectId] ?? { nodes: [], loading: false, error: null };
            const panelRows = buildPanelRows(panelState.nodes, scopeLevel, scopeSearch);
            const percentRows = buildPanelRows(panelState.nodes, scopeLevel, "");
            const scopePercent = percentRows.length
              ? Math.round(percentRows.reduce((sum, row) => sum + row.progress, 0) / percentRows.length)
              : 0;
            const panelProgress = calcProgress(project.tasksDone, project.tasksTotal);
            return (
              <div key={project.projectId} className="reports-updates-grid">
                <div className="reports-updates-left">
                  <div className="reports-project-spot">
                    <span>Projeto: {project.projectName}</span>
                  </div>
                  <div className="reports-gauge-card">
                    <div className="reports-gauge-title">Percentual Concluído</div>
                    <div className="reports-gauge-bar">
                      <span style={{ width: `${panelProgress}%` }} />
                    </div>
                    <div className="reports-gauge-value">{panelProgress}%</div>
                  </div>
                  <div className="reports-scope-card">
                    <span>Percentual do Escopo do Projeto</span>
                    <strong>{scopePercent}%</strong>
                    <div className="reports-progress-bar reports-progress-bar--soft">
                      <span style={{ width: `${scopePercent}%` }} />
                    </div>
                  </div>
                  <div className="reports-scope-chart">
                    {panelState.loading ? (
                      <p className="muted">Carregando etapas...</p>
                    ) : panelRows.length ? (
                      <>
                        {panelRows.map((row) => (
                          <div key={row.id} className="reports-scope-chart-row">
                            <div
                              className="reports-scope-chart-label"
                              style={{ paddingLeft: `${Math.max(0, row.level - 1) * 14}px` }}
                            >
                              {row.title}
                            </div>
                            <div className="reports-scope-chart-bar">
                              <span style={{ width: `${row.progress}%` }} />
                            </div>
                            <div className="reports-scope-chart-value">{row.progress}%</div>
                          </div>
                        ))}
                        <div className="reports-scope-chart-axis">
                          <div className="reports-scope-chart-axis-spacer" />
                          <div className="reports-scope-chart-axis-line">
                            <span>0%</span>
                            <span>20%</span>
                            <span>40%</span>
                            <span>60%</span>
                            <span>80%</span>
                            <span>100%</span>
                          </div>
                          <div />
                        </div>
                      </>
                    ) : (
                      <p className="muted">Nenhuma etapa encontrada.</p>
                    )}
                  </div>
                </div>

                <div className="reports-updates-right">
                  <h3>Escopo do Projeto Previsto</h3>
                  {panelState.error && <p className="error-text">{panelState.error}</p>}
                  <div className="reports-table-scroll">
                    <table className="reports-scope-table">
                      <thead>
                        <tr>
                          <th>Nome da tarefa</th>
                          <th>Situação</th>
                          <th>Início</th>
                          <th>Término</th>
                          <th>% concluído</th>
                        </tr>
                      </thead>
                      <tbody>
                        {panelState.loading ? (
                          <tr>
                            <td colSpan={5} className="reports-empty">Carregando etapas...</td>
                          </tr>
                        ) : panelRows.length ? (
                          panelRows.map((row) => {
                            const statusLabel = normalizeStatus(row.status);
                            const tone = getScopeTone(statusLabel);
                            return (
                              <tr key={row.id}>
                                <td>
                                  <span
                                    className="reports-scope-name"
                                    style={{ paddingLeft: `${Math.max(0, row.level - 1) * 14}px` }}
                                  >
                                    {row.title}
                                  </span>
                                </td>
                                <td>
                                  <span className={`reports-pill tone-${tone}`}>{statusLabel}</span>
                                </td>
                                <td>{formatShortDate(row.startDate ?? null)}</td>
                                <td>{formatShortDate(row.endDate ?? null)}</td>
                                <td>
                                  <div className="reports-scope-progress">
                                    <span style={{ width: `${row.progress}%` }} />
                                  </div>
                                  <small>{row.progress}%</small>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="reports-empty">
                              Nenhuma etapa encontrada para o nível selecionado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {reportsError && <p className="error-text">{reportsError}</p>}
      {reportsLoading && <p className="muted">Carregando relatórios...</p>}
    </section>
  );
};

export default ReportsPage;
