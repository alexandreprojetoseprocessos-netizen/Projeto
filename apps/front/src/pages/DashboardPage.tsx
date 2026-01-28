import { useState } from "react";
import { Calendar, CalendarDays, CheckCircle2, Hourglass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActiveProjects } from "../components/dashboard/ActiveProjects";
import { KPICards } from "../components/dashboard/KPICards";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { TasksByPriority } from "../components/dashboard/TasksByPriority";
import { TasksByStatus } from "../components/dashboard/TasksByStatus";
import { TeamPerformance } from "../components/dashboard/TeamPerformance";
import { UpcomingDeadlines } from "../components/dashboard/UpcomingDeadlines";
import { WeeklyProgress } from "../components/dashboard/WeeklyProgress";
import { useDashboardData, type ProgressPeriod } from "../hooks/useDashboardData";

const safeNumber = (value: number | null | undefined) =>
  typeof value === "number" && !Number.isNaN(value) ? value : 0;

const buildStatusData = (total: number, inProgress: number, blocked: number, avgProgress: number) => {
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

const buildPriorityData = (total: number, overdue: number) => {
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

const buildWeeklyData = (base: number, avgProgress: number) => {
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const weights = [0.6, 0.7, 0.85, 1, 0.9, 0.7, 0.6];

  return labels.map((label, index) => {
    const created = Math.max(0, Math.round(base * weights[index]));
    const completed = Math.max(0, Math.round(created * (avgProgress / 100)));
    return { name: label, created, completed };
  });
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    runningTasksCount,
    riskProjectsCount,
    taskTotals,
    averageProgress,
    overdueTasksDerived,
    plannedHoursTotal,
    plannedHoursScopeLabel,
    plannedHoursThisWeek,
    plannedHoursPrevWeek,
    plannedHoursThisMonth,
    plannedHoursPrevMonth,
    tasksDoneThisMonth,
    tasksDonePrevMonth,
    teamPerformanceMembers,
    upcomingDeadlines,
    upcomingDeadlinesMonth,
    highlightedProjects,
    portfolioSummary,
    eapStatusSummary,
    eapProgressSummary,
    eapPrioritySummary,
    recentActivities,
    projectToast,
    orgError,
    projectsError
  } = useDashboardData();

  const runningCount = safeNumber(portfolioSummary.runningTasksCount ?? taskTotals.inProgress ?? runningTasksCount);
  const overdueCount = safeNumber(portfolioSummary.overdueTasksCount ?? overdueTasksDerived);
  const totalTasks = Math.max(0, taskTotals.total);

  const formatDeltaCount = (current: number, previous: number, label: string) => {
    if (current === 0 && previous === 0) return "Sem histórico";
    const diff = current - previous;
    return `${diff >= 0 ? "+" : ""}${diff} vs ${label}`;
  };

  const formatHours = (value: number) => {
    const totalMinutes = Math.round(Math.max(0, value) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const completionDeltaLabel = formatDeltaCount(tasksDoneThisMonth, tasksDonePrevMonth, "mês anterior");
  const plannedHoursDeltaLabel = plannedHoursTotal > 0 ? "Total previsto" : "Sem histórico";

  const formatDeltaHours = (current: number, previous: number) => {
    if (current === 0 && previous === 0) return "Sem histórico";
    const diff = current - previous;
    const absLabel = formatHours(Math.abs(diff));
    return `${diff >= 0 ? "+" : "-"}${absLabel} vs período anterior`;
  };

  const weeklyHoursDeltaLabel = formatDeltaHours(plannedHoursThisWeek, plannedHoursPrevWeek);
  const monthlyHoursDeltaLabel = formatDeltaHours(plannedHoursThisMonth, plannedHoursPrevMonth);

  const [progressPeriod, setProgressPeriod] = useState<ProgressPeriod>("weekly");

  const kpiItems = [
    {
      label: "Taxa de conclusao",
      value: `${tasksDoneThisMonth}`,
      subLabel: `${tasksDoneThisMonth} tarefa${tasksDoneThisMonth === 1 ? "" : "s"} concluída${tasksDoneThisMonth === 1 ? "" : "s"} no mês`,
      delta: completionDeltaLabel,
      tone: "success" as const,
      icon: CheckCircle2
    },
    {
      label: "Horas por semana",
      value: formatHours(plannedHoursThisWeek),
      subLabel: "Semana atual",
      delta: weeklyHoursDeltaLabel,
      tone: "warning" as const,
      icon: CalendarDays
    },
    {
      label: "Horas por mês",
      value: formatHours(plannedHoursThisMonth),
      subLabel: "Mês atual",
      delta: monthlyHoursDeltaLabel,
      tone: "danger" as const,
      icon: Calendar
    },
    {
      label: "Horas Total Prevista",
      value: formatHours(plannedHoursTotal),
      subLabel: plannedHoursScopeLabel,
      delta: plannedHoursDeltaLabel,
      tone: "info" as const,
      icon: Hourglass
    }
  ];

  const statusPayload =
    eapStatusSummary.total > 0
      ? eapStatusSummary
      : buildStatusData(totalTasks, runningCount, overdueCount, averageProgress);
  const priorityItems =
    eapPrioritySummary.total > 0 ? eapPrioritySummary.items : buildPriorityData(totalTasks, overdueCount);
  const progressSummary = eapProgressSummary[progressPeriod];
  const weeklyData = buildWeeklyData(Math.max(totalTasks, safeNumber(riskProjectsCount)), averageProgress);
  const teamMembers = teamPerformanceMembers;
  const deadlineItems = upcomingDeadlines;

  const alerts = [
    projectToast ? { type: "success-text", message: projectToast } : null,
    orgError ? { type: "error-text", message: orgError } : null,
    projectsError ? { type: "error-text", message: projectsError } : null
  ].filter(Boolean) as { type: string; message: string }[];

  return (
    <div className="page-container dashboard-exec">
      <div className="dashboard-exec__content">
        {alerts.length > 0 && (
          <div className="dashboard-alerts">
            {alerts.map((alert) => (
              <p key={alert.message} className={alert.type}>
                {alert.message}
              </p>
            ))}
          </div>
        )}
        <div className="dashboard-exec__actions">
          <button type="button" className="dashboard-print-button" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
        <KPICards items={kpiItems} />
        <div className="dashboard-grid-2">
          <TasksByStatus data={statusPayload.data} total={statusPayload.total} />
          <TasksByPriority items={priorityItems} />
        </div>
        <WeeklyProgress
          data={progressSummary?.data ?? weeklyData}
          efficiencyLabel={progressSummary?.efficiencyLabel ?? "0% eficiencia"}
          period={progressPeriod}
          onPeriodChange={setProgressPeriod}
        />
        <ActiveProjects projects={highlightedProjects} onOpenProject={(projectId) => navigate(`/projects/${projectId}`)} />
        <div className="dashboard-grid-2">
          <TeamPerformance members={teamMembers} />
          <UpcomingDeadlines items={deadlineItems} monthItems={upcomingDeadlinesMonth} />
        </div>
        <RecentActivity items={recentActivities} />
      </div>
    </div>
  );
};
