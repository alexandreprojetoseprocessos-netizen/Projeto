import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Folder,
  ListChecks,
  Minus,
  PauseCircle,
  PlayCircle,
  Star,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import type { CreateProjectPayload } from "./DashboardLayout";

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
  membersCount?: number;
  description?: string | null;
  budget?: number | null;
  priority?: string | null;
  teamMembers?: string[];
  members?: Array<{ name?: string | null; email?: string | null }>;
  repositoryUrl?: string | null;
};

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
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

const priorityMap: Record<string, { label: string; tone: "neutral" | "warning" | "danger" | "info" }> = {
  LOW: { label: "Baixa", tone: "neutral" },
  BAIXA: { label: "Baixa", tone: "neutral" },
  MEDIUM: { label: "Media", tone: "info" },
  MEDIA: { label: "Media", tone: "info" },
  HIGH: { label: "Alta", tone: "warning" },
  ALTA: { label: "Alta", tone: "warning" },
  URGENT: { label: "Urgente", tone: "danger" },
  URGENTE: { label: "Urgente", tone: "danger" },
  CRITICAL: { label: "Urgente", tone: "danger" }
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

const normalizeStatus = (status?: string | null) => (status ?? "").trim().toUpperCase();

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const isCompletedStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "DONE" || normalized === "COMPLETED";
};

const isInProgressStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "IN_PROGRESS" || normalized === "ACTIVE";
};

const isPausedStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "ON_HOLD" || normalized === "PAUSED";
};

const isPlannedStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "PLANNED" || normalized === "PLANNING";
};

const isRiskStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "AT_RISK" || normalized === "BLOCKED";
};

const isLateStatus = (status?: string | null) => {
  const normalized = normalizeStatus(status);
  return normalized === "DELAYED" || normalized === "LATE" || normalized === "OVERDUE";
};

const isCanceledStatus = (status?: string | null) => normalizeStatus(status) === "CANCELED";

const getStartOfDay = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate()).getTime();
};

const getTodayStart = () => getStartOfDay(new Date()) ?? Date.now();

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return currencyFormatter.format(value);
};

const getPriorityMeta = (priority?: string | null) => {
  const normalized = (priority ?? "").trim().toUpperCase();
  if (!normalized) return priorityMap.MEDIUM;
  return priorityMap[normalized] ?? { label: priority ?? "Media", tone: "neutral" as const };
};

type ProjectPriorityKey = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const normalizeProjectPriorityKey = (priority?: string | null): ProjectPriorityKey => {
  const normalized = (priority ?? "").trim().toUpperCase();
  if (["URGENT", "URGENTE", "CRITICAL"].includes(normalized)) return "CRITICAL";
  if (["HIGH", "ALTA"].includes(normalized)) return "HIGH";
  if (["LOW", "BAIXA"].includes(normalized)) return "LOW";
  if (["MEDIUM", "MEDIA"].includes(normalized)) return "MEDIUM";
  return "MEDIUM";
};

const getOverdueDays = (project: PortfolioProject, todayStart: number) => {
  if (!project.endDate) return null;
  const endStart = getStartOfDay(project.endDate);
  if (!endStart) return null;
  if (isCompletedStatus(project.status) || isCanceledStatus(project.status)) return 0;
  const diff = Math.floor((todayStart - endStart) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const isLateProject = (project: PortfolioProject, todayStart: number) => {
  if (isLateStatus(project.status)) return true;
  const overdue = getOverdueDays(project, todayStart);
  return typeof overdue === "number" && overdue > 0;
};

const getProjectDurationDays = (project: PortfolioProject) => {
  const start = project.startDate ? getStartOfDay(project.startDate) : null;
  const end = project.endDate ? getStartOfDay(project.endDate) : null;
  if (start === null || end === null) return null;
  const diff = Math.round((end - start) / MS_IN_DAY);
  return diff >= 0 ? diff : null;
};

const getMemberInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parts = trimmed.replace(/[@._-]+/g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return trimmed.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getTeamMembers = (project: PortfolioProject) => {
  if (Array.isArray(project.teamMembers)) return project.teamMembers;
  const members = (project as { members?: Array<{ name?: string | null; email?: string | null }> }).members;
  if (Array.isArray(members)) {
    return members
      .map((member) => member?.name ?? member?.email ?? "")
      .filter((member) => member);
  }
  return [];
};

const chipStatusOptions = [
  { id: "all", label: "Todos" },
  { id: "PLANNED", label: "Planejamento" },
  { id: "IN_PROGRESS", label: "Em andamento" },
  { id: "DONE", label: "Concluídos" },
  { id: "PAUSED", label: "Pausados" },
  { id: "LATE", label: "Atrasados" },
  { id: "AT_RISK", label: "Em risco" }
];

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return safeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "-";
  }
};

const formatTimelineDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const parts = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).formatToParts(safeDate);
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    const month = (parts.find((part) => part.type === "month")?.value ?? "").replace(".", "");
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    return [day, month, year].filter(Boolean).join(" ");
  } catch {
    return "-";
  }
};

const calcProgress = (done?: number, total?: number) => {
  if (!total || total === 0) return 0;
  if (!done) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

const getTimelineProgress = (project: PortfolioProject, todayStart: number) => {
  const start = project.startDate ? getStartOfDay(project.startDate) : null;
  const end = project.endDate ? getStartOfDay(project.endDate) : null;
  if (!start || !end || end <= start) return null;
  const elapsed = todayStart - start;
  const total = end - start;
  return Math.min(1, Math.max(0, elapsed / total));
};

const renderStatusBadge = (status?: string | null) => {
  if (!status) return <span className="project-status-badge project-status-neutral">Sem status</span>;
  const normalized = status.toUpperCase();
  const metadata = statusMap[normalized] ?? { label: normalized, tone: "neutral" };
  return <span className={`project-status-badge project-status-${metadata.tone}`}>{metadata.label}</span>;
};

export type ProjectPortfolioProps = {
  projects: PortfolioProject[];
  error?: string | null;
  isLoading?: boolean;
  onExport?: () => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  onCreateProject?: (payload: CreateProjectPayload) => void | Promise<void>;
  onViewProjectDetails?: (projectId: string) => void;
  onEditProject?: (project: PortfolioProject) => void;
};

export const ProjectPortfolio = ({
  projects,
  error,
  isLoading = false,
  onExport,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onViewProjectDetails,
  onEditProject
}: ProjectPortfolioProps) => {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const todayStart = getTodayStart();

  const kpiStats = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        const status = normalizeStatus(project.status);
        if (isInProgressStatus(status)) acc.inProgress += 1;
        if (isCompletedStatus(status)) acc.completed += 1;
        if (isPausedStatus(status)) acc.paused += 1;
        if (isLateProject(project, todayStart)) acc.late += 1;
        return acc;
      },
      {
        total: projects.length,
        inProgress: 0,
        completed: 0,
        paused: 0,
        late: 0
      }
    );
  }, [projects, todayStart]);

  const priorityStats = useMemo(
    () =>
      projects.reduce(
        (acc, project) => {
          const key = normalizeProjectPriorityKey(project.priority);
          acc[key] += 1;
          return acc;
        },
        { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<ProjectPriorityKey, number>
      ),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const normalizedStatus = normalizeStatus(project.status);
      const matchesStatus = (() => {
        if (statusFilter === "all") return true;
        if (statusFilter === "IN_PROGRESS") return isInProgressStatus(normalizedStatus);
        if (statusFilter === "DONE") return isCompletedStatus(normalizedStatus);
        if (statusFilter === "PLANNED") return isPlannedStatus(normalizedStatus);
        if (statusFilter === "PAUSED") return isPausedStatus(normalizedStatus);
        if (statusFilter === "LATE") return isLateProject(project, todayStart);
        if (statusFilter === "AT_RISK") return isRiskStatus(normalizedStatus);
        return normalizedStatus === statusFilter;
      })();
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

  const toggleMenu = (projectId: string) => {
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  };

  const handleEnterProject = (projectId: string) => {
    setOpenMenuId(null);
    onSelectProject?.(projectId);
  };

  const handleEditProject = (project: PortfolioProject) => {
    setOpenMenuId(null);
    onEditProject?.(project);
  };

  const emptyState = showOnlyFavorites
    ? "Você ainda não favoritou nenhum projeto."
    : "Sem projetos para o filtro atual.";

  const kpiItems = [
    { id: "total", label: "Total de projetos", value: kpiStats.total, icon: Folder, tone: "neutral" },
    { id: "running", label: "Em andamento", value: kpiStats.inProgress, icon: PlayCircle, tone: "warning" },
    { id: "done", label: "Concluidos", value: kpiStats.completed, icon: CheckCircle2, tone: "success" },
    { id: "paused", label: "Pausados", value: kpiStats.paused, icon: PauseCircle, tone: "neutral" },
    { id: "late", label: "Atrasados", value: kpiStats.late, icon: AlertTriangle, tone: "danger" }
  ];

  const priorityItems = [
    { id: "critical", label: "Urgente", value: priorityStats.CRITICAL, icon: AlertTriangle, tone: "danger" },
    { id: "high", label: "Alta", value: priorityStats.HIGH, icon: TrendingUp, tone: "warning" },
    { id: "medium", label: "Media", value: priorityStats.MEDIUM, icon: Minus, tone: "neutral" },
    { id: "low", label: "Baixa", value: priorityStats.LOW, icon: TrendingDown, tone: "neutral" }
  ];

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
        <section className="projects-grid">
          {filteredProjects.map((project) => {
            const progress = calcProgress(project.tasksDone, project.tasksTotal);
            const isActive = selectedProjectId === project.projectId;
            const tasksTotal = project.tasksTotal ?? 0;
            const tasksDone = project.tasksDone ?? 0;
            const overdueDays = getOverdueDays(project, todayStart);
            const overdueSummaryClass = overdueDays === null ? "is-muted" : overdueDays > 0 ? "is-danger" : "";
            const overdueLabel =
              overdueDays === null ? "Sem prazo" : overdueDays > 0 ? `${overdueDays}d atrasado` : "No prazo";
            const tasksLabel = `${tasksDone}/${tasksTotal} tarefa${tasksTotal === 1 ? "" : "s"}`;
            const budgetCandidate = (project as { budget?: number | string | null }).budget;
            const budgetValue =
              typeof budgetCandidate === "number"
                ? budgetCandidate
                : typeof budgetCandidate === "string"
                  ? Number(budgetCandidate)
                  : null;
            const budgetLabel = formatCurrency(budgetValue);
            const description =
              project.description?.trim() || project.clientName?.trim() || project.code?.trim() || "-";
            const priorityCandidate =
              project.priority ??
              (project as { priorityLevel?: string | null }).priorityLevel ??
              (project as { priorityLabel?: string | null }).priorityLabel ??
              null;
            const priorityMeta = getPriorityMeta(priorityCandidate);
            const teamMembers = getTeamMembers(project);
            const membersCount =
              typeof project.membersCount === "number" ? project.membersCount : teamMembers.length;
            const displayMembers =
              teamMembers.length > 0
                ? teamMembers.slice(0, 4)
                : membersCount > 0
                  ? Array.from({ length: Math.min(4, membersCount) }, () => "")
                  : [];
            const extraMembers =
              teamMembers.length > 4 ? teamMembers.length - 4 : membersCount > 4 ? membersCount - 4 : 0;
            const managerName = project.responsibleName ?? "-";
            const durationDays = getProjectDurationDays(project);
            const durationLabel =
              typeof durationDays === "number"
                ? `${durationDays} dia${durationDays === 1 ? "" : "s"}`
                : "-";
            const timelineProgress = getTimelineProgress(project, todayStart);
            const timelinePosition = `${Math.round((timelineProgress ?? 0) * 100)}%`;
            const timelineHasDates = timelineProgress !== null;
            return (
              <article
                key={project.projectId}
                className={`project-card project-card--elevated ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  setOpenMenuId(null);
                  onSelectProject?.(project.projectId);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setOpenMenuId(null);
                    onSelectProject?.(project.projectId);
                  }
                }}
              >
                <div className="project-card-layout">
                  <header className="project-card-top">
                    <div className="project-card-badges">
                      {renderStatusBadge(project.status)}
                      <span className={`project-priority-badge is-${priorityMeta.tone}`}>
                        {priorityMeta.label}
                      </span>
                    </div>
                    <div className="project-card-actions">
                      <button
                        type="button"
                        className={`favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(project.projectId);
                        }}
                        aria-label="Favoritar projeto"
                        aria-pressed={favoriteIds.has(project.projectId)}
                      >
                        <Star aria-hidden="true" />
                      </button>
                      <div className="project-card-menu">
                        <button
                          type="button"
                          className="project-card-menu-trigger"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === project.projectId}
                          aria-label="Abrir menu de acoes"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleMenu(project.projectId);
                          }}
                        >
                          ...
                        </button>
                        {openMenuId === project.projectId && (
                          <div
                            className="project-card-menu-dropdown"
                            role="menu"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="project-card-menu-item"
                              onClick={() => handleEnterProject(project.projectId)}
                            >
                              Entrar
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="project-card-menu-item"
                              onClick={() => handleEditProject(project)}
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </header>

                  <div className="project-card-body">
                    <h3 className="project-card-title">{project.projectName}</h3>
                    <p className="project-card-description">{description}</p>
                  </div>

                  <div className="project-card-progress">
                    <div className="project-card-progress-header">
                      <div className="project-card-progress-title">
                        <TrendingUp className="project-card-progress-icon" aria-hidden="true" />
                        <span>Progresso</span>
                      </div>
                      <span className="project-card-progress-value">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="project-card-summary">
                    <div className="project-card-summary-item">
                      <ListChecks className="project-card-summary-icon" aria-hidden="true" />
                      <span>{tasksLabel}</span>
                    </div>
                    <div className={`project-card-summary-item ${overdueSummaryClass}`.trim()}>
                      <Calendar className="project-card-summary-icon" aria-hidden="true" />
                      <span>{overdueLabel}</span>
                    </div>
                  </div>

                  <div className="project-card-metrics">
                    <div className="project-card-metric">
                      <span>Orcamento</span>
                      <strong className={budgetLabel === "-" ? "is-muted" : ""}>{budgetLabel}</strong>
                    </div>
                    <div className="project-card-metric">
                      <span>Dias</span>
                      <strong className={durationLabel === "-" ? "is-muted" : ""}>{durationLabel}</strong>
                    </div>
                  </div>

                  <div className={`project-card-timeline ${timelineHasDates ? "" : "is-empty"}`}>
                    <span className="timeline-date">{formatTimelineDate(project.startDate)}</span>
                    <div className="timeline-line">
                      <span className="timeline-line-fill" style={{ width: timelinePosition }} />
                      <span className="timeline-dot" style={{ left: timelinePosition }} />
                    </div>
                    <span className="timeline-date">{formatTimelineDate(project.endDate)}</span>
                  </div>

                  <footer className="project-card-footer">
                    <div className="project-card-members">
                      <div className="project-card-avatars">
                        {displayMembers.length > 0 ? (
                          <>
                            {displayMembers.map((member, index) => (
                              <span key={`${project.projectId}-member-${index}`} className="project-card-avatar">
                                {getMemberInitials(member || "M")}
                              </span>
                            ))}
                            {extraMembers > 0 && (
                              <span className="project-card-avatar is-more">+{extraMembers}</span>
                            )}
                          </>
                        ) : (
                          <span className="project-card-avatar is-empty">-</span>
                        )}
                      </div>
                      <span className="project-card-manager">Gerente: {managerName}</span>
                    </div>
                    <button
                      type="button"
                      className="link-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectProject?.(project.projectId);
                        onViewProjectDetails?.(project.projectId);
                      }}
                    >
                      Ver detalhes
                    </button>
                  </footer>
                </div>
                <div className="project-card-legacy">
                  <header className="project-card-header">
                  <div>
                    <h3 className="project-card-title">{project.projectName}</h3>
                    <p className="project-card-client">
                      {project.clientName ? `Cliente: ${project.clientName}` : "Cliente não informado"}
                    </p>
                  </div>
                  <div className="project-card-actions">
                    {renderStatusBadge(project.status)}
                    <button
                      type="button"
                      className={`favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(project.projectId);
                      }}
                      aria-label="Favoritar projeto"
                    >
                      ★
                    </button>
                  </div>
                </header>

                <div className="project-card-progress">
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="progress-value">{progress}%</span>
                </div>

                <div className="project-card-stats">
                  <span className="project-card-meta-label">
                    Responsável: {project.responsibleName ?? "Não definido"}
                  </span>
                  <span className="project-card-meta-label">
                    {tasksDone}/{tasksTotal} tarefas • {durationLabel} do projeto
                  </span>
                </div>

                <footer className="project-card-footer">
                  <div className="project-card-deadline">
                    {formatDisplayDate(project.startDate)} — {formatDisplayDate(project.endDate)}
                  </div>
                  <button
                    type="button"
                    className="link-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectProject?.(project.projectId);
                      onViewProjectDetails?.(project.projectId);
                    }}
                  >
                    Ver detalhes
                  </button>
                </footer>
                </div>
              </article>
            );
          })}
        </section>
      );
    }

    return (
      <section className="projects-table-card">
        <div className="project-table__wrapper">
          <table className="project-table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Progresso</th>
                <th>Dias</th>
                <th>Período</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const progress = calcProgress(project.tasksDone, project.tasksTotal);
                const durationDays = getProjectDurationDays(project);
                const durationLabel =
                  typeof durationDays === "number"
                    ? `${durationDays} dia${durationDays === 1 ? "" : "s"}`
                    : "-";
                const priorityCandidate =
                  project.priority ??
                  (project as { priorityLevel?: string | null }).priorityLevel ??
                  (project as { priorityLabel?: string | null }).priorityLabel ??
                  null;
                const priorityMeta = getPriorityMeta(priorityCandidate);
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
                      <small>{priorityMeta.label}</small>
                    </td>
                    <td>{renderStatusBadge(project.status)}</td>
                    <td>{project.clientName ?? "-"}</td>
                    <td>{project.responsibleName ?? "-"}</td>
                    <td>
                      <div className="table-progress">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <small>{progress}%</small>
                    </td>
                    <td>{durationLabel}</td>
                    <td>
                      {formatDisplayDate(project.startDate)} - {formatDisplayDate(project.endDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="projects-content" aria-label="Listagem de projetos" aria-busy={isLoading}>
      <section className="projects-kpi-grid" aria-label="Resumo do portfolio">
        {kpiItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className="projects-kpi-card">
              <div className={`projects-kpi-icon is-${item.tone}`}>
                <Icon aria-hidden="true" />
              </div>
              <div>
                <div className="projects-kpi-value">{item.value}</div>
                <div className="projects-kpi-label">{item.label}</div>
              </div>
            </article>
          );
        })}
      </section>
      <section
        className="projects-kpi-grid projects-kpi-grid--priority"
        aria-label="Prioridade dos projetos"
      >
        {priorityItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className="projects-kpi-card">
              <div className={`projects-kpi-icon is-${item.tone}`}>
                <Icon aria-hidden="true" />
              </div>
              <div>
                <div className="projects-kpi-value">{item.value}</div>
                <div className="projects-kpi-label">{item.label}</div>
              </div>
            </article>
          );
        })}
      </section>
      <section className="projects-filters-card">
        <div className="projects-filters-modern">
          <div className="projects-filters-bar">
            <div className="projects-filters-row projects-filters-row--search">
              <label className="projects-filter-field projects-filter-search">
                <span>Buscar projetos</span>
                <input
                  type="search"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>
            <div className="projects-filters-row projects-filters-row--controls">
              <div className="projects-filters-left">
                <label className="projects-filter-field">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {chipStatusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="projects-filter-field">
                  <span>Cliente</span>
                  <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                    <option value="all">Todos</option>
                    {clientOptions.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="projects-filter-field">
                  <span>Responsavel</span>
                  <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                    <option value="all">Todos</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="projects-filter-field">
                  <span>Tags</span>
                  <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                    <option value="all">Todas</option>
                    {tagOptions.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="projects-filter-field">
                  <span>Favoritos</span>
                  <select
                    value={showOnlyFavorites ? "favorites" : "all"}
                    onChange={(event) => setShowOnlyFavorites(event.target.value === "favorites")}
                  >
                    <option value="all">Todos</option>
                    <option value="favorites">Somente favoritos</option>
                  </select>
                </label>
              </div>
              <div className="projects-filters-right">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onExport}
                  disabled={!onExport || !projects.length}
                >
                  Exportar portfolio
                </button>
                <div className="projects-view-toggle" role="group" aria-label="Trocar visualizacao">
                  <button
                    type="button"
                    className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                    onClick={() => setViewMode("cards")}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    Tabela
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="projects-filters-legacy">
        <div className="projects-filters-chips">
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

        <div className="projects-filters-row">
          <div className="projects-filters-controls">
            <label className="projects-filter-field">
              <span>Cliente</span>
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                <option value="all">Todos</option>
                {clientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </label>
            <label className="projects-filter-field">
              <span>Responsável</span>
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                <option value="all">Todos</option>
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </label>
            <label className="projects-filter-field">
              <span>Tags</span>
              <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="all">Todas</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="projects-filter-field projects-filter-search">
              <span>Busca</span>
              <input
                type="search"
                placeholder="Projeto, cliente ou tag..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>

          <div className="projects-filters-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onExport}
              disabled={!onExport || !projects.length}
            >
              Exportar portfólio
            </button>
            <div className="projects-view-toggle" role="group" aria-label="Trocar visualização">
              <button
                type="button"
                className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                onClick={() => setViewMode("cards")}
              >
                Cards
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>

      {error && (
        <p className="error-text" role="status" aria-live="assertive">
          {error}
        </p>
      )}

      {renderList()}
    </div>
  );
};
