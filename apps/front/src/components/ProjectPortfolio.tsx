import { useMemo, useState } from "react";

export type PortfolioProject = {
  projectId: string;
  projectName: string;
  code?: string | null;
  status?: string | null;
  clientName?: string | null;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  tasksTotal?: number;
  tasksDone?: number;
  tasksInProgress?: number;
  risksOpen?: number;
  hoursTracked?: number;
};

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  PLANNED: { label: "Planejado", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "warning" },
  ACTIVE: { label: "Em andamento", tone: "warning" },
  ON_HOLD: { label: "Em espera", tone: "neutral" },
  DONE: { label: "Concluído", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "success" },
  AT_RISK: { label: "Em risco", tone: "danger" },
  BLOCKED: { label: "Em risco", tone: "danger" },
  CANCELED: { label: "Cancelado", tone: "neutral" }
};

const chipStatusOptions = [
  { id: "all", label: "Todos" },
  { id: "IN_PROGRESS", label: "Em andamento" },
  { id: "DONE", label: "Concluídos" },
  { id: "AT_RISK", label: "Em risco" },
  { id: "PLANNED", label: "Planejados" }
];

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
};

const calcProgress = (done?: number, total?: number) => {
  if (!total || total === 0) return 0;
  if (!done) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

export type ProjectPortfolioProps = {
  projects: PortfolioProject[];
  error?: string | null;
  isLoading?: boolean;
  onExport?: () => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
};

export const ProjectPortfolio = ({
  projects,
  error,
  isLoading = false,
  onExport,
  selectedProjectId,
  onSelectProject
}: ProjectPortfolioProps) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const clientOptions = useMemo(() => {
    const values = new Set<string>();
    projects.forEach((project) => {
      if (project.clientName?.trim()) values.add(project.clientName.trim());
    });
    return Array.from(values);
  }, [projects]);

  const ownerOptions = useMemo(() => {
    const values = new Set<string>();
    projects.forEach((project) => {
      if (project.responsibleName?.trim()) values.add(project.responsibleName.trim());
    });
    return Array.from(values);
  }, [projects]);

  const tagOptions = useMemo(() => {
    const values = new Set<string>();
    projects.forEach((project) => {
      (project.tags ?? []).forEach((tag) => {
        if (tag) values.add(tag);
      });
    });
    return Array.from(values);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const normalizedStatus = project.status ?? "";
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      const matchesClient = clientFilter === "all" || project.clientName === clientFilter;
      const matchesOwner = ownerFilter === "all" || project.responsibleName === ownerFilter;
      const matchesTag = tagFilter === "all" || (project.tags ?? []).includes(tagFilter);
      const matchesFavorites = !showOnlyFavorites || favoriteIds.has(project.projectId);
      const matchesSearch =
        !normalizedSearch ||
        [project.projectName, project.code, project.clientName, project.responsibleName, ...(project.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesClient && matchesOwner && matchesTag && matchesFavorites && matchesSearch;
    });
  }, [projects, statusFilter, clientFilter, ownerFilter, tagFilter, showOnlyFavorites, favoriteIds, searchTerm]);

  const toggleFavorite = (projectId: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const renderStatusPill = (status?: string | null) => {
    if (!status) return <span className="pill pill-neutral">Sem status</span>;
    const normalized = status.toUpperCase();
    const metadata = statusMap[normalized] ?? { label: normalized, tone: "neutral" };
    return <span className={`pill pill-${metadata.tone}`}>{metadata.label}</span>;
  };

  const emptyState = showOnlyFavorites
    ? "Você ainda não favoritou nenhum projeto."
    : "Sem projetos para o filtro atual.";

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="projects-grid" aria-live="polite">
          {[0, 1, 2].map((index) => (
            <article key={index} className="project-card skeleton-card">
              <div className="skeleton skeleton-pill" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-progress" />
            </article>
          ))}
        </div>
      );
    }

    if (!filteredProjects.length) {
      return <p className="muted empty-state">{emptyState}</p>;
    }

    if (viewMode === "cards") {
      return (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const progress = calcProgress(project.tasksDone, project.tasksTotal);
            const isActive = selectedProjectId === project.projectId;
            return (
              <article
                key={project.projectId}
                className={`project-card ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectProject?.(project.projectId)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectProject?.(project.projectId);
                  }
                }}
              >
                <div className="project-card__header">
                  <div className="project-avatar">
                    {(project.projectName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  {renderStatusPill(project.status)}
                  <button
                    type="button"
                    className={`favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`}
                    onClick={() => toggleFavorite(project.projectId)}
                    aria-label="Favoritar projeto"
                  >
                    ★
                  </button>
                </div>
                <h3>{project.projectName}</h3>
                <p className="subtext">{project.clientName ?? "Cliente não informado"}</p>

                <div className="project-card__meta">
                  <span>{project.responsibleName ?? "Responsável não definido"}</span>
                  <span>
                    {formatDisplayDate(project.startDate)} – {formatDisplayDate(project.endDate)}
                  </span>
                </div>

                <div className="project-card__progress">
                  <div>
                    <small>Progresso</small>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <small>
                    {project.tasksDone ?? 0}/{project.tasksTotal ?? 0} tarefas · {project.risksOpen ?? 0} riscos abertos
                  </small>
                </div>

                <div className="project-card__tags">
                  {(project.tags ?? []).slice(0, 4).map((tag) => (
                    <span key={`${project.projectId}-${tag}`}>{tag}</span>
                  ))}
                  {!project.tags?.length && <span className="pill pill-neutral">Sem tags</span>}
                </div>

                <div className="project-card__footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectProject?.(project.projectId);
                    }}
                  >
                    Ver detalhes
                  </button>
                  <button type="button" className="ghost-button">
                    ···
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      );
    }

    return (
      <div className="project-table__wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Status</th>
              <th>Cliente</th>
              <th>Responsável</th>
              <th>Progresso</th>
              <th>Riscos</th>
              <th>Horas</th>
              <th>Período</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => {
              const progress = calcProgress(project.tasksDone, project.tasksTotal);
              const hoursValue =
                typeof project.hoursTracked === "number" ? project.hoursTracked : Number(project.hoursTracked ?? 0);
              return (
                <tr
                  key={project.projectId}
                  className={selectedProjectId === project.projectId ? "is-active" : ""}
                  onClick={() => onSelectProject?.(project.projectId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectProject?.(project.projectId);
                    }
                  }}
                >
                  <td>
                    <strong>{project.projectName}</strong>
                    <small>{project.tags?.slice(0, 2).join(" • ") || "Sem tags"}</small>
                  </td>
                  <td>{renderStatusPill(project.status)}</td>
                  <td>{project.clientName ?? "—"}</td>
                  <td>{project.responsibleName ?? "—"}</td>
                  <td>
                    <div className="table-progress">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <small>{progress}%</small>
                  </td>
                  <td>{project.risksOpen ?? 0}</td>
                  <td>{hoursValue.toFixed(1)}h</td>
                  <td>
                    {formatDisplayDate(project.startDate)} – {formatDisplayDate(project.endDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="projects-section" aria-label="Listagem de projetos" aria-busy={isLoading}>
      <header className="projects-header">
        <div>
          <p className="eyebrow">Portfólio</p>
          <h2>Projetos</h2>
          <p className="subtext">Filtros avançados e troca de visualização entre cards e tabela.</p>
        </div>
        <div className="projects-actions">
          <button type="button" className="secondary-button">
            + Novo Projeto
          </button>
          <button type="button" className="ghost-button" onClick={onExport} disabled={!onExport || !projects.length}>
            Exportar portfólio
          </button>
          <div className="view-toggle" role="group" aria-label="Trocar visualização">
            <button type="button" className={viewMode === "cards" ? "is-active" : ""} onClick={() => setViewMode("cards")}>
              Cards
            </button>
            <button type="button" className={viewMode === "table" ? "is-active" : ""} onClick={() => setViewMode("table")}>
              Tabela
            </button>
          </div>
        </div>
      </header>

      <div className="project-toolbar">
        <div className="chip-group">
          {chipStatusOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`filter-chip ${statusFilter === option.id ? "is-active" : ""}`}
              onClick={() => setStatusFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={`filter-chip ${showOnlyFavorites ? "is-active" : ""}`}
            onClick={() => setShowOnlyFavorites((value) => !value)}
          >
            Favoritos
          </button>
        </div>

        <div className="project-toolbar__controls">
          <label>
            Cliente
            <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
              <option value="all">Todos</option>
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
              <option value="all">Todos</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tags
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="all">Todas</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <label className="search-field">
            <span>Busca</span>
            <input
              type="search"
              placeholder="Projeto, cliente ou tag..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="error-text" role="status" aria-live="assertive">
          {error}
        </p>
      )}

      {renderList()}
    </section>
  );
};
