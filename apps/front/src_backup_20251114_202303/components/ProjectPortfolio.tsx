import { useMemo, useState } from "react";

type RawPortfolioProject = {
  projectId: string;
  projectName: string;
  status?: string;
  tasksTotal?: number;
  tasksDone?: number;
  tasksInProgress?: number;
  risksOpen?: number;
  hoursTracked?: number;
  client?: string;
  owner?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
};

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  PLANNED: { label: "Planejado", tone: "neutral" },
  IN_PROGRESS: { label: "Em andamento", tone: "warning" },
  ACTIVE: { label: "Em andamento", tone: "warning" },
  DONE: { label: "Concluído", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "success" },
  AT_RISK: { label: "Em risco", tone: "danger" },
  BLOCKED: { label: "Em risco", tone: "danger" }
};

const clientPool = ["Aurum Bank", "LumenX", "ShiftWare", "FuturaPay", "Orion Logistics", "Atlas Labs"];
const ownerPool = ["Ana Costa", "Bruno Lima", "Isabel Nunes", "Caio Andrade", "Larissa Mendes", "Vitor Dias"];
const tagPool = ["Alto impacto", "Financeiro", "Expansão", "SaaS", "Crítico", "OKR Q4"];

const chipStatusOptions = [
  { id: "all", label: "Todos" },
  { id: "IN_PROGRESS", label: "Em andamento" },
  { id: "DONE", label: "Concluídos" },
  { id: "AT_RISK", label: "Em risco" },
  { id: "PLANNED", label: "Planejados" }
];

const toDateString = (value?: string) => {
  if (!value) return "";
  return new Date(value).toISOString();
};

const buildPlaceholderDates = (index: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (index + 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 45 + index * 3);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
};

const formatDisplayDate = (value?: string) => {
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

const calcProgress = (done?: number, total?: number) => {
  if (!total || total === 0 || !done) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

export type ProjectPortfolioProps = {
  projects: RawPortfolioProject[];
  error?: string | null;
  onExport?: () => void;
};

export const ProjectPortfolio = ({ projects, error, onExport }: ProjectPortfolioProps) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const decoratedProjects = useMemo(() => {
    return projects.map((project, index) => {
      const placeholderDates = buildPlaceholderDates(index);
      const client = project.client ?? clientPool[index % clientPool.length];
      const owner = project.owner ?? ownerPool[index % ownerPool.length];
      const tags =
        project.tags && project.tags.length
          ? project.tags
          : [tagPool[index % tagPool.length], tagPool[(index + 2) % tagPool.length]].filter(
              (value, idx, array) => array.indexOf(value) === idx
            );

      return {
        ...project,
        client,
        owner,
        tags,
        startDate: toDateString(project.startDate) || placeholderDates.startDate,
        endDate: toDateString(project.endDate) || placeholderDates.endDate
      };
    });
  }, [projects]);

  const clientOptions = useMemo(
    () => Array.from(new Set(decoratedProjects.map((project) => project.client))),
    [decoratedProjects]
  );
  const ownerOptions = useMemo(
    () => Array.from(new Set(decoratedProjects.map((project) => project.owner))),
    [decoratedProjects]
  );
  const tagOptions = useMemo(
    () => Array.from(new Set(decoratedProjects.flatMap((project) => project.tags ?? []))),
    [decoratedProjects]
  );

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return decoratedProjects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesClient = clientFilter === "all" || project.client === clientFilter;
      const matchesOwner = ownerFilter === "all" || project.owner === ownerFilter;
      const matchesTag = tagFilter === "all" || (project.tags ?? []).includes(tagFilter);
      const matchesSearch =
        !normalizedSearch ||
        [project.projectName, project.client, project.owner, ...(project.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesFavorite = !showOnlyFavorites || favoriteIds.has(project.projectId);
      return matchesStatus && matchesClient && matchesOwner && matchesTag && matchesSearch && matchesFavorite;
    });
  }, [decoratedProjects, statusFilter, clientFilter, ownerFilter, tagFilter, searchTerm, favoriteIds, showOnlyFavorites]);

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

  const renderStatusPill = (status?: string) => {
    if (!status) return <span className="pill pill-neutral">Sem status</span>;
    const normalized = status.toUpperCase();
    const metadata = statusMap[normalized] ?? { label: normalized, tone: "neutral" };
    return <span className={`pill pill-${metadata.tone}`}>{metadata.label}</span>;
  };

  return (
    <section className="projects-section" aria-label="Listagem de projetos">
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
          <button type="button" className="ghost-button" onClick={onExport}>
            Exportar portfólio
          </button>
          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "cards" ? "is-active" : ""}
              onClick={() => setViewMode("cards")}
            >
              Cards
            </button>
            <button
              type="button"
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
            >
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
              placeholder="Proj. Aurora, cliente, tag..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!filteredProjects.length ? (
        <p className="muted">Nenhum projeto encontrado com os filtros selecionados.</p>
      ) : viewMode === "cards" ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const progress = calcProgress(project.tasksDone, project.tasksTotal);
            return (
              <article key={project.projectId} className="project-card">
                <div className="project-card__header">
                  <div className="project-avatar">{project.projectName?.slice(0, 2).toUpperCase()}</div>
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
                <p className="subtext">{project.client}</p>

                <div className="project-card__meta">
                  <span>Owner: {project.owner}</span>
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
                  {(project.tags ?? []).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="project-card__footer">
                  <button type="button" className="secondary-button">
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
      ) : (
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
                return (
                  <tr key={project.projectId}>
                    <td>
                      <strong>{project.projectName}</strong>
                      <small>{(project.tags ?? []).slice(0, 2).join(" • ")}</small>
                    </td>
                    <td>{renderStatusPill(project.status)}</td>
                    <td>{project.client}</td>
                    <td>{project.owner}</td>
                    <td>
                      <div className="table-progress">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <small>{progress}%</small>
                    </td>
                    <td>{project.risksOpen ?? 0}</td>
                    <td>{project.hoursTracked ?? 0}h</td>
                    <td>
                      {formatDisplayDate(project.startDate)} – {formatDisplayDate(project.endDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
