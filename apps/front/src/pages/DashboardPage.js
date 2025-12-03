import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../hooks/useDashboardData";
const formatMetricValue = (value) => value === null || value === undefined ? "–" : value;
const formatHours = (value) => value === null || value === undefined ? "–" : `${value.toFixed(1)}h`;
export const DashboardPage = () => {
    const navigate = useNavigate();
    const { activeProjectsCount, runningTasksCount, riskProjectsCount, loggedHoursLast14Days, highlightedProjects, portfolioSummary, recentActivities, projectToast, orgError, projectsError } = useDashboardData();
    const metrics = [
        { label: "Projetos ativos", value: formatMetricValue(activeProjectsCount), sub: "+3 este mês" },
        { label: "Tarefas em andamento", value: formatMetricValue(runningTasksCount), sub: "esta semana" },
        { label: "Em risco", value: formatMetricValue(riskProjectsCount), sub: "necessitam atenção" },
        {
            label: "Horas registradas (14d)",
            value: formatHours(loggedHoursLast14Days),
            sub: "últimos 14 dias"
        }
    ];
    const summaryList = [
        `Projetos ativos: ${formatMetricValue(portfolioSummary.activeProjectsCount)}`,
        `Tarefas em andamento: ${formatMetricValue(portfolioSummary.runningTasksCount)}`,
        `Projetos em risco: ${formatMetricValue(portfolioSummary.riskProjectsCount)}`,
        `Tarefas atrasadas: ${formatMetricValue(portfolioSummary.overdueTasksCount)}`
    ];
    return (_jsxs("div", { className: "page-container", children: [_jsx("h1", { className: "page-title", children: "Vis\u00E3o geral do trabalho" }), _jsx("p", { className: "page-subtitle", children: "Acompanhe o progresso dos seus projetos, tarefas e riscos em tempo real." }), projectToast && _jsx("p", { className: "success-text", children: projectToast }), orgError && _jsx("p", { className: "error-text", children: orgError }), projectsError && _jsx("p", { className: "error-text", children: projectsError }), _jsx("div", { className: "dash-metrics-grid", children: metrics.map((metric) => (_jsxs("article", { className: "dash-metric-card", children: [_jsx("span", { className: "dash-metric-label", children: metric.label }), _jsx("div", { className: "dash-metric-value", children: metric.value }), _jsx("span", { className: "dash-metric-sub", children: metric.sub })] }, metric.label))) }), _jsxs("section", { children: [_jsx("h2", { className: "section-title", children: "Projetos em destaque" }), _jsx("p", { className: "section-subtitle", children: "Filtros avan\u00E7ados e troca de visualiza\u00E7\u00E3o entre cards e tabela." }), _jsx("div", { className: "dash-projects-grid", children: highlightedProjects.length === 0 ? (_jsx("p", { className: "muted", children: "Nenhum projeto dispon\u00EDvel no momento." })) : (highlightedProjects.map((project) => (_jsxs("article", { className: "dash-project-card", children: [_jsxs("div", { className: "dash-project-header", children: [_jsx("span", { className: "dash-project-name", children: project.name }), _jsx("span", { className: `status-pill status-pill--${project.status}`, children: project.statusLabel })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("div", { className: "progress-bar", "aria-hidden": "true", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${project.progress}%` } }) }), _jsxs("span", { className: "progress-percent", children: [project.progress, "%"] })] }), _jsxs("div", { className: "dash-project-meta", children: [_jsxs("span", { children: ["\uD83D\uDCC5 ", project.period] }), _jsxs("span", { children: ["\uD83D\uDC65 ", project.membersLabel] }), _jsxs("span", { children: ["\u2705 ", project.tasksLabel] })] }), _jsx("button", { type: "button", className: "link-button", onClick: () => navigate(`/projects/${project.id}`), children: "Ver detalhes" })] }, project.id)))) })] }), _jsxs("section", { children: [_jsx("h2", { className: "section-title", children: "Resumo r\u00E1pido" }), _jsxs("div", { className: "dash-summary-grid", children: [_jsxs("article", { className: "dash-summary-card", children: [_jsx("div", { className: "summary-title", children: "Portf\u00F3lio" }), _jsx("div", { className: "summary-list", children: summaryList.map((item) => (_jsx("span", { children: item }, item))) })] }), _jsxs("article", { className: "dash-summary-card", children: [_jsx("div", { className: "summary-title", children: "Atividade recente" }), _jsx("div", { className: "activity-list", children: recentActivities.map((activity) => (_jsx("div", { className: "activity-item", children: _jsxs("span", { children: [activity.description, " \u2022 ", activity.timeAgo] }) }, activity.id))) })] })] })] })] }));
};
