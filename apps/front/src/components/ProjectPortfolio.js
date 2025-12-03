import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
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
export const ProjectPortfolio = ({ projects, error, isLoading = false, onExport, selectedProjectId, onSelectProject, onCreateProject, onViewProjectDetails }) => {
    const [viewMode, setViewMode] = useState("cards");
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
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
    const emptyState = showOnlyFavorites
        ? "Você ainda não favoritou nenhum projeto."
        : "Sem projetos para o filtro atual.";
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
                    return (_jsxs("article", { className: `project-card project-card--elevated ${isActive ? "is-active" : ""}`, onClick: () => onSelectProject?.(project.projectId), role: "button", tabIndex: 0, onKeyDown: (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelectProject?.(project.projectId);
                            }
                        }, children: [_jsxs("header", { className: "project-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "project-card-title", children: project.projectName }), _jsx("p", { className: "project-card-client", children: project.clientName ? `Cliente: ${project.clientName}` : "Cliente não informado" })] }), _jsxs("div", { className: "project-card-actions", children: [renderStatusBadge(project.status), _jsx("button", { type: "button", className: `favorite-button ${favoriteIds.has(project.projectId) ? "is-active" : ""}`, onClick: (event) => {
                                                    event.stopPropagation();
                                                    toggleFavorite(project.projectId);
                                                }, "aria-label": "Favoritar projeto", children: "\u2605" })] })] }), _jsxs("div", { className: "project-card-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${progress}%` } }) }), _jsxs("span", { className: "progress-value", children: [progress, "%"] })] }), _jsxs("div", { className: "project-card-stats", children: [_jsxs("span", { className: "project-card-meta-label", children: ["Respons\u00E1vel: ", project.responsibleName ?? "Não definido"] }), _jsxs("span", { className: "project-card-meta-label", children: [tasksDone, "/", tasksTotal, " tarefas \u2022 ", project.risksOpen ?? 0, " riscos abertos"] })] }), _jsxs("footer", { className: "project-card-footer", children: [_jsxs("div", { className: "project-card-deadline", children: [formatDisplayDate(project.startDate), " \u2014 ", formatDisplayDate(project.endDate)] }), _jsx("button", { type: "button", className: "link-button", onClick: (event) => {
                                            event.stopPropagation();
                                            onSelectProject?.(project.projectId);
                                            onViewProjectDetails?.(project.projectId);
                                        }, children: "Ver detalhes" })] })] }, project.projectId));
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
    return (_jsxs("div", { className: "projects-content", "aria-label": "Listagem de projetos", "aria-busy": isLoading, children: [_jsxs("section", { className: "projects-filters-card", children: [_jsxs("div", { className: "projects-filters-chips", children: [chipStatusOptions.map((option) => (_jsx("button", { type: "button", className: `filter-chip ${statusFilter === option.id ? "is-active" : ""}`, onClick: () => setStatusFilter(option.id), children: option.label }, option.id))), _jsx("button", { type: "button", className: `filter-chip ${showOnlyFavorites ? "is-active" : ""}`, onClick: () => setShowOnlyFavorites((value) => !value), children: "Favoritos" })] }), _jsxs("div", { className: "projects-filters-row", children: [_jsxs("div", { className: "projects-filters-controls", children: [_jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Cliente" }), _jsxs("select", { value: clientFilter, onChange: (event) => setClientFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), clientOptions.map((client) => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Respons\u00E1vel" }), _jsxs("select", { value: ownerFilter, onChange: (event) => setOwnerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), ownerOptions.map((owner) => (_jsx("option", { value: owner, children: owner }, owner)))] })] }), _jsxs("label", { className: "projects-filter-field", children: [_jsx("span", { children: "Tags" }), _jsxs("select", { value: tagFilter, onChange: (event) => setTagFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todas" }), tagOptions.map((tag) => (_jsx("option", { value: tag, children: tag }, tag)))] })] }), _jsxs("label", { className: "projects-filter-field projects-filter-search", children: [_jsx("span", { children: "Busca" }), _jsx("input", { type: "search", placeholder: "Projeto, cliente ou tag...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) })] })] }), _jsxs("div", { className: "projects-filters-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onExport, disabled: !onExport || !projects.length, children: "Exportar portf\u00F3lio" }), _jsxs("div", { className: "projects-view-toggle", role: "group", "aria-label": "Trocar visualiza\u00E7\u00E3o", children: [_jsx("button", { type: "button", className: `toggle-btn ${viewMode === "cards" ? "active" : ""}`, onClick: () => setViewMode("cards"), children: "Cards" }), _jsx("button", { type: "button", className: `toggle-btn ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Tabela" })] })] })] })] }), error && (_jsx("p", { className: "error-text", role: "status", "aria-live": "assertive", children: error })), renderList()] }));
};
