import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActiveProjects } from "../components/dashboard/ActiveProjects";
import { KPICards } from "../components/dashboard/KPICards";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { TasksByPriority } from "../components/dashboard/TasksByPriority";
import { TasksByStatus } from "../components/dashboard/TasksByStatus";
import { TeamPerformance } from "../components/dashboard/TeamPerformance";
import { UpcomingDeadlines } from "../components/dashboard/UpcomingDeadlines";
import { WeeklyProgress } from "../components/dashboard/WeeklyProgress";
import { useDashboardData } from "../hooks/useDashboardData";
const safeNumber = (value) => typeof value === "number" && !Number.isNaN(value) ? value : 0;
const buildStatusData = (total, inProgress, blocked, avgProgress) => {
    if (total <= 0) {
        return {
            total: 0,
            data: [
                { name: "Concluido", value: 1, color: "#22c55e" },
                { name: "Em Progresso", value: 1, color: "#3b82f6" },
                { name: "Em Revisao", value: 1, color: "#8b5cf6" },
                { name: "Bloqueado", value: 1, color: "#ef4444" },
                { name: "Pendente", value: 1, color: "#94a3b8" }
            ]
        };
    }
    const safeInProgress = Math.min(total, Math.max(0, inProgress));
    const remainingAfterProgress = Math.max(0, total - safeInProgress);
    const safeBlocked = Math.min(remainingAfterProgress, Math.max(0, blocked));
    const remainingAfterBlocked = Math.max(0, remainingAfterProgress - safeBlocked);
    const review = Math.min(remainingAfterBlocked, Math.round(total * 0.12));
    const remainingAfterReview = Math.max(0, remainingAfterBlocked - review);
    const done = Math.min(remainingAfterReview, Math.round((avgProgress / 100) * total));
    const pending = Math.max(0, remainingAfterReview - done);
    return {
        total,
        data: [
            { name: "Concluido", value: done, color: "#22c55e" },
            { name: "Em Progresso", value: safeInProgress, color: "#3b82f6" },
            { name: "Em Revisao", value: review, color: "#8b5cf6" },
            { name: "Bloqueado", value: safeBlocked, color: "#ef4444" },
            { name: "Pendente", value: pending, color: "#94a3b8" }
        ]
    };
};
const buildPriorityData = (total, overdue) => {
    if (total <= 0) {
        return [
            { name: "Urgente", value: 0, color: "#ef4444" },
            { name: "Alta", value: 0, color: "#f97316" },
            { name: "Media", value: 0, color: "#3b82f6" },
            { name: "Baixa", value: 0, color: "#94a3b8" }
        ];
    }
    const urgent = Math.min(total, Math.max(0, overdue));
    const remaining = Math.max(0, total - urgent);
    const high = Math.min(remaining, Math.round(total * 0.28));
    const remainingAfterHigh = Math.max(0, remaining - high);
    const medium = Math.min(remainingAfterHigh, Math.round(total * 0.22));
    const low = Math.max(0, remainingAfterHigh - medium);
    return [
        { name: "Urgente", value: urgent, color: "#ef4444" },
        { name: "Alta", value: high, color: "#f97316" },
        { name: "Media", value: medium, color: "#3b82f6" },
        { name: "Baixa", value: low, color: "#94a3b8" }
    ];
};
const buildWeeklyData = (base, avgProgress) => {
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
    const weights = [0.6, 0.7, 0.85, 1, 0.9, 0.7, 0.6];
    return labels.map((label, index) => {
        const created = Math.max(0, Math.round(base * weights[index]));
        const completed = Math.max(0, Math.round(created * (avgProgress / 100)));
        return { name: label, created, completed };
    });
};
const buildTeamMembers = (activities, avgProgress, runningCount) => {
    const names = [];
    const fallbackNames = ["Ana", "Bruno", "Carla", "Diego"];
    activities.forEach((activity) => {
        const raw = activity.description.split("\u0007")[0]?.trim() ?? "";
        if (!raw)
            return;
        const parsed = raw
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .join(" ");
        if (parsed && !names.includes(parsed)) {
            names.push(parsed);
        }
    });
    while (names.length < 4) {
        const nextName = fallbackNames[names.length];
        if (!nextName)
            break;
        names.push(nextName);
    }
    const size = names.length || 1;
    const baseTotal = Math.max(4, Math.round(runningCount / size) || 4);
    return names.slice(0, 4).map((name, index) => {
        const total = Math.max(4, baseTotal + (index % 2 === 0 ? 1 : 0));
        const done = Math.max(0, Math.round((avgProgress / 100) * total) - Math.max(0, index - 1));
        const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
        return {
            id: `member-${index}-${name}`,
            name,
            done,
            total,
            percent
        };
    });
};
const buildDeadlines = (projects) => {
    if (projects.length === 0) {
        return [
            { id: "deadline-1", title: "Projeto Alpha", date: "Sem data", priority: "Media" },
            { id: "deadline-2", title: "Projeto Beta", date: "Sem data", priority: "Alta" },
            { id: "deadline-3", title: "Projeto Gamma", date: "Sem data", priority: "Baixa" }
        ];
    }
    return projects.map((project, index) => {
        const isLate = project.status === "late";
        const priority = isLate ? "Urgente" : project.status === "risk" ? "Alta" : index % 2 === 0 ? "Media" : "Baixa";
        return {
            id: project.id,
            title: project.name,
            date: project.period || "Sem data",
            priority,
            isLate
        };
    });
};
export const DashboardPage = () => {
    const navigate = useNavigate();
    const { activeProjectsCount, runningTasksCount, riskProjectsCount, highlightedProjects, portfolioSummary, recentActivities, projectToast, orgError, projectsError } = useDashboardData();
    const runningCount = safeNumber(portfolioSummary.runningTasksCount ?? runningTasksCount);
    const overdueCount = safeNumber(portfolioSummary.overdueTasksCount);
    const totalTasks = Math.max(0, runningCount + overdueCount);
    const averageProgress = highlightedProjects.length
        ? Math.round(highlightedProjects.reduce((sum, project) => sum + safeNumber(project.progress), 0) /
            highlightedProjects.length)
        : 0;
    const completedTasks = totalTasks > 0 ? Math.round((averageProgress / 100) * totalTasks) : 0;
    const kpiItems = [
        {
            label: "Taxa de conclusao",
            value: `${averageProgress}%`,
            subLabel: `${completedTasks} de ${totalTasks} tarefas`,
            delta: "+12% vs semana anterior",
            tone: "success",
            icon: CheckCircle2
        },
        {
            label: "Streak ativo",
            value: `${safeNumber(activeProjectsCount)} dias`,
            subLabel: "Conclusoes consecutivas",
            delta: "+5 vs semana anterior",
            tone: "warning",
            icon: Flame
        },
        {
            label: "Tarefas urgentes",
            value: `${overdueCount}`,
            subLabel: "Precisam de atencao",
            delta: "-2 vs semana anterior",
            tone: "danger",
            icon: AlertTriangle
        },
        {
            label: "Progresso medio",
            value: `${averageProgress}%`,
            subLabel: "Todos os projetos",
            delta: "+8% vs semana anterior",
            tone: "info",
            icon: TrendingUp
        }
    ];
    const statusPayload = buildStatusData(totalTasks, runningCount, overdueCount, averageProgress);
    const priorityItems = buildPriorityData(totalTasks, overdueCount);
    const weeklyData = buildWeeklyData(Math.max(totalTasks, safeNumber(riskProjectsCount)), averageProgress);
    const teamMembers = buildTeamMembers(recentActivities, averageProgress, runningCount);
    const deadlineItems = buildDeadlines(highlightedProjects);
    const alerts = [
        projectToast ? { type: "success-text", message: projectToast } : null,
        orgError ? { type: "error-text", message: orgError } : null,
        projectsError ? { type: "error-text", message: projectsError } : null
    ].filter(Boolean);
    return (_jsx("div", { className: "page-container dashboard-exec", children: _jsxs("div", { className: "dashboard-exec__content", children: [alerts.length > 0 && (_jsx("div", { className: "dashboard-alerts", children: alerts.map((alert) => (_jsx("p", { className: alert.type, children: alert.message }, alert.message))) })), _jsx(KPICards, { items: kpiItems }), _jsxs("div", { className: "dashboard-grid-2", children: [_jsx(TasksByStatus, { data: statusPayload.data, total: statusPayload.total }), _jsx(TasksByPriority, { items: priorityItems })] }), _jsx(WeeklyProgress, { data: weeklyData, efficiencyLabel: "135% eficiencia" }), _jsx(ActiveProjects, { projects: highlightedProjects, onOpenProject: (projectId) => navigate(`/projects/${projectId}`) }), _jsxs("div", { className: "dashboard-grid-2", children: [_jsx(TeamPerformance, { members: teamMembers }), _jsx(UpcomingDeadlines, { items: deadlineItems })] }), _jsx(RecentActivity, { items: recentActivities })] }) }));
};
