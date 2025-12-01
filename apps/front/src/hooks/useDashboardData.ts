import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import type { PortfolioProject } from "../components/ProjectPortfolio";

type StatusTone = "ok" | "risk" | "late";

export type HighlightedProject = {
  id: string;
  name: string;
  status: StatusTone;
  statusLabel: string;
  progress: number;
  period: string;
  membersLabel: string;
  tasksLabel: string;
};

export type RecentActivity = {
  id: string;
  description: string;
  timeAgo: string;
};

export type DashboardData = {
  activeProjectsCount: number | null;
  runningTasksCount: number | null;
  riskProjectsCount: number | null;
  loggedHoursLast14Days: number | null;
  highlightedProjects: HighlightedProject[];
  portfolioSummary: {
    activeProjectsCount: number | null;
    runningTasksCount: number | null;
    riskProjectsCount: number | null;
    overdueTasksCount: number | null;
  };
  recentActivities: RecentActivity[];
  isLoading: boolean;
  projectToast: string | null;
  orgError: string | null;
  projectsError: string | null;
};

const calcProgress = (done?: number, total?: number) => {
  if (!total || total <= 0) return 0;
  const safeDone = done ?? 0;
  return Math.min(100, Math.round((safeDone / total) * 100));
};

const formatDateRange = (start?: string | null, end?: string | null) => {
  const format = (value?: string | null) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };
  const startLabel = format(start);
  const endLabel = format(end);
  if (!startLabel && !endLabel) return "Datas em definição";
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel;
};

const deriveStatus = (project: PortfolioProject, progress: number) => {
  const status = (project.status ?? "").toUpperCase();
  const hasRiskStatus = status === "AT_RISK" || status === "BLOCKED";
  const hasRisksOpen = (project.risksOpen ?? 0) > 0;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const now = new Date();
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now.getTime() && progress < 100) {
    return { tone: "late" as StatusTone, label: "Atrasado" };
  }
  if (hasRiskStatus || hasRisksOpen) {
    return { tone: "risk" as StatusTone, label: "Em risco" };
  }
  if (status === "DONE" || status === "COMPLETED") {
    return { tone: "ok" as StatusTone, label: "Concluído" };
  }
  return { tone: "ok" as StatusTone, label: "No prazo" };
};

const formatTimeAgo = (value?: string | number | Date | null) => {
  if (!value) return "há pouco";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "há pouco";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return minutes <= 1 ? "há 1 min" : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
};

export const useDashboardData = (): DashboardData => {
  const {
    projects,
    kanbanColumns,
    summary,
    portfolio,
    portfolioLoading,
    projectToast,
    orgError,
    projectsError,
    comments
  } = useOutletContext<DashboardOutletContext>();

  const flattenedTasks = useMemo(
    () => kanbanColumns.flatMap((column) => column.tasks.map((task) => ({ ...task, column: column.title }))),
    [kanbanColumns]
  );

  const runningTasksCount = useMemo(() => {
    const boardInProgress = flattenedTasks.filter(
      (task) => (task.status ?? task.column ?? "").toUpperCase() === "IN_PROGRESS"
    ).length;
    if (typeof summary?.totals?.inProgress === "number") return summary.totals.inProgress;
    if (typeof boardInProgress === "number") return boardInProgress;
    const summaryRunning = (summary as any)?.runningTasks ?? (summary as any)?.tasksInProgress;
    return typeof summaryRunning === "number" ? summaryRunning : null;
  }, [flattenedTasks, summary]);

  const activeProjectsCount = useMemo(() => {
    if (Array.isArray(projects)) return projects.length;
    if (portfolio) {
      const active = portfolio.filter(
        (project) => !["DONE", "COMPLETED", "CANCELED"].includes((project.status ?? "").toUpperCase())
      );
      return active.length || portfolio.length;
    }
    return null;
  }, [portfolio, projects]);

  const riskProjectsCount = useMemo(() => {
    if (portfolio) {
      const risky = portfolio.filter((project) => {
        const status = (project.status ?? "").toUpperCase();
        const isRiskStatus = status === "AT_RISK" || status === "BLOCKED";
        const hasRisks = (project.risksOpen ?? 0) > 0;
        return isRiskStatus || hasRisks;
      });
      return risky.length;
    }
    if (typeof (summary as any)?.projectsAtRisk === "number") {
      return (summary as any).projectsAtRisk;
    }
    return null;
  }, [portfolio, summary]);

  const loggedHoursLast14Days = useMemo(() => {
    if (typeof summary?.hoursTracked === "number") return summary.hoursTracked;
    const firstWithHours = (portfolio ?? []).find((project) => typeof project.hoursTracked === "number");
    return typeof firstWithHours?.hoursTracked === "number" ? firstWithHours.hoursTracked : null;
  }, [portfolio, summary]);

  const highlightedProjects = useMemo<HighlightedProject[]>(() => {
    const candidates = (portfolio ?? []).map((project) => {
      const progress = calcProgress(project.tasksDone, project.tasksTotal);
      const { tone, label } = deriveStatus(project, progress);
      const membersCount =
        typeof (project as any).membersCount === "number"
          ? (project as any).membersCount
          : Array.isArray((project as any).teamMembers)
            ? (project as any).teamMembers.length
            : null;
      const membersLabel =
        typeof membersCount === "number" && membersCount >= 0
          ? `${membersCount} membro${membersCount === 1 ? "" : "s"}`
          : "Equipe em definição";

      const tasksDone = project.tasksDone ?? 0;
      const tasksTotal = project.tasksTotal ?? 0;
      const tasksLabel =
        tasksTotal > 0
          ? `${tasksDone}/${tasksTotal} tarefas concluídas`
          : tasksDone > 0
            ? `${tasksDone} tarefas concluídas`
            : "Tarefas em andamento";

      const endAt = project.endDate ? new Date(project.endDate).getTime() : Number.POSITIVE_INFINITY;

      return {
        id: project.projectId,
        name: project.projectName,
        status: tone,
        statusLabel: label,
        progress,
        period: formatDateRange(project.startDate, project.endDate),
        membersLabel,
        tasksLabel,
        endAt
      };
    });

    return candidates
      .sort((a, b) => {
        const statusWeightA = a.status === "risk" ? 2 : a.status === "late" ? 1 : 0;
        const statusWeightB = b.status === "risk" ? 2 : b.status === "late" ? 1 : 0;
        if (statusWeightB !== statusWeightA) return statusWeightB - statusWeightA;
        if (a.endAt !== b.endAt) return a.endAt - b.endAt;
        return b.progress - a.progress;
      })
      .slice(0, 3)
      .map(({ endAt, ...project }) => project);
  }, [portfolio]);

  const portfolioSummary = useMemo(
    () => ({
      activeProjectsCount,
      runningTasksCount,
      riskProjectsCount,
      overdueTasksCount: typeof summary?.overdueTasks === "number" ? summary.overdueTasks : null
    }),
    [activeProjectsCount, riskProjectsCount, runningTasksCount, summary]
  );

  const recentActivities = useMemo<RecentActivity[]>(() => {
    const mapped = (comments ?? []).map((comment: any) => {
      const author = comment?.author?.name ?? comment?.authorName ?? "Usuário";
      const body = comment?.body ?? comment?.text ?? "Atualizou o projeto";
      return {
        id: String(comment?.id ?? `${author}-${comment?.createdAt ?? Math.random()}`),
        description: `${author} • ${body}`,
        timeAgo: formatTimeAgo(comment?.createdAt)
      };
    });

    if (mapped.length > 0) {
      return mapped.slice(0, 5);
    }

    return [
      { id: "mock-1", description: "João atualizou o cronograma do projeto 2", timeAgo: "há 3h" },
      { id: "mock-2", description: "Você criou o projeto 'Nova iniciativa'", timeAgo: "há 1 dia" },
      { id: "mock-3", description: "Maria concluiu 5 tarefas no projeto 1", timeAgo: "há 2 dias" }
    ];
  }, [comments]);

  const isLoading = portfolioLoading;

  return {
    activeProjectsCount,
    runningTasksCount,
    riskProjectsCount,
    loggedHoursLast14Days,
    highlightedProjects,
    portfolioSummary,
    recentActivities,
    isLoading,
    projectToast,
    orgError,
    projectsError
  };
};
