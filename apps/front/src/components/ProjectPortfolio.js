import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Folder, PauseCircle, PlayCircle, Star } from "lucide-react";
const statusMap = {
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
const priorityMap = {
    LOW: { label: "Baixa", tone: "neutral" },
    BAIXA: { label: "Baixa", tone: "neutral" },
    MEDIUM: { label: "Media", tone: "info" },
    MEDIA: { label: "Media", tone: "info" },
    HIGH: { label: "Alta", tone: "warning" },
    ALTA: { label: "Alta", tone: "warning" },
    URGENT: { label: "Urgente", tone: "danger" },
    URGENTE: { label: "Urgente", tone: "danger" }
};
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
});
const normalizeStatus = (status) => (status ?? "").toUpperCase();
const isCompletedStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === "DONE" || normalized === "COMPLETED";
};
const isInProgressStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized === "IN_PROGRESS" || normalized === "ACTIVE";
};
const isPausedStatus = (status) => normalizeStatus(status) === "ON_HOLD";
const isCanceledStatus = (status) => normalizeStatus(status) === "CANCELED";
const getStartOfDay = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};
const getTodayStart = () => getStartOfDay(new Date()) ?? Date.now();
const formatCurrency = (value) => {
    if (typeof value !== "number" || Number.isNaN(value))
        return "-";
    return currencyFormatter.format(value);
};
const getPriorityMeta = (priority) => {
    if (!priority)
        return null;
    const normalized = priority.trim().toUpperCase();
    return priorityMap[normalized] ?? { label: priority, tone: "neutral" };
};
const getOverdueDays = (project, todayStart) => {
    if (!project.endDate)
        return null;
    const endStart = getStartOfDay(project.endDate);
    if (!endStart)
        return null;
    if (isCompletedStatus(project.status) || isCanceledStatus(project.status))
        return 0;
    const diff = Math.floor((todayStart - endStart) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};
const isLateProject = (project, todayStart) => {
    const overdue = getOverdueDays(project, todayStart);
    return typeof overdue === "number" && overdue > 0;
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
    { id: "IN_PROGRESS", label: "Em andamento" },
    { id: "DONE", label: "Concluídos" },
    { id: "AT_RISK", label: "Em risco" },
    { id: "PLANNED", label: "Planejados" }
];
const formatDisplayDate = (value) => {
    if (!value)
        return "-";
    try {
        return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
const renderStatusBadge = (status) => {
    if (!status)
        return _jsx("span", { className: "project-status-badge project-status-neutral", children: "Sem status" });
    const normalized = status.toUpperCase();
    const metadata = statusMap[normalized] ?? { label: normalized, tone: "neutral" };
    return _jsx("span", { className: `project-status-badge project-status-${metadata.tone}`, children: metadata.label });
};
export const ProjectPortfolio = ({ projects, error, isLoading = false, onExport, selectedProjectId, onSelectProject, onCreateProject, onViewProjectDetails, onEditProject }) => {
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
            const status = normalizeStatus(project.status);
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
    const filteredProjects = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return projects.filter((project) => {
            const normalizedStatus = project.status ?? "";
            const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
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
                    const overdueClass = overdueDays === null ? "is-muted" : overdueDays > 0 ? "is-danger" : "";
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
                    const risksOpen = project.risksOpen ?? 0;
                    return (_jsxs("article", { className: `project-card project-card--elevated ${isActive ? "is-active" : ""}`, onClick: () => {
                            setOpenMenuId(null);
                            onSelectProject?.(project.projectId);
                        }, role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setOpenMenuId(null);
                                onSelectProject?.(project.projectId);
                            }
                        }, children: [_jsxs("div", { className: "project-card-layout", children: [_jsxs("header", { className: "project-card-top", children: [_jsxs("div", { className: "project-card-badges", children: [renderStatusBadge(project.status), _jsx("span", { className: `project-priority-badge ${priorityMeta ? `is-${priorityMeta.tone}` : "is-muted"}`, children: priorityMeta?.label ?? "-" })] }), _jsxs("div", { className: "project-card-actions", children: [_jsx("button", { type: "button", className: `favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`, onClick: (event) => {
                                                            event.stopPropagation();
                                                            toggleFavorite(project.projectId);
                                                        }, "aria-label": "Favoritar projeto", "aria-pressed": favoriteIds.has(project.projectId), children: _jsx(Star, { "aria-hidden": "true" }) }), _jsxs("div", { className: "project-card-menu", children: [_jsx("button", { type: "button", className: "project-card-menu-trigger", "aria-haspopup": "menu", "aria-expanded": openMenuId === project.projectId, "aria-label": "Abrir menu de acoes", onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    toggleMenu(project.projectId);
                                                                }, children: "..." }), openMenuId === project.projectId && (_jsxs("div", { className: "project-card-menu-dropdown", role: "menu", onClick: (event) => event.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", className: "project-card-menu-item", onClick: () => handleEnterProject(project.projectId), children: "Entrar" }), _jsx("button", { type: "button", role: "menuitem", className: "project-card-menu-item", onClick: () => handleEditProject(project), children: "Editar" })] }))] })] })] }), _jsxs("div", { className: "project-card-body", children: [_jsx("h3", { className: "project-card-title", children: project.projectName }), _jsx("p", { className: "project-card-description", children: description })] }), _jsxs("div", { className: "project-card-progress", children: [_jsxs("div", { className: "project-card-progress-header", children: [_jsx("span", { children: "Progresso" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${progress}%` } }) })] }), _jsxs("div", { className: "project-card-metrics", children: [_jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Tarefas" }), _jsxs("strong", { children: [tasksDone, "/", tasksTotal] })] }), _jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Dias de atraso" }), _jsx("strong", { className: overdueClass, children: overdueDays ?? "-" })] }), _jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Orcamento" }), _jsx("strong", { className: budgetLabel === "-" ? "is-muted" : "", children: budgetLabel })] }), _jsxs("div", { className: "project-card-metric", children: [_jsx("span", { children: "Riscos" }), _jsx("strong", { children: risksOpen })] })] }), _jsxs("div", { className: "project-card-dates", children: [formatDisplayDate(project.startDate), " - ", formatDisplayDate(project.endDate)] }), _jsxs("footer", { className: "project-card-footer", children: [_jsxs("div", { className: "project-card-members", children: [_jsx("div", { className: "project-card-avatars", children: displayMembers.length > 0 ? (_jsxs(_Fragment, { children: [displayMembers.map((member, index) => (_jsx("span", { className: "project-card-avatar", children: getMemberInitials(member || "M") }, `${project.projectId}-member-${index}`))), extraMembers > 0 && (_jsxs("span", { className: "project-card-avatar is-more", children: ["+", extraMembers] }))] })) : (_jsx("span", { className: "project-card-avatar is-empty", children: "-" })) }), _jsxs("span", { className: "project-card-manager", children: ["Gerente: ", managerName] })] }), _jsx("button", { type: "button", className: "link-button", onClick: (event) => {
                                                    event.stopPropagation();
                                                    onSelectProject?.(project.projectId);
                                                    onViewProjectDetails?.(project.projectId);
                                                }, children: "Ver detalhes" })] })] }), _jsxs("div", { className: "project-card-legacy", children: [_jsxs("header", { className: "project-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "project-card-title", children: project.projectName }), _jsx("p", { className: "project-card-client", children: project.clientName ? `Cliente: ${project.clientName}` : "Cliente não informado" })] }), _jsxs("div", { className: "project-card-actions", children: [renderStatusBadge(project.status), _jsx("button", { type: "button", className: `favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`, onClick: (event) => {
                                                            event.stopPropagation();
                                                            toggleFavorite(project.projectId);
                                                        }, "aria-label": "Favoritar projeto", children: "\u2605" })] })] }), _jsxs("div", { className: "project-card-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${progress}%` } }) }), _jsxs("span", { className: "progress-value", children: [progress, "%"] })] }), _jsxs("div", { className: "project-card-stats", children: [_jsxs("span", { className: "project-card-meta-label", children: ["Respons\u00E1vel: ", project.responsibleName ?? "Não definido"] }), _jsxs("span", { className: "project-card-meta-label", children: [tasksDone, "/", tasksTotal, " tarefas \u2022 ", project.risksOpen ?? 0, " riscos abertos"] })] }), _jsxs("footer", { className: "project-card-footer", children: [_jsxs("div", { className: "project-card-deadline", children: [formatDisplayDate(project.startDate), " \u2014 ", formatDisplayDate(project.endDate)] }), _jsx("button", { type: "button", className: "link-button", onClick: (event) => {
                                                    event.stopPropagation();
                                                    onSelectProject?.(project.projectId);
                                                    onViewProjectDetails?.(project.projectId);
                                                }, children: "Ver detalhes" })] })] })] }, project.projectId));
                }) }));
        }
        return (_jsx("section", { className: "projects-table-card", children: _jsx("div", { className: "project-table__wrapper", children: _jsxs("table", { className: "project-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Projeto" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Cliente" }), _jsx("th", { children: "Respons\u00E1vel" }), _jsx("th", { children: "Progresso" }), _jsx("th", { children: "Riscos" }), _jsx("th", { children: "Horas" }), _jsx("th", { children: "Per\u00EDodo" })] }) }), _jsx("tbody", { children: filteredProjects.map((project) => {
                                const progress = calcProgress(project.tasksDone, project.tasksTotal);
                                const hoursValue = typeof project.hoursTracked === "number" ? project.hoursTracked : Number(project.hoursTracked ?? 0);
                                return (_jsxs("tr", { className: selectedProjectId === project.projectId ? "is-active" : "", onClick: () => onSelectProject?.(project.projectId), role: "button", tabIndex: 0, onKeyDown: (event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onSelectProject?.(project.projectId);
                                        }
                                    }, children: [_jsxs("td", { children: [_jsx("strong", { children: project.projectName }), _jsx("small", { children: project.tags?.slice(0, 2).join(" • ") || "Sem tags" })] }), _jsx("td", { children: renderStatusBadge(project.status) }), _jsx("td", { children: project.clientName ?? "-" }), _jsx("td", { children: project.responsibleName ?? "-" }), _jsxs("td", { children: [_jsx("div", { className: "table-progress", children: _jsx("span", { style: { width: `${progress}%` } }) }), _jsxs("small", { children: [progress, "%"] })] }), _jsx("td", { children: project.risksOpen ?? 0 }), _jsxs("td", { children: [hoursValue.toFixed(1), "h"] }), _jsxs("td", { children: [formatDisplayDate(project.startDate), " - ", formatDisplayDate(project.endDate)] })] }, project.projectId));
                            }) })] }) }) }));
    };
    return (_jsxs("div", { className: "projects-content", "aria-label": "Listagem de projetos", "aria-busy": isLoading, children: [_jsx("section", { className: "projects-kpi-grid", "aria-label": "Resumo do portfolio", children: kpiItems.map((item) => {
                    const Icon = item.icon;
                    return (_jsxs("article", { className: "projects-kpi-card", children: [_jsx("div", { className: `projects-kpi-icon is-${item.tone}`, children: _jsx(Icon, { "aria-hidden": "true" }) }), _jsxs("div", { children: [_jsx("div", { className: "projects-kpi-value", children: item.value }), _jsx("div", { className: "projects-kpi-label", children: item.label })] })] }, item.id));
                }) }), _jsxs("section", { className: "projects-filters-card", children: [_jsx("div", { className: "projects-filters-modern", children: _jsxs("div", { className: "projects-filters-bar", children: [_jsx("div", { className: "projects-filters-row projects-filters-row--search", children: _jsxs("label", { className: "projects-filter-field projects-filter-search", children: [_jsx("span", { children: "Buscar projetos" }), _jsx("input", { type: "search", placeholder: "Buscar projetos...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] }) }), _jsxs("div", { className: "projects-filters-row projects-filters-row--controls", children: [_jsxs("div", { className: "projects-filters-left", children: [_jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Status" }), _jsx("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: chipStatusOptions.map((option) => (_jsx("option", { value: option.id, children: option.label }, option.id))) })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Cliente" }), _jsxs("select", { value: clientFilter, onChange: (event) => setClientFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), clientOptions.map((client) => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Responsavel" }), _jsxs("select", { value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), ownerOptions.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Tags" }), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todas" }), tagOptions.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Favoritos" }), _jsxs("select", { value: showOnlyFavorites ? "favorites" : "all", onChange: (event) => setShowOnlyFavorites(event.target.value === "favorites"), children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "favorites", children: "Somente favoritos" })] })] })] }), _jsxs("div", { className: "projects-filters-right", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onExport, disabled: !onExport || !projects.length, children: "Exportar portfolio" }), _jsxs("div", { className: "projects-view-toggle", role: "group", "aria-label": "Trocar visualizacao", children: [_jsx("button", { type: "button", className: `toggle-btn ${viewMode === "cards" ? "active" : ""}`, onClick: () => setViewMode("cards"), children: "Cards" }), _jsx("button", { type: "button", className: `toggle-btn ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Tabela" })] })] })] })] }) }), _jsxs("div", { className: "projects-filters-legacy", children: [_jsxs("div", { className: "projects-filters-chips", children: [chipStatusOptions.map((option) => (_jsx("button", { type: "button", className: `filter-chip ${statusFilter === option.id ? "is-active" : ""}`, onClick: () => setStatusFilter(option.id), children: option.label }, option.id))), _jsx("button", { type: "button", className: `filter-chip ${showOnlyFavorites ? "is-active" : ""}`, onClick: () => setShowOnlyFavorites((value) => !value), children: "Favoritos" })] }), _jsxs("div", { className: "projects-filters-row", children: [_jsxs("div", { className: "projects-filters-controls", children: [_jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Cliente" }), _jsxs("select", { value: clientFilter, onChange: (event) => setClientFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), clientOptions.map((client) => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Respons\u00E1vel" }), _jsxs("select", { value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), ownerOptions.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Tags" }), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todas" }), tagOptions.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] }), _jsxs("label", { className: "projects-filter-field projects-filter-search", children: [_jsx("span", { children: "Busca" }), _jsx("input", { type: "search", placeholder: "Projeto, cliente ou tag...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] })] }), _jsxs("div", { className: "projects-filters-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onExport, disabled: !onExport || !projects.length, children: "Exportar portf\u00F3lio" }), _jsxs("div", { className: "projects-view-toggle", role: "group", "aria-label": "Trocar visualiza\u00E7\u00E3o", children: [_jsx("button", { type: "button", className: `toggle-btn ${viewMode === "cards" ? "active" : ""}`, onClick: () => setViewMode("cards"), children: "Cards" }), _jsx("button", { type: "button", className: `toggle-btn ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Tabela" })] })] })] })] })] }), error && (_jsx("p", { className: "error-text", role: "status", "aria-live": "assertive", children: error })), renderList()] }));
};
