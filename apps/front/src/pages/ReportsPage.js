import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { normalizeStatus } from "../utils/status";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";
const projectStatusMap = {
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
const normalizeValue = (value) => (value ?? "").trim().toUpperCase();
const getProjectStatusValue = (project) => project.status ??
    project.statusLabel ??
    project.projectStatus ??
    null;
const resolveProjectStatusKey = (status) => {
    const normalized = normalizeValue(status);
    if (!normalized)
        return "UNKNOWN";
    if (["DONE", "COMPLETED", "FINALIZADO", "CONCLUIDO", "CONCLUÍDO"].includes(normalized))
        return "COMPLETED";
    if (["IN_PROGRESS", "ACTIVE", "EM ANDAMENTO", "EM_ANDAMENTO"].includes(normalized))
        return "IN_PROGRESS";
    if (["PLANNED", "PLANNING", "PLANEJADO", "PLANEJAMENTO", "NAO INICIADO", "NÃO INICIADO", "NAO_INICIADO"].includes(normalized)) {
        return "PLANNED";
    }
    if (["ON_HOLD", "PAUSED", "PAUSADO"].includes(normalized))
        return "PAUSED";
    if (["DELAYED", "LATE", "OVERDUE", "ATRASADO"].includes(normalized))
        return "LATE";
    if (["AT_RISK", "BLOCKED", "EM RISCO", "RISCO"].includes(normalized))
        return "RISK";
    if (["CANCELED", "CANCELADO", "CANCELLED"].includes(normalized))
        return "CANCELED";
    return "UNKNOWN";
};
const getProjectStatusMeta = (status) => {
    if (!status)
        return { label: "Sem status", tone: "neutral" };
    const normalized = normalizeValue(status);
    return projectStatusMap[normalized] ?? { label: status, tone: "neutral" };
};
const getProjectPriorityMeta = (priority) => {
    if (!priority)
        return { label: "Média", tone: "info", rank: 3 };
    const normalized = normalizeValue(priority);
    return priorityMap[normalized] ?? { label: priority, tone: "neutral", rank: 4 };
};
const formatShortDate = (value) => {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "-";
    const safeDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return safeDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};
const calcProgress = (done, total) => {
    if (!total || total === 0)
        return 0;
    if (!done)
        return 0;
    return Math.min(100, Math.round((done / total) * 100));
};
const getScopeTone = (statusLabel) => {
    const normalized = statusLabel.toLowerCase();
    if (normalized.includes("final"))
        return "success";
    if (normalized.includes("atras") || normalized.includes("risco"))
        return "danger";
    if (normalized.includes("andam") || normalized.includes("homolog"))
        return "warning";
    return "neutral";
};
const computeNodeProgress = (node) => {
    if (Array.isArray(node.children) && node.children.length) {
        const total = node.children.reduce((sum, child) => sum + computeNodeProgress(child), 0);
        return Math.round(total / node.children.length);
    }
    const statusLabel = normalizeStatus(node.status);
    if (statusLabel === "Finalizado")
        return 100;
    if (statusLabel === "Em andamento")
        return 50;
    if (typeof node.progress === "number" && Number.isFinite(node.progress)) {
        return Math.max(0, Math.min(100, Math.round(node.progress)));
    }
    return 0;
};
const flattenNodes = (nodes, levelOffset, rows) => {
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
const ProjectProgressPill = ({ percent, variant }) => {
    const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.round(percent))) : 0;
    return (_jsxs("div", { className: `reports-progress-pill is-${variant}`, children: [_jsx("span", { className: "reports-progress-pill-track", children: _jsx("span", { className: "reports-progress-pill-fill", style: { width: `${safePercent}%` } }) }), _jsxs("strong", { children: [safePercent, "%"] })] }));
};
const ProjectMiniCard = ({ project }) => {
    const progress = calcProgress(project.tasksDone, project.tasksTotal);
    const priorityMeta = getProjectPriorityMeta(project.priority ?? project.priorityLevel ?? null);
    const statusMeta = getProjectStatusMeta(getProjectStatusValue(project));
    const tasksTotal = project.tasksTotal ?? 0;
    const tasksDone = project.tasksDone ?? 0;
    const scheduleLabel = project.endDate ? formatShortDate(project.endDate) : "Sem prazo";
    const clientLabel = project.clientName ?? project.code ?? "Cliente não informado";
    const responsibleLabel = project.responsibleName ?? "Responsável não definido";
    return (_jsxs("article", { className: `reports-mini-card tone-${priorityMeta.tone}`, children: [_jsxs("div", { className: "reports-mini-card__header", children: [_jsx("span", { className: `reports-pill tone-${statusMeta.tone}`, children: statusMeta.label }), _jsx("span", { className: `reports-pill tone-${priorityMeta.tone}`, children: priorityMeta.label })] }), _jsx("h3", { children: project.projectName }), _jsx("p", { className: "reports-project-subtitle", children: clientLabel }), _jsx("div", { className: "reports-progress-bar", children: _jsx("span", { style: { width: `${progress}%` } }) }), _jsxs("div", { className: "reports-project-meta", children: [_jsxs("span", { children: [tasksDone, "/", tasksTotal, " tarefas"] }), _jsxs("span", { children: ["Entrega: ", scheduleLabel] })] }), _jsxs("div", { className: "reports-project-owner", children: [_jsx("span", { children: "Respons\u00E1vel" }), _jsx("strong", { title: responsibleLabel, children: responsibleLabel })] })] }));
};
const buildPanelRows = (nodes, levelFilter, query) => {
    const rows = [];
    flattenNodes(nodes, 0, rows);
    const normalized = rows.map((row) => ({
        ...row,
        level: row.level + 1
    }));
    const search = query.trim().toLowerCase();
    return normalized.filter((row) => {
        if (levelFilter === "1" && row.level !== 1)
            return false;
        if (levelFilter === "2" && row.level !== 2)
            return false;
        if (levelFilter === "1-2" && row.level > 2)
            return false;
        if (levelFilter !== "1" && levelFilter !== "2" && levelFilter !== "1-2") {
            const target = Number(levelFilter);
            if (Number.isFinite(target) && row.level !== target)
                return false;
        }
        if (!search)
            return true;
        return row.title.toLowerCase().includes(search);
    });
};
const formatProjectsCount = (count) => `${count} projeto${count === 1 ? "" : "s"}`;
const ReportsPage = () => {
    const { portfolio, portfolioError, portfolioLoading, reportsError, reportsLoading, selectedOrganizationId } = useOutletContext();
    const { token } = useAuth();
    const [scopeLevel, setScopeLevel] = useState("1-2");
    const [scopeSearch, setScopeSearch] = useState("");
    const [panelData, setPanelData] = useState({});
    const selectedProjectName = "Todos os projetos";
    const groupedProjects = useMemo(() => {
        const normalized = portfolio;
        const getKey = (project) => resolveProjectStatusKey(getProjectStatusValue(project));
        const finished = normalized.filter((project) => getKey(project) === "COMPLETED");
        const planned = normalized.filter((project) => getKey(project) === "PLANNED");
        const inProgress = normalized
            .filter((project) => getKey(project) === "IN_PROGRESS")
            .sort((a, b) => {
            const priorityA = getProjectPriorityMeta(a.priority ?? a.priorityLevel ?? null).rank;
            const priorityB = getProjectPriorityMeta(b.priority ?? b.priorityLevel ?? null).rank;
            if (priorityA !== priorityB)
                return priorityA - priorityB;
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
            if (!targets.length)
                return;
            await Promise.all(targets.map(async (projectId) => {
                const existing = panelData[projectId];
                if (existing && (existing.loading || existing.nodes.length))
                    return;
                setPanelData((prev) => ({
                    ...prev,
                    [projectId]: { nodes: prev[projectId]?.nodes ?? [], loading: true, error: null }
                }));
                try {
                    const headers = {};
                    if (token)
                        headers.Authorization = `Bearer ${token}`;
                    if (selectedOrganizationId)
                        headers["x-organization-id"] = selectedOrganizationId;
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
                }
                catch (error) {
                    setPanelData((prev) => ({
                        ...prev,
                        [projectId]: {
                            nodes: prev[projectId]?.nodes ?? [],
                            loading: false,
                            error: error?.message ?? "Erro ao carregar EAP"
                        }
                    }));
                }
            }));
        };
        loadPanels();
    }, [groupedProjects.inProgress, panelData, selectedOrganizationId, token]);
    const maxLevel = Math.max(2, ...groupedProjects.inProgress.map((project) => {
        const state = panelData[project.projectId];
        if (!state?.nodes?.length)
            return 2;
        const rows = [];
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
    return (_jsxs("section", { className: "reports-page reports-page--timeline", children: [_jsxs("header", { className: "reports-header", children: [_jsxs("div", { className: "reports-header__intro", children: [_jsx("p", { className: "eyebrow", children: "Relat\u00F3rios" }), _jsx("h2", { children: "Projetos e atualiza\u00E7\u00F5es" }), _jsx("p", { className: "subtext", children: "Vis\u00E3o macro do portf\u00F3lio e do escopo por n\u00EDvel da EAP." })] }), _jsx("div", { className: "reports-header__actions", children: _jsx("button", { type: "button", className: "reports-print-button", onClick: () => window.print(), children: "Salvar em PDF" }) })] }), portfolioError && _jsx("p", { className: "error-text", children: portfolioError }), _jsxs("section", { className: "reports-section reports-section--success", children: [_jsxs("div", { className: "reports-section-title reports-section-title--success", children: [_jsxs("h2", { children: ["PROJETOS ", _jsx("span", { children: "FINALIZADOS" })] }), _jsx("span", { className: "reports-count-pill", children: formatProjectsCount(groupedProjects.finished.length) })] }), portfolioLoading ? (_jsx("p", { className: "muted", children: "Carregando projetos..." })) : groupedProjects.finished.length ? (_jsx("div", { className: "reports-projects-grid reports-projects-grid--compact", children: groupedProjects.finished.map((project) => (_jsxs("div", { className: "reports-project-item", children: [_jsx(ProjectProgressPill, { percent: 100, variant: "success" }), _jsx(ProjectMiniCard, { project: project })] }, project.projectId))) })) : (_jsx("p", { className: "muted", children: "Nenhum projeto finalizado." }))] }), _jsxs("section", { className: "reports-section reports-section--info", children: [_jsxs("div", { className: "reports-section-title reports-section-title--info", children: [_jsxs("h2", { children: ["PROJETOS ", _jsx("span", { children: "EM ANDAMENTO" })] }), _jsx("span", { className: "reports-count-pill", children: formatProjectsCount(groupedProjects.inProgress.length) })] }), portfolioLoading ? (_jsx("p", { className: "muted", children: "Carregando projetos..." })) : groupedProjects.inProgress.length ? (_jsx("div", { className: "reports-projects-grid reports-projects-grid--compact", children: groupedProjects.inProgress.map((project) => {
                            const progress = calcProgress(project.tasksDone, project.tasksTotal);
                            return (_jsxs("div", { className: "reports-project-item", children: [_jsx(ProjectProgressPill, { percent: progress, variant: "info" }), _jsx(ProjectMiniCard, { project: project })] }, project.projectId));
                        }) })) : (_jsx("p", { className: "muted", children: "Nenhum projeto em andamento." }))] }), _jsxs("section", { className: "reports-section reports-section--neutral", children: [_jsxs("div", { className: "reports-section-title reports-section-title--neutral", children: [_jsxs("h2", { children: ["PROJETOS ", _jsx("span", { children: "PLANEJADOS" })] }), _jsx("span", { className: "reports-count-pill", children: formatProjectsCount(groupedProjects.planned.length) })] }), portfolioLoading ? (_jsx("p", { className: "muted", children: "Carregando projetos..." })) : groupedProjects.planned.length ? (_jsx("div", { className: "reports-projects-grid reports-projects-grid--compact", children: groupedProjects.planned.map((project) => (_jsxs("div", { className: "reports-project-item", children: [_jsx(ProjectProgressPill, { percent: 0, variant: "neutral" }), _jsx(ProjectMiniCard, { project: project })] }, project.projectId))) })) : (_jsx("p", { className: "muted", children: "Nenhum projeto planejado." }))] }), _jsxs("section", { className: "reports-block reports-block--scope", children: [_jsxs("header", { className: "reports-block-header", children: [_jsxs("div", { children: [_jsx("p", { className: "reports-block-kicker", children: "Atualiza\u00E7\u00F5es em andamento" }), _jsxs("h2", { children: ["PROJETOS ATUALIZA\u00C7\u00D5ES ", _jsx("span", { className: "reports-title-accent", children: "EM ANDAMENTO" })] }), _jsx("p", { children: "Mostrando apenas projetos em andamento. Se houver mais, eles aparecem abaixo." })] }), _jsx("div", { className: "reports-block-meta", children: _jsxs("span", { className: "reports-meta-pill", children: [groupedProjects.inProgress.length, " projetos"] }) })] }), _jsxs("div", { className: "reports-scope-controls", children: [_jsxs("label", { className: "reports-control", children: [_jsx("span", { children: "N\u00EDvel (macro)" }), _jsx("select", { value: scopeLevel, onChange: (event) => setScopeLevel(event.target.value), children: levelOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "reports-control", children: [_jsx("span", { children: "Buscar etapa" }), _jsx("input", { type: "search", placeholder: "Buscar etapa...", value: scopeSearch, onChange: (event) => setScopeSearch(event.target.value) })] }), _jsxs("div", { className: "reports-control reports-control--readonly", children: [_jsx("span", { children: "Projetos (atual)" }), _jsx("div", { className: "reports-control-value", children: currentProjectsLabel })] })] }), groupedProjects.inProgress.length === 0 ? (_jsx("p", { className: "muted", children: "Nenhum projeto em andamento." })) : (groupedProjects.inProgress.map((project) => {
                        const panelState = panelData[project.projectId] ?? { nodes: [], loading: false, error: null };
                        const panelRows = buildPanelRows(panelState.nodes, scopeLevel, scopeSearch);
                        const percentRows = buildPanelRows(panelState.nodes, scopeLevel, "");
                        const scopePercent = percentRows.length
                            ? Math.round(percentRows.reduce((sum, row) => sum + row.progress, 0) / percentRows.length)
                            : 0;
                        const panelProgress = calcProgress(project.tasksDone, project.tasksTotal);
                        return (_jsxs("div", { className: "reports-updates-grid", children: [_jsxs("div", { className: "reports-updates-left", children: [_jsx("div", { className: "reports-project-spot", children: _jsxs("span", { children: ["Projeto: ", project.projectName] }) }), _jsxs("div", { className: "reports-gauge-card", children: [_jsx("div", { className: "reports-gauge-title", children: "Percentual Conclu\u00EDdo" }), _jsx("div", { className: "reports-gauge-bar", children: _jsx("span", { style: { width: `${panelProgress}%` } }) }), _jsxs("div", { className: "reports-gauge-value", children: [panelProgress, "%"] })] }), _jsxs("div", { className: "reports-scope-card", children: [_jsx("span", { children: "Percentual do Escopo do Projeto" }), _jsxs("strong", { children: [scopePercent, "%"] }), _jsx("div", { className: "reports-progress-bar reports-progress-bar--soft", children: _jsx("span", { style: { width: `${scopePercent}%` } }) })] }), _jsx("div", { className: "reports-scope-chart", children: panelState.loading ? (_jsx("p", { className: "muted", children: "Carregando etapas..." })) : panelRows.length ? (_jsxs(_Fragment, { children: [panelRows.map((row) => (_jsxs("div", { className: "reports-scope-chart-row", children: [_jsx("div", { className: "reports-scope-chart-label", style: { paddingLeft: `${Math.max(0, row.level - 1) * 14}px` }, children: row.title }), _jsx("div", { className: "reports-scope-chart-bar", children: _jsx("span", { style: { width: `${row.progress}%` } }) }), _jsxs("div", { className: "reports-scope-chart-value", children: [row.progress, "%"] })] }, row.id))), _jsxs("div", { className: "reports-scope-chart-axis", children: [_jsx("div", { className: "reports-scope-chart-axis-spacer" }), _jsxs("div", { className: "reports-scope-chart-axis-line", children: [_jsx("span", { children: "0%" }), _jsx("span", { children: "20%" }), _jsx("span", { children: "40%" }), _jsx("span", { children: "60%" }), _jsx("span", { children: "80%" }), _jsx("span", { children: "100%" })] }), _jsx("div", {})] })] })) : (_jsx("p", { className: "muted", children: "Nenhuma etapa encontrada." })) })] }), _jsxs("div", { className: "reports-updates-right", children: [_jsx("h3", { children: "Escopo do Projeto Previsto" }), panelState.error && _jsx("p", { className: "error-text", children: panelState.error }), _jsx("div", { className: "reports-table-scroll", children: _jsxs("table", { className: "reports-scope-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Nome da tarefa" }), _jsx("th", { children: "Situa\u00E7\u00E3o" }), _jsx("th", { children: "In\u00EDcio" }), _jsx("th", { children: "T\u00E9rmino" }), _jsx("th", { children: "% conclu\u00EDdo" })] }) }), _jsx("tbody", { children: panelState.loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "reports-empty", children: "Carregando etapas..." }) })) : panelRows.length ? (panelRows.map((row) => {
                                                            const statusLabel = normalizeStatus(row.status);
                                                            const tone = getScopeTone(statusLabel);
                                                            return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: "reports-scope-name", style: { paddingLeft: `${Math.max(0, row.level - 1) * 14}px` }, children: row.title }) }), _jsx("td", { children: _jsx("span", { className: `reports-pill tone-${tone}`, children: statusLabel }) }), _jsx("td", { children: formatShortDate(row.startDate ?? null) }), _jsx("td", { children: formatShortDate(row.endDate ?? null) }), _jsxs("td", { children: [_jsx("div", { className: "reports-scope-progress", children: _jsx("span", { style: { width: `${row.progress}%` } }) }), _jsxs("small", { children: [row.progress, "%"] })] })] }, row.id));
                                                        })) : (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "reports-empty", children: "Nenhuma etapa encontrada para o n\u00EDvel selecionado." }) })) })] }) })] })] }, project.projectId));
                    }))] }), reportsError && _jsx("p", { className: "error-text", children: reportsError }), reportsLoading && _jsx("p", { className: "muted", children: "Carregando relat\u00F3rios..." })] }));
};
export default ReportsPage;
