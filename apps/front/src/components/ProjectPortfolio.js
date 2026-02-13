import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Folder, ListChecks, Minus, PauseCircle, PlayCircle, Star, TrendingDown, TrendingUp } from "lucide-react";
const statusMap = {
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
const priorityMap = {
    LOW: { label: "Baixa", tone: "neutral" },
    BAIXA: { label: "Baixa", tone: "neutral" },
    MEDIUM: { label: "Média", tone: "info" },
    MEDIA: { label: "Média", tone: "info" },
    "MÉDIA": { label: "Média", tone: "info" },
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
const normalizeStatus = (status) => (status ?? "").trim().toUpperCase();
const getProjectStatusValue = (project) => project.status ?? project.statusLabel ?? project.projectStatus ?? null;
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const isCompletedStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["DONE", "COMPLETED", "FINALIZADO", "CONCLUIDO", "CONCLUÍDO"].includes(normalized);
};
const isInProgressStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["IN_PROGRESS", "ACTIVE", "EM ANDAMENTO", "EM_ANDAMENTO"].includes(normalized);
};
const isPausedStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["ON_HOLD", "PAUSED", "PAUSADO"].includes(normalized);
};
const isPlannedStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["PLANNED", "PLANNING", "PLANEJADO", "PLANEJAMENTO", "NAO INICIADO", "NÃO INICIADO", "NAO_INICIADO"].includes(normalized);
};
const isRiskStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["AT_RISK", "BLOCKED", "EM RISCO", "RISCO"].includes(normalized);
};
const isLateStatus = (status) => {
    const normalized = normalizeStatus(status);
    return ["DELAYED", "LATE", "OVERDUE", "ATRASADO"].includes(normalized);
};
const isCanceledStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === "CANCELED" || normalized === "CANCELADO";
};
const getStartOfDay = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate()).getTime();
};
const getTodayStart = () => getStartOfDay(new Date()) ?? Date.now();
const formatCurrency = (value) => {
    if (typeof value !== "number" || Number.isNaN(value))
        return "-";
    return currencyFormatter.format(value);
};
const getPriorityMeta = (priority) => {
    const normalized = (priority ?? "").trim().toUpperCase();
    if (!normalized)
        return priorityMap.MEDIUM;
    return priorityMap[normalized] ?? { label: priority ?? "Media", tone: "neutral" };
};
const normalizeProjectPriorityKey = (priority) => {
    const normalized = (priority ?? "").trim().toUpperCase();
    if (["URGENT", "URGENTE", "CRITICAL"].includes(normalized))
        return "CRITICAL";
    if (["HIGH", "ALTA"].includes(normalized))
        return "HIGH";
    if (["LOW", "BAIXA"].includes(normalized))
        return "LOW";
    if (["MEDIUM", "MEDIA"].includes(normalized))
        return "MEDIUM";
    return "MEDIUM";
};
const getOverdueDays = (project, todayStart) => {
    if (!project.endDate)
        return null;
    const endStart = getStartOfDay(project.endDate);
    if (!endStart)
        return null;
    const statusValue = getProjectStatusValue(project);
    if (isCompletedStatus(statusValue) || isCanceledStatus(statusValue))
        return 0;
    const diff = Math.floor((todayStart - endStart) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};
const isLateProject = (project, todayStart) => {
    if (isLateStatus(getProjectStatusValue(project)))
        return true;
    const overdue = getOverdueDays(project, todayStart);
    return typeof overdue === "number" && overdue > 0;
};
const getProjectDurationDays = (project) => {
    const start = project.startDate ? getStartOfDay(project.startDate) : null;
    const end = project.endDate ? getStartOfDay(project.endDate) : null;
    if (start === null || end === null)
        return null;
    const diff = Math.round((end - start) / MS_IN_DAY);
    return diff >= 0 ? diff : null;
};
const getMemberInitials = (value) => {
    const trimmed = value.trim();
    if (!trimmed)
        return "";
    const parts = trimmed.replace(/[@._-]+/g, " ").split(/\s+/).filter(Boolean);
    if (!parts.length)
        return trimmed.slice(0, 2).toUpperCase();
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
const getTeamMembers = (project) => {
    if (Array.isArray(project.teamMembers))
        return project.teamMembers;
    const members = project.members;
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
const formatDisplayDate = (value) => {
    if (!value)
        return "-";
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return "-";
        const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return safeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    }
    catch {
        return "-";
    }
};
const formatTimelineDate = (value) => {
    if (!value)
        return "-";
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return "-";
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
    }
    catch {
        return "-";
    }
};
const calcProgress = (done, total) => {
    if (!total || total === 0)
        return 0;
    if (!done)
        return 0;
    return Math.min(100, Math.round((done / total) * 100));
};
const getTimelineProgress = (project, todayStart) => {
    const start = project.startDate ? getStartOfDay(project.startDate) : null;
    const end = project.endDate ? getStartOfDay(project.endDate) : null;
    if (!start || !end || end <= start)
        return null;
    const elapsed = todayStart - start;
    const total = end - start;
    return Math.min(1, Math.max(0, elapsed / total));
};
const renderStatusBadge = (status) => {
    if (!status)
        return _jsx("span", { className: "project-status-badge project-status-neutral", children: "Sem status" });
    const normalized = status.toUpperCase();
    const metadata = statusMap[normalized] ?? { label: normalized, tone: "neutral" };
    return _jsx("span", { className: `project-status-badge project-status-${metadata.tone}`, children: metadata.label });
};
export const ProjectPortfolio = ({ projects, error, isLoading = false, onExport, selectedProjectId, onSelectProject, onCreateProject, onViewProjectDetails, onEditProject, onTrashProject }) => {
    const [viewMode, setViewMode] = useState("cards");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [openMenuId, setOpenMenuId] = useState(null);
    const clientOptions = useMemo(() => {
        const values = new Set();
        projects.forEach((project) => {
            if (project.clientName?.trim())
                values.add(project.clientName.trim());
        });
        return Array.from(values);
    }, [projects]);
    const ownerOptions = useMemo(() => {
        const values = new Set();
        projects.forEach((project) => {
            if (project.responsibleName?.trim())
                values.add(project.responsibleName.trim());
        });
        return Array.from(values);
    }, [projects]);
    const tagOptions = useMemo(() => {
        const values = new Set();
        projects.forEach((project) => {
            (project.tags ?? []).forEach((tag) => {
                if (tag)
                    values.add(tag);
            });
        });
        return Array.from(values);
    }, [projects]);
    const todayStart = getTodayStart();
    const kpiStats = useMemo(() => {
        return projects.reduce((acc, project) => {
            const status = normalizeStatus(getProjectStatusValue(project));
            if (isInProgressStatus(status))
                acc.inProgress += 1;
            if (isCompletedStatus(status))
                acc.completed += 1;
            if (isPausedStatus(status))
                acc.paused += 1;
            if (isLateProject(project, todayStart))
                acc.late += 1;
            return acc;
        }, {
            total: projects.length,
            inProgress: 0,
            completed: 0,
            paused: 0,
            late: 0
        });
    }, [projects, todayStart]);
    const priorityStats = useMemo(() => projects.reduce((acc, project) => {
        const key = normalizeProjectPriorityKey(project.priority);
        acc[key] += 1;
        return acc;
    }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }), [projects]);
    const filteredProjects = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return projects.filter((project) => {
            const normalizedStatus = normalizeStatus(getProjectStatusValue(project));
            const matchesStatus = (() => {
                if (statusFilter === "all")
                    return true;
                if (statusFilter === "IN_PROGRESS")
                    return isInProgressStatus(normalizedStatus);
                if (statusFilter === "DONE")
                    return isCompletedStatus(normalizedStatus);
                if (statusFilter === "PLANNED")
                    return isPlannedStatus(normalizedStatus);
                if (statusFilter === "PAUSED")
                    return isPausedStatus(normalizedStatus);
                if (statusFilter === "LATE")
                    return isLateProject(project, todayStart);
                if (statusFilter === "AT_RISK")
                    return isRiskStatus(normalizedStatus);
                return normalizedStatus === statusFilter;
            })();
            const matchesClient = clientFilter === "all" || project.clientName === clientFilter;
            const matchesOwner = ownerFilter === "all" || project.responsibleName === ownerFilter;
            const matchesTag = tagFilter === "all" || (project.tags ?? []).includes(tagFilter);
            const matchesFavorites = !showOnlyFavorites || favoriteIds.has(project.projectId);
            const matchesSearch = !normalizedSearch ||
                [project.projectName, project.code, project.clientName, project.responsibleName, ...(project.tags ?? [])]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);
            return matchesStatus && matchesClient && matchesOwner && matchesTag && matchesFavorites && matchesSearch;
        });
    }, [projects, statusFilter, clientFilter, ownerFilter, tagFilter, showOnlyFavorites, favoriteIds, searchTerm]);
    const hasActiveFilters = statusFilter !== "all" ||
        clientFilter !== "all" ||
        ownerFilter !== "all" ||
        tagFilter !== "all" ||
        showOnlyFavorites ||
        searchTerm.trim().length > 0;
    const clearFilters = () => {
        setStatusFilter("all");
        setClientFilter("all");
        setOwnerFilter("all");
        setTagFilter("all");
        setShowOnlyFavorites(false);
        setSearchTerm("");
    };
    const toggleFavorite = (projectId) => {
        setFavoriteIds((current) => {
            const next = new Set(current);
            if (next.has(projectId)) {
                next.delete(projectId);
            }
            else {
                next.add(projectId);
            }
            return next;
        });
    };
    const toggleMenu = (projectId) => {
        setOpenMenuId((current) => (current === projectId ? null : projectId));
    };
    const handleEnterProject = (projectId) => {
        setOpenMenuId(null);
        onSelectProject?.(projectId);
    };
    const handleEditProject = (project) => {
        setOpenMenuId(null);
        onEditProject?.(project);
    };
    const handleTrashProject = (projectId) => {
        setOpenMenuId(null);
        onTrashProject?.(projectId);
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
            return (_jsx("div", { className: "projects-grid", "aria-live": "polite", children: [0, 1, 2].map((index) => (_jsxs("article", { className: "project-card skeleton-card", children: [_jsx("div", { className: "skeleton skeleton-pill" }), _jsx("div", { className: "skeleton skeleton-title" }), _jsx("div", { className: "skeleton skeleton-text" }), _jsx("div", { className: "skeleton skeleton-progress" })] }, index))) }));
        }
        if (!filteredProjects.length) {
            return _jsx("p", { className: "muted empty-state", children: emptyState });
        }
        if (viewMode === "cards") {
            return (_jsx("section", { className: "projects-grid", children: filteredProjects.map((project) => {
                    const progress = calcProgress(project.tasksDone, project.tasksTotal);
                    const isActive = selectedProjectId === project.projectId;
                    const tasksTotal = project.tasksTotal ?? 0;
                    const tasksDone = project.tasksDone ?? 0;
                    const overdueDays = getOverdueDays(project, todayStart);
                    const overdueSummaryClass = overdueDays === null ? "is-muted" : overdueDays > 0 ? "is-danger" : "";
                    const overdueLabel = overdueDays === null ? "Sem prazo" : overdueDays > 0 ? `${overdueDays}d atrasado` : "No prazo";
                    const tasksLabel = `${tasksDone}/${tasksTotal} tarefa${tasksTotal === 1 ? "" : "s"}`;
                    const budgetCandidate = project.budget;
                    const budgetValue = typeof budgetCandidate === "number"
                        ? budgetCandidate
                        : typeof budgetCandidate === "string"
                            ? Number(budgetCandidate)
                            : null;
                    const budgetLabel = formatCurrency(budgetValue);
                    const description = project.description?.trim() || project.clientName?.trim() || project.code?.trim() || "-";
                    const priorityCandidate = project.priority ??
                        project.priorityLevel ??
                        project.priorityLabel ??
                        null;
                    const priorityMeta = getPriorityMeta(priorityCandidate);
                    const teamMembers = getTeamMembers(project);
                    const membersCount = typeof project.membersCount === "number" ? project.membersCount : teamMembers.length;
                    const displayMembers = teamMembers.length > 0
                        ? teamMembers.slice(0, 4)
                        : membersCount > 0
                            ? Array.from({ length: Math.min(4, membersCount) }, () => "")
                            : [];
                    const extraMembers = teamMembers.length > 4 ? teamMembers.length - 4 : membersCount > 4 ? membersCount - 4 : 0;
                    const managerName = project.responsibleName ?? "-";
                    const durationDays = getProjectDurationDays(project);
                    const durationLabel = typeof durationDays === "number"
                        ? `${durationDays} dia${durationDays === 1 ? "" : "s"}`
                        : "-";
                    const timelineProgress = getTimelineProgress(project, todayStart);
                    const timelinePosition = `${Math.round((timelineProgress ?? 0) * 100)}%`;
                    const timelineHasDates = timelineProgress !== null;
                    return (_jsxs("article", { className: `project-card project-card--elevated ${isActive ? "is-active" : ""}`, onClick: () => {
                            setOpenMenuId(null);
                            onSelectProject?.(project.projectId);
                        }, role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setOpenMenuId(null);
                                onSelectProject?.(project.projectId);
                            }
                        }, children: [_jsxs("div", { className: "project-card-layout", children: [_jsxs("header", { className: "project-card-top", children: [_jsxs("div", { className: "project-card-badges", children: [renderStatusBadge(getProjectStatusValue(project)), _jsx("span", { className: `project-priority-badge is-${priorityMeta.tone}`, children: priorityMeta.label })] }), _jsxs("div", { className: "project-card-actions", children: [_jsx("button", { type: "button", className: `favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`, onClick: (event) => {
                                                            event.stopPropagation();
                                                            toggleFavorite(project.projectId);
                                                        }, "aria-label": "Favoritar projeto", "aria-pressed": favoriteIds.has(project.projectId), children: _jsx(Star, { "aria-hidden": "true" }) }), _jsxs("div", { className: "project-card-menu", children: [_jsx("button", { type: "button", className: "project-card-menu-trigger", "aria-haspopup": "menu", "aria-expanded": openMenuId === project.projectId, "aria-label": "Abrir menu de acoes", onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    toggleMenu(project.projectId);
                                                                }, children: "..." }), openMenuId === project.projectId && (_jsxs("div", { className: "project-card-menu-dropdown", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", className: "project-card-menu-item", onClick: () => handleEnterProject(project.projectId), children: "Entrar" }), _jsx("button", { type: "button", role: "menuitem", className: "project-card-menu-item", onClick: () => handleEditProject(project), children: "Editar" }), onTrashProject && (_jsx("button", { type: "button", role: "menuitem", className: "project-card-menu-item", onClick: () => handleTrashProject(project.projectId), children: "Excluir" }))] }))] })] })] }), _jsxs("div", { className: "project-card-body", children: [_jsx("h3", { className: "project-card-title", children: project.projectName }), _jsx("p", { className: "project-card-description", children: description })] }), _jsxs("div", { className: "project-card-progress", children: [_jsxs("div", { className: "project-card-progress-header", children: [_jsxs("div", { className: "project-card-progress-title", children: [_jsx(TrendingUp, { className: "project-card-progress-icon", "aria-hidden": "true" }), _jsx("span", { children: "Progresso" })] }), _jsxs("span", { className: "project-card-progress-value", children: [progress, "%"] })] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${progress}%` } }) })] }), _jsxs("div", { className: "project-card-summary", children: [_jsxs("div", { className: "project-card-summary-item", children: [_jsx(ListChecks, { className: "project-card-summary-icon", "aria-hidden": "true" }), _jsx("span", { children: tasksLabel })] }), _jsxs("div", { className: `project-card-summary-item ${overdueSummaryClass}`.trim(), children: [_jsx(Calendar, { className: "project-card-summary-icon", "aria-hidden": "true" }), _jsx("span", { children: overdueLabel })] })] }), _jsxs("div", { className: "project-card-metrics", children: [_jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Orcamento" }), _jsx("strong", { className: budgetLabel === "-" ? "is-muted" : "", children: budgetLabel })] }), _jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Dias" }), _jsx("strong", { className: durationLabel === "-" ? "is-muted" : "", children: durationLabel })] })] }), _jsxs("div", { className: `project-card-timeline ${timelineHasDates ? "" : "is-empty"}`, children: [_jsx("span", { className: "timeline-date", children: formatTimelineDate(project.startDate) }), _jsxs("div", { className: "timeline-line", children: [_jsx("span", { className: "timeline-line-fill", style: { width: timelinePosition } }), _jsx("span", { className: "timeline-dot", style: { left: timelinePosition } })] }), _jsx("span", { className: "timeline-date", children: formatTimelineDate(project.endDate) })] }), _jsxs("footer", { className: "project-card-footer", children: [_jsxs("div", { className: "project-card-members", children: [_jsx("div", { className: "project-card-avatars", children: displayMembers.length > 0 ? (_jsxs(_Fragment, { children: [displayMembers.map((member, index) => (_jsx("span", { className: "project-card-avatar", children: getMemberInitials(member || "M") }, `${project.projectId}-member-${index}`))), extraMembers > 0 && (_jsxs("span", { className: "project-card-avatar is-more", children: ["+", extraMembers] }))] })) : (_jsx("span", { className: "project-card-avatar is-empty", children: "-" })) }), _jsxs("span", { className: "project-card-manager", children: ["Gerente: ", managerName] })] }), _jsx("button", { type: "button", className: "link-button", onClick: (event) => {
                                                    event.stopPropagation();
                                                    onSelectProject?.(project.projectId);
                                                    onViewProjectDetails?.(project.projectId);
                                                }, children: "Ver detalhes" })] })] }), _jsxs("div", { className: "project-card-legacy", children: [_jsxs("header", { className: "project-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "project-card-title", children: project.projectName }), _jsx("p", { className: "project-card-client", children: project.clientName ? `Cliente: ${project.clientName}` : "Cliente não informado" })] }), _jsxs("div", { className: "project-card-actions", children: [renderStatusBadge(getProjectStatusValue(project)), _jsx("button", { type: "button", className: `favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`, onClick: (event) => {
                                                            event.stopPropagation();
                                                            toggleFavorite(project.projectId);
                                                        }, "aria-label": "Favoritar projeto", children: "\u2605" })] })] }), _jsxs("div", { className: "project-card-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${progress}%` } }) }), _jsxs("span", { className: "progress-value", children: [progress, "%"] })] }), _jsxs("div", { className: "project-card-stats", children: [_jsxs("span", { className: "project-card-meta-label", children: ["Respons\u00E1vel: ", project.responsibleName ?? "Não definido"] }), _jsxs("span", { className: "project-card-meta-label", children: [tasksDone, "/", tasksTotal, " tarefas \u2022 ", durationLabel, " do projeto"] })] }), _jsxs("footer", { className: "project-card-footer", children: [_jsxs("div", { className: "project-card-deadline", children: [formatDisplayDate(project.startDate), " \u2014 ", formatDisplayDate(project.endDate)] }), _jsx("button", { type: "button", className: "link-button", onClick: (event) => {
                                                    event.stopPropagation();
                                                    onSelectProject?.(project.projectId);
                                                    onViewProjectDetails?.(project.projectId);
                                                }, children: "Ver detalhes" })] })] })] }, project.projectId));
                }) }));
        }
        return (_jsx("section", { className: "projects-table-card", children: _jsx("div", { className: "project-table__wrapper", children: _jsxs("table", { className: "project-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Projeto" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Cliente" }), _jsx("th", { children: "Respons\u00E1vel" }), _jsx("th", { children: "Progresso" }), _jsx("th", { children: "Dias" }), _jsx("th", { children: "Per\u00EDodo" })] }) }), _jsx("tbody", { children: filteredProjects.map((project) => {
                                const progress = calcProgress(project.tasksDone, project.tasksTotal);
                                const durationDays = getProjectDurationDays(project);
                                const durationLabel = typeof durationDays === "number"
                                    ? `${durationDays} dia${durationDays === 1 ? "" : "s"}`
                                    : "-";
                                const priorityCandidate = project.priority ??
                                    project.priorityLevel ??
                                    project.priorityLabel ??
                                    null;
                                const priorityMeta = getPriorityMeta(priorityCandidate);
                                return (_jsxs("tr", { className: selectedProjectId === project.projectId ? "is-active" : "", onClick: () => onSelectProject?.(project.projectId), role: "button", tabIndex: 0, onKeyDown: (event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onSelectProject?.(project.projectId);
                                        }
                                    }, children: [_jsxs("td", { children: [_jsx("strong", { children: project.projectName }), _jsx("small", { children: priorityMeta.label })] }), _jsx("td", { children: renderStatusBadge(getProjectStatusValue(project)) }), _jsx("td", { children: project.clientName ?? "-" }), _jsx("td", { children: project.responsibleName ?? "-" }), _jsxs("td", { children: [_jsx("div", { className: "table-progress", children: _jsx("span", { style: { width: `${progress}%` } }) }), _jsxs("small", { children: [progress, "%"] })] }), _jsx("td", { children: durationLabel }), _jsxs("td", { children: [formatDisplayDate(project.startDate), " - ", formatDisplayDate(project.endDate)] })] }, project.projectId));
                            }) })] }) }) }));
    };
    return (_jsxs("div", { className: "projects-content", "aria-label": "Listagem de projetos", "aria-busy": isLoading, children: [_jsx("section", { className: "projects-kpi-grid", "aria-label": "Resumo do portfolio", children: kpiItems.map((item) => {
                    const Icon = item.icon;
                    return (_jsxs("article", { className: "projects-kpi-card", children: [_jsx("div", { className: `projects-kpi-icon is-${item.tone}`, children: _jsx(Icon, { "aria-hidden": "true" }) }), _jsxs("div", { children: [_jsx("div", { className: "projects-kpi-value", children: item.value }), _jsx("div", { className: "projects-kpi-label", children: item.label })] })] }, item.id));
                }) }), _jsx("section", { className: "projects-kpi-grid projects-kpi-grid--priority", "aria-label": "Prioridade dos projetos", children: priorityItems.map((item) => {
                    const Icon = item.icon;
                    return (_jsxs("article", { className: "projects-kpi-card", children: [_jsx("div", { className: `projects-kpi-icon is-${item.tone}`, children: _jsx(Icon, { "aria-hidden": "true" }) }), _jsxs("div", { children: [_jsx("div", { className: "projects-kpi-value", children: item.value }), _jsx("div", { className: "projects-kpi-label", children: item.label })] })] }, item.id));
                }) }), _jsxs("section", { className: "projects-filters-card", children: [_jsx("div", { className: "projects-filters-modern", children: _jsxs("div", { className: "projects-filters-bar", children: [_jsx("div", { className: "projects-filters-row projects-filters-row--search", children: _jsxs("label", { className: "projects-filter-field projects-filter-search", children: [_jsx("span", { children: "Buscar projetos" }), _jsx("input", { type: "search", placeholder: "Buscar projetos...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }) }), _jsxs("div", { className: "projects-filters-row projects-filters-row--controls", children: [_jsxs("div", { className: "projects-filters-left", children: [_jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Status" }), _jsx("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: chipStatusOptions.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id))) })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Cliente" }), _jsxs("select", { value: clientFilter, onChange: (event) => setClientFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), clientOptions.map((client) => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Responsavel" }), _jsxs("select", { value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), ownerOptions.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Tags" }), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todas" }), tagOptions.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Favoritos" }), _jsxs("select", { value: showOnlyFavorites ? "favorites" : "all", onChange: (event) => setShowOnlyFavorites(event.target.value === "favorites"), children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "favorites", children: "Somente favoritos" })] })] })] }), _jsxs("div", { className: "projects-filters-right", children: [_jsxs("div", { className: "projects-filters-feedback", role: "status", "aria-live": "polite", children: [_jsxs("span", { children: [filteredProjects.length, " de ", projects.length, " projeto", projects.length === 1 ? "" : "s"] }), hasActiveFilters && (_jsx("button", { type: "button", className: "link-button", onClick: clearFilters, children: "Limpar filtros" }))] }), _jsx("button", { type: "button", className: "btn-secondary", onClick: onExport, disabled: !onExport || !projects.length, children: "Exportar portfolio" }), _jsxs("div", { className: "projects-view-toggle", role: "group", "aria-label": "Trocar visualizacao", children: [_jsx("button", { type: "button", className: `toggle-btn ${viewMode === "cards" ? "active" : ""}`, onClick: () => setViewMode("cards"), children: "Cards" }), _jsx("button", { type: "button", className: `toggle-btn ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Tabela" })] })] })] })] }) }), _jsxs("div", { className: "projects-filters-legacy", children: [_jsxs("div", { className: "projects-filters-chips", children: [chipStatusOptions.map((option) => (_jsx("button", { type: "button", className: `filter-chip ${statusFilter === option.id ? "is-active" : ""}`, onClick: () => setStatusFilter(option.id), children: option.label }, option.id))), _jsx("button", { type: "button", className: `filter-chip ${showOnlyFavorites ? "is-active" : ""}`, onClick: () => setShowOnlyFavorites((value) => !value), children: "Favoritos" })] }), _jsxs("div", { className: "projects-filters-row", children: [_jsxs("div", { className: "projects-filters-controls", children: [_jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Cliente" }), _jsxs("select", { value: clientFilter, onChange: (event) => setClientFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), clientOptions.map((client) => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Respons\u00E1vel" }), _jsxs("select", { value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), ownerOptions.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Tags" }), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todas" }), tagOptions.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] }), _jsxs("label", { className: "projects-filter-field projects-filter-search", children: [_jsx("span", { children: "Busca" }), _jsx("input", { type: "search", placeholder: "Projeto, cliente ou tag...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] })] }), _jsxs("div", { className: "projects-filters-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onExport, disabled: !onExport || !projects.length, children: "Exportar portf\u00F3lio" }), _jsxs("div", { className: "projects-view-toggle", role: "group", "aria-label": "Trocar visualiza\u00E7\u00E3o", children: [_jsx("button", { type: "button", className: `toggle-btn ${viewMode === "cards" ? "active" : ""}`, onClick: () => setViewMode("cards"), children: "Cards" }), _jsx("button", { type: "button", className: `toggle-btn ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Tabela" })] })] })] })] })] }), error && (_jsx("p", { className: "error-text", role: "status", "aria-live": "assertive", children: error })), renderList()] }));
};
