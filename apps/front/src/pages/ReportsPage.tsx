import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { ReportsPanel } from "../components/DashboardLayout";
import { normalizeStatus } from "../utils/status";

type ProjectTone = "neutral" | "info" | "warning" | "danger" | "success";

const projectStatusMap: Record<string, { label: string; tone: ProjectTone }> = {
  PLANNED: { label: "Planejado", tone: "neutral" },
  PLANNING: { label: "Planejamento", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "warning" },
  ACTIVE: { label: "Em andamento", tone: "warning" },
  ON_HOLD: { label: "Pausado", tone: "neutral" },
  PAUSED: { label: "Pausado", tone: "neutral" },
  DONE: { label: "Concluído", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "success" },
  DELAYED: { label: "Atrasado", tone: "danger" },
  LATE: { label: "Atrasado", tone: "danger" },
  OVERDUE: { label: "Atrasado", tone: "danger" },
  AT_RISK: { label: "Em risco", tone: "danger" },
  BLOCKED: { label: "Em risco", tone: "danger" },
  CANCELED: { label: "Cancelado", tone: "neutral" }
};

const priorityMap: Record<string, { label: string; tone: ProjectTone }> = {
  LOW: { label: "Baixa", tone: "neutral" },
  BAIXA: { label: "Baixa", tone: "neutral" },
  MEDIUM: { label: "Média", tone: "info" },
  MEDIA: { label: "Média", tone: "info" },
  HIGH: { label: "Alta", tone: "warning" },
  ALTA: { label: "Alta", tone: "warning" },
  URGENT: { label: "Urgente", tone: "danger" },
  URGENTE: { label: "Urgente", tone: "danger" },
  CRITICAL: { label: "Urgente", tone: "danger" }
};

const normalizeValue = (value?: string | null) => (value ?? "").trim().toUpperCase();

const getProjectStatusMeta = (status?: string | null) => {
  if (!status) return { label: "Sem status", tone: "neutral" as const };
  const normalized = normalizeValue(status);
  return projectStatusMap[normalized] ?? { label: status, tone: "neutral" as const };
};

const getProjectPriorityMeta = (priority?: string | null) => {
  if (!priority) return { label: "Média", tone: "info" as const };
  const normalized = normalizeValue(priority);
  return priorityMap[normalized] ?? { label: priority, tone: "neutral" as const };
};

const formatShortDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return safeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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

type ScopeRow = {
  id: string;
  title: string;
  status: string;
  level: number;
  projectName: string;
  progress: number;
};

const ReportsPage = () => {
  const {
    portfolio,
    portfolioError,
    portfolioLoading,
    wbsNodes,
    wbsError,
    reportsData,
    reportsError,
    reportsLoading,
    selectedProjectId,
    projects
  } = useOutletContext<DashboardOutletContext>();
  const [scopeLevel, setScopeLevel] = useState("all");
  const [scopeSearch, setScopeSearch] = useState("");

  const selectedProjectName = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === "all") return "Todos os projetos";
    return (
      portfolio.find((project) => project.projectId === selectedProjectId)?.projectName ??
      projects.find((project) => project.id === selectedProjectId)?.name ??
      "Projeto selecionado"
    );
  }, [selectedProjectId, portfolio, projects]);

  const progressById = useMemo(() => {
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
    (wbsNodes ?? []).forEach((node: any) => compute(node));
    return cache;
  }, [wbsNodes]);

  const { flattenedWbs, maxLevel } = useMemo(() => {
    const rows: ScopeRow[] = [];
    let deepest = 1;
    const walk = (nodes: any[], level: number) => {
      nodes.forEach((node) => {
        const title = node.title?.trim() || "Tarefa sem nome";
        const projectName = node.projectName ?? selectedProjectName;
        const progress = progressById.get(node.id) ?? 0;
        rows.push({
          id: node.id,
          title,
          status: node.status ?? "",
          level,
          projectName,
          progress
        });
        deepest = Math.max(deepest, level);
        if (Array.isArray(node.children) && node.children.length) {
          walk(node.children, level + 1);
        }
      });
    };
    walk(wbsNodes ?? [], 1);
    return { flattenedWbs: rows, maxLevel: deepest };
  }, [progressById, selectedProjectName, wbsNodes]);

  const levelOptions = useMemo(() => {
    const limit = Math.max(1, maxLevel);
    const options = [{ value: "all", label: "Todos os níveis" }];
    for (let level = 1; level <= limit; level += 1) {
      options.push({
        value: String(level),
        label: level === 1 ? "Somente nível 1" : `Nível 1-${level}`
      });
    }
    return options;
  }, [maxLevel]);

  const levelLimit = scopeLevel === "all" ? maxLevel : Number(scopeLevel);
  const resolvedLevelLimit = Number.isFinite(levelLimit) ? Math.max(1, levelLimit) : maxLevel;

  const filteredWbs = useMemo(() => {
    const query = scopeSearch.trim().toLowerCase();
    return flattenedWbs.filter((row) => {
      if (row.level > resolvedLevelLimit) return false;
      if (!query) return true;
      return row.title.toLowerCase().includes(query) || row.projectName.toLowerCase().includes(query);
    });
  }, [flattenedWbs, resolvedLevelLimit, scopeSearch]);

  const completedStages = filteredWbs.filter((row) => normalizeStatus(row.status) === "Finalizado").length;
  const completionPercent = filteredWbs.length
    ? Math.round((completedStages / filteredWbs.length) * 100)
    : 0;
  const scopePercent = filteredWbs.length
    ? Math.round(filteredWbs.reduce((sum, row) => sum + row.progress, 0) / filteredWbs.length)
    : 0;

  const totalProjects = portfolio.length;
  const scopeLabel = resolvedLevelLimit <= 1 ? "Nível 1" : `Nível 1-${resolvedLevelLimit}`;
  const heroStats = [
    { label: "Projetos na organização", value: portfolioLoading ? "--" : totalProjects.toString() },
    { label: "Tarefas no escopo", value: filteredWbs.length.toString() },
    { label: "Etapas finalizadas", value: `${completionPercent}%` }
  ];

  return (
    <section className="reports-page">
      <header className="reports-hero">
        <div className="reports-hero__grid">
          <div className="reports-hero__content">
            <p className="reports-hero__kicker">Relatórios</p>
            <h1 className="reports-hero__title">Panorama completo da organização</h1>
            <p className="reports-hero__subtitle">
              Acompanhe prioridades, status e o progresso do escopo filtrado da EAP em um só lugar.
            </p>
          </div>
          <div className="reports-hero__actions">
            <button type="button" className="reports-print-button" onClick={() => window.print()}>
              Exportar PDF
            </button>
          </div>
        </div>
        <div className="reports-hero__stats">
          {heroStats.map((stat) => (
            <div key={stat.label} className="reports-hero__stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </header>

      <section className="reports-block reports-block--portfolio">
        <header className="reports-block-header">
          <div>
            <p className="reports-block-kicker">Portfólio da organização</p>
            <h2>Projetos, prioridades e status</h2>
            <p>Resumo visual com progresso, prazos e responsáveis principais.</p>
          </div>
          <div className="reports-block-meta">
            <span className="reports-meta-pill">{totalProjects} projetos</span>
          </div>
        </header>

        {portfolioError && <p className="error-text">{portfolioError}</p>}
        {portfolioLoading ? (
          <p className="muted">Carregando projetos...</p>
        ) : portfolio.length ? (
          <div className="reports-projects-grid">
            {portfolio.map((project) => {
              const progress = calcProgress(project.tasksDone, project.tasksTotal);
              const priorityMeta = getProjectPriorityMeta(
                project.priority ?? (project as { priorityLevel?: string | null }).priorityLevel ?? null
              );
              const statusMeta = getProjectStatusMeta(project.status);
              const tasksTotal = project.tasksTotal ?? 0;
              const tasksDone = project.tasksDone ?? 0;
              const scheduleLabel = project.endDate ? formatShortDate(project.endDate) : "Sem prazo";
              const clientLabel = project.clientName ?? project.code ?? "Cliente não informado";
              const responsibleLabel = project.responsibleName ?? "Responsável não definido";
              return (
                <article key={project.projectId} className={`reports-project-card tone-${priorityMeta.tone}`}>
                  <div className="reports-project-card__header">
                    <div className="reports-project-tags">
                      <span className={`reports-pill tone-${priorityMeta.tone}`}>{priorityMeta.label}</span>
                      <span className={`reports-pill tone-${statusMeta.tone}`}>{statusMeta.label}</span>
                    </div>
                    <span className="reports-project-progress">{progress}%</span>
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
                    <strong>{responsibleLabel}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted">Nenhum projeto encontrado para a organização.</p>
        )}
      </section>

      <section className="reports-block reports-block--scope">
        <header className="reports-block-header">
          <div>
            <p className="reports-block-kicker">Escopo e EAP</p>
            <h2>Escopo do projeto</h2>
            <p>Filtre os níveis da EAP para acompanhar entregas e progresso do escopo.</p>
          </div>
          <div className="reports-block-meta">
            <span className="reports-meta-pill">{scopeLabel}</span>
          </div>
        </header>

        <div className="reports-scope-controls">
          <label className="reports-control">
            <span>Nível da EAP</span>
            <select value={scopeLevel} onChange={(event) => setScopeLevel(event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="reports-control">
            <span>Buscar tarefa</span>
            <input
              type="search"
              placeholder="Nome da tarefa ou projeto..."
              value={scopeSearch}
              onChange={(event) => setScopeSearch(event.target.value)}
            />
          </label>
          <div className="reports-control reports-control--readonly">
            <span>Projeto</span>
            <div className="reports-control-value">{selectedProjectName}</div>
          </div>
        </div>

        {wbsError && <p className="error-text">{wbsError}</p>}

        <div className="reports-scope-metrics">
          <article className="reports-scope-card">
            <span>Percentual das etapas finalizadas</span>
            <strong>{completionPercent}%</strong>
            <div className="reports-progress-bar">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
          </article>
          <article className="reports-scope-card">
            <span>Percentual do escopo do projeto</span>
            <strong>{scopePercent}%</strong>
            <div className="reports-progress-bar reports-progress-bar--soft">
              <span style={{ width: `${scopePercent}%` }} />
            </div>
          </article>
        </div>

        <div className="reports-scope-table">
          <div className="reports-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Tarefa</th>
                  <th>Projeto</th>
                  <th>Status</th>
                  <th>% Concluído</th>
                </tr>
              </thead>
              <tbody>
                {filteredWbs.length ? (
                  filteredWbs.map((row) => {
                    const statusLabel = normalizeStatus(row.status);
                    const tone = getScopeTone(statusLabel);
                    return (
                      <tr key={row.id}>
                        <td>
                          <span className="reports-level-pill">N{row.level}</span>
                        </td>
                        <td>{row.title}</td>
                        <td>{row.projectName}</td>
                        <td>
                          <span className={`reports-pill tone-${tone}`}>{statusLabel}</span>
                        </td>
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
                      Nenhuma tarefa encontrada para o nível selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ReportsPanel
        metrics={reportsData}
        metricsError={reportsError ?? null}
        metricsLoading={Boolean(reportsLoading)}
      />
    </section>
  );
};

export default ReportsPage;
