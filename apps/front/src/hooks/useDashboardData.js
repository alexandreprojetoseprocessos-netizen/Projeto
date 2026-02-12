import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { normalizeStatus, STATUS_ORDER, toBackendStatus } from "../utils/status";
const calcProgress = (done, total) => {
    if (!total || total <= 0)
        return 0;
    const safeDone = done ?? 0;
    return Math.min(100, Math.round((safeDone / total) * 100));
};
const formatDateRange = (start, end) => {
    const format = (value) => {
        if (!value)
            return "";
        try {
            return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        }
        catch {
            return "";
        }
    };
    const startLabel = format(start);
    const endLabel = format(end);
    if (!startLabel && !endLabel)
        return "Datas em definição";
    if (startLabel && endLabel)
        return `${startLabel} – ${endLabel}`;
    return startLabel || endLabel;
};
const deriveStatus = (project, progress) => {
    const status = (project.status ?? "").toUpperCase();
    const hasRiskStatus = status === "AT_RISK" || status === "BLOCKED";
    const hasRisksOpen = (project.risksOpen ?? 0) > 0;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const now = new Date();
    if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now.getTime() && progress < 100) {
        return { tone: "late", label: "Atrasado" };
    }
    if (hasRiskStatus || hasRisksOpen) {
        return { tone: "risk", label: "Em risco" };
    }
    if (status === "DONE" || status === "COMPLETED") {
        return { tone: "ok", label: "Concluído" };
    }
    return { tone: "ok", label: "No prazo" };
};
const formatTimeAgo = (value) => {
    if (!value)
        return "há pouco";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "há pouco";
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));
    if (minutes < 60)
        return minutes <= 1 ? "há 1 min" : `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "há 1 dia" : `há ${days} dias`;
};
const STATUS_COLORS = {
    [STATUS_ORDER[0]]: "#94a3b8",
    [STATUS_ORDER[1]]: "#3b82f6",
    [STATUS_ORDER[2]]: "#ef4444",
    [STATUS_ORDER[3]]: "#f97316",
    [STATUS_ORDER[4]]: "#8b5cf6",
    [STATUS_ORDER[5]]: "#22c55e"
};
const PRIORITY_LABELS = {
    CRITICAL: "Urgente",
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baixa"
};
const PRIORITY_COLORS = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#3b82f6",
    LOW: "#94a3b8"
};
const normalizePriorityValue = (value) => {
    const raw = String(value ?? "").trim().toUpperCase();
    if (!raw)
        return "MEDIUM";
    if (raw === "URGENTE" || raw === "URGENT" || raw === "CRITICAL")
        return "CRITICAL";
    if (raw === "ALTA" || raw === "HIGH")
        return "HIGH";
    if (raw === "MEDIA" || raw === "MÉDIA" || raw === "MEDIUM")
        return "MEDIUM";
    if (raw === "BAIXA" || raw === "LOW")
        return "LOW";
    return "MEDIUM";
};
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const startOfDay = (value) => {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    return next;
};
const addDays = (value, days) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
};
const parseDate = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
const resolveBackendStatus = (status) => toBackendStatus(status ?? null);
const isDoneStatus = (status) => resolveBackendStatus(status) === "DONE";
const STATUS_LABELS = {
    BACKLOG: "Nao iniciado",
    TODO: "Planejado",
    IN_PROGRESS: "Em andamento",
    REVIEW: "Em revisao",
    DELAYED: "Em atraso",
    RISK: "Em risco",
    BLOCKED: "Em risco",
    DONE: "Finalizado"
};
const resolveStatusLabel = (status) => STATUS_LABELS[resolveBackendStatus(status)] ?? "Nao iniciado";
const formatMonthLabel = (value) => value
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .replace(/^./, (char) => char.toUpperCase());
const resolveResponsibleName = (node) => {
    const candidates = [
        node?.responsible?.name,
        node?.responsible?.user?.fullName,
        node?.responsible?.user?.email,
        node?.responsible?.email,
        node?.owner?.name,
        node?.owner?.fullName,
        node?.owner?.email,
        node?.responsibleName,
        node?.responsibleEmail,
        node?.assignee?.name,
        node?.assignee?.fullName,
        node?.assignee?.email
    ];
    const matched = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    return matched ? matched.trim() : null;
};
const parseDateForPeriod = (value) => {
    if (!value)
        return null;
    if (value instanceof Date)
        return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "string" && value.includes("/")) {
        const [d, m, y] = value.split("/");
        if (!d || !m || !y)
            return null;
        const parsed = new Date(Number(y), Number(m) - 1, Number(d));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return null;
    return new Date(parsed.getTime() + parsed.getTimezoneOffset() * 60000);
};
const diffDaysInclusive = (start, end) => Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;
const TASK_TYPES = new Set(["TASK", "SUBTASK", "DELIVERABLE", "ACTIVITY", "MILESTONE"]);
const NON_TASK_TYPES = new Set(["PHASE", "STAGE", "GROUP", "FOLDER", "SECTION"]);
const isTaskLikeNode = (node) => {
    if (!node || node.deletedAt)
        return false;
    const rawType = String(node.type ?? "").trim().toUpperCase();
    if (rawType) {
        if (TASK_TYPES.has(rawType))
            return true;
        if (NON_TASK_TYPES.has(rawType))
            return false;
    }
    return Boolean(node.status ||
        node.priority ||
        node.endDate ||
        node.startDate ||
        node.responsible ||
        node.owner);
};
export const useDashboardData = () => {
    const { selectedProjectId, projects, kanbanColumns, summary, portfolio, portfolioLoading, projectToast, orgError, projectsError, comments, serviceCatalog, wbsNodes } = useOutletContext();
    const flattenedTasks = useMemo(() => kanbanColumns.flatMap((column) => column.tasks.map((task) => ({ ...task, column: column.title }))), [kanbanColumns]);
    const flattenedWbsNodes = useMemo(() => {
        const walk = (nodes = []) => nodes.flatMap((node) => [node, ...(node?.children ? walk(node.children) : [])]);
        return walk(wbsNodes ?? []);
    }, [wbsNodes]);
    const taskNodes = useMemo(() => {
        return flattenedWbsNodes.filter((node) => isTaskLikeNode(node));
    }, [flattenedWbsNodes]);
    const portfolioTotals = useMemo(() => {
        const base = { total: 0, done: 0, inProgress: 0 };
        if (!Array.isArray(portfolio) || portfolio.length === 0)
            return base;
        return portfolio.reduce((acc, project) => {
            acc.total += Number(project.tasksTotal ?? 0);
            acc.done += Number(project.tasksDone ?? 0);
            acc.inProgress += Number(project.tasksInProgress ?? 0);
            return acc;
        }, { ...base });
    }, [portfolio]);
    const taskTotals = useMemo(() => {
        if (portfolioTotals.total > 0)
            return portfolioTotals;
        const total = taskNodes.length;
        const done = taskNodes.filter((node) => isDoneStatus(node?.status)).length;
        const inProgress = taskNodes.filter((node) => resolveBackendStatus(node?.status) === "IN_PROGRESS").length;
        return { total, done, inProgress };
    }, [portfolioTotals, taskNodes]);
    const completionRate = useMemo(() => (taskTotals.total > 0 ? Math.round((taskTotals.done / taskTotals.total) * 100) : 0), [taskTotals]);
    const averageProgress = useMemo(() => {
        if (Array.isArray(portfolio) && portfolio.length) {
            const withTotals = portfolio.filter((project) => Number(project.tasksTotal ?? 0) > 0);
            if (!withTotals.length)
                return completionRate;
            const sum = withTotals.reduce((acc, project) => acc + calcProgress(project.tasksDone, project.tasksTotal), 0);
            return Math.round(sum / withTotals.length);
        }
        return completionRate;
    }, [portfolio, completionRate]);
    const { completionRateWeekAgo, completionStreak, completionStreakPrevWeek, overdueTasksDerived, overdueTasksPrevWeek } = useMemo(() => {
        const today = startOfDay(new Date());
        const weekAgo = addDays(today, -7);
        const doneDates = taskNodes
            .filter((node) => isDoneStatus(node?.status))
            .map((node) => parseDate(node?.updatedAt ?? node?.completedAt ?? node?.endDate ?? null))
            .filter(Boolean);
        const doneTimestamps = doneDates.map((date) => startOfDay(date).getTime());
        const countCompletedBy = (reference) => {
            const refTime = reference.getTime();
            return doneTimestamps.filter((timestamp) => timestamp <= refTime).length;
        };
        const completionRateWeekAgoValue = taskTotals.total > 0 ? Math.round((countCompletedBy(weekAgo) / taskTotals.total) * 100) : 0;
        const completionDateSet = new Set(doneTimestamps.map((ts) => new Date(ts).toISOString().slice(0, 10)));
        const getDateKey = (value) => startOfDay(value).toISOString().slice(0, 10);
        const computeStreak = (reference) => {
            let streak = 0;
            let cursor = startOfDay(reference);
            while (completionDateSet.has(getDateKey(cursor))) {
                streak += 1;
                cursor = addDays(cursor, -1);
            }
            return streak;
        };
        const countOverdue = (reference) => {
            const refTime = reference.getTime();
            return taskNodes.filter((node) => {
                const endDate = parseDate(node?.endDate ?? null);
                if (!endDate)
                    return false;
                if (endDate.getTime() >= refTime)
                    return false;
                const status = resolveBackendStatus(node?.status);
                if (status === "DONE") {
                    const completedAt = parseDate(node?.updatedAt ?? node?.completedAt ?? node?.endDate ?? null);
                    if (completedAt && completedAt.getTime() <= refTime)
                        return false;
                }
                return true;
            }).length;
        };
        return {
            completionRateWeekAgo: completionRateWeekAgoValue,
            completionStreak: computeStreak(today),
            completionStreakPrevWeek: computeStreak(weekAgo),
            overdueTasksDerived: countOverdue(today),
            overdueTasksPrevWeek: countOverdue(weekAgo)
        };
    }, [taskNodes, taskTotals.total]);
    const runningTasksCount = useMemo(() => {
        const boardInProgress = flattenedTasks.filter((task) => (task.status ?? task.column ?? "").toUpperCase() === "IN_PROGRESS").length;
        if (typeof summary?.totals?.inProgress === "number")
            return summary.totals.inProgress;
        if (typeof boardInProgress === "number")
            return boardInProgress;
        const summaryRunning = summary?.runningTasks ?? summary?.tasksInProgress;
        return typeof summaryRunning === "number" ? summaryRunning : null;
    }, [flattenedTasks, summary]);
    const activeProjectsCount = useMemo(() => {
        if (Array.isArray(projects))
            return projects.length;
        if (portfolio) {
            const active = portfolio.filter((project) => !["DONE", "COMPLETED", "CANCELED"].includes((project.status ?? "").toUpperCase()));
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
        if (typeof summary?.projectsAtRisk === "number") {
            return summary.projectsAtRisk;
        }
        return null;
    }, [portfolio, summary]);
    const loggedHoursLast14Days = useMemo(() => {
        if (typeof summary?.hoursTracked === "number")
            return summary.hoursTracked;
        const firstWithHours = (portfolio ?? []).find((project) => typeof project.hoursTracked === "number");
        return typeof firstWithHours?.hoursTracked === "number" ? firstWithHours.hoursTracked : null;
    }, [portfolio, summary]);
    const hoursTrackedTotal = useMemo(() => {
        if (Array.isArray(portfolio) && portfolio.length) {
            if (selectedProjectId && selectedProjectId !== "all") {
                const project = portfolio.find((item) => item.projectId === selectedProjectId) ?? null;
                if (project && typeof project.hoursTracked === "number")
                    return project.hoursTracked;
                if (project)
                    return Number(project.hoursTracked ?? 0);
                return 0;
            }
            return portfolio.reduce((acc, project) => acc + Number(project.hoursTracked ?? 0), 0);
        }
        if (typeof summary?.hoursTracked === "number")
            return summary.hoursTracked;
        return 0;
    }, [portfolio, summary, selectedProjectId]);
    const { hoursTrackedThisWeek, hoursTrackedPrevWeek } = useMemo(() => {
        const entries = summary?.timeEntries;
        if (!Array.isArray(entries) || entries.length === 0) {
            return { hoursTrackedThisWeek: 0, hoursTrackedPrevWeek: 0 };
        }
        const today = new Date();
        const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        let current = 0;
        let previous = 0;
        entries.forEach((entry) => {
            const dateKey = String(entry?.date ?? entry?.entryDate ?? "").slice(0, 10);
            if (!dateKey)
                return;
            const [year, month, day] = dateKey.split("-").map(Number);
            if (!year || !month || !day)
                return;
            const entryUtc = Date.UTC(year, month - 1, day);
            const diffDays = Math.floor((todayUtc - entryUtc) / MS_IN_DAY);
            const hours = Number(entry?.hours ?? entry?.totalHours ?? 0);
            if (Number.isNaN(hours))
                return;
            if (diffDays >= 0 && diffDays < 7)
                current += hours;
            else if (diffDays >= 7 && diffDays < 14)
                previous += hours;
        });
        const round = (value) => Math.round(value * 10) / 10;
        return { hoursTrackedThisWeek: round(current), hoursTrackedPrevWeek: round(previous) };
    }, [summary]);
    const hoursTrackedScopeLabel = selectedProjectId === "all" ? "Todos os projetos" : "Projeto atual";
    const plannedHoursTotal = useMemo(() => {
        if (!taskNodes.length)
            return 0;
        const serviceIndex = new Map((serviceCatalog ?? []).map((service) => [service.id, service]));
        const resolvePlannedHours = (node) => {
            const rawServiceHours = typeof node?.serviceHours === "number" ? node.serviceHours : Number(node?.serviceHours ?? NaN);
            if (Number.isFinite(rawServiceHours)) {
                return Math.max(0, rawServiceHours);
            }
            const serviceId = node?.serviceCatalogId ?? null;
            const service = serviceId ? serviceIndex.get(serviceId) ?? null : null;
            if (!service)
                return null;
            const base = service.hoursBase ?? service.hours ?? null;
            const baseHours = Number(base ?? NaN);
            if (!Number.isFinite(baseHours))
                return null;
            const multiplier = Number(node?.serviceMultiplier ?? 1) || 1;
            return Math.max(0, baseHours * multiplier);
        };
        return taskNodes.reduce((sum, node) => {
            const hours = resolvePlannedHours(node);
            return sum + (typeof hours === "number" ? hours : 0);
        }, 0);
    }, [taskNodes, serviceCatalog]);
    const plannedHoursScopeLabel = selectedProjectId === "all" ? "Todos os projetos" : "Projeto atual";
    const { plannedHoursThisWeek, plannedHoursPrevWeek, plannedHoursThisMonth, plannedHoursPrevMonth } = useMemo(() => {
        if (!taskNodes.length) {
            return {
                plannedHoursThisWeek: 0,
                plannedHoursPrevWeek: 0,
                plannedHoursThisMonth: 0,
                plannedHoursPrevMonth: 0
            };
        }
        const serviceIndex = new Map((serviceCatalog ?? []).map((service) => [service.id, service]));
        const resolvePlannedHours = (node) => {
            const rawServiceHours = typeof node?.serviceHours === "number" ? node.serviceHours : Number(node?.serviceHours ?? NaN);
            if (Number.isFinite(rawServiceHours)) {
                return Math.max(0, rawServiceHours);
            }
            const serviceId = node?.serviceCatalogId ?? null;
            const service = serviceId ? serviceIndex.get(serviceId) ?? null : null;
            if (!service)
                return null;
            const base = service.hoursBase ?? service.hours ?? null;
            const baseHours = Number(base ?? NaN);
            if (!Number.isFinite(baseHours))
                return null;
            const multiplier = Number(node?.serviceMultiplier ?? 1) || 1;
            return Math.max(0, baseHours * multiplier);
        };
        const computeHoursForPeriod = (periodStart, periodEndExclusive) => {
            const periodStartDay = startOfDay(periodStart);
            const periodEndDay = startOfDay(periodEndExclusive);
            const periodEndInclusive = addDays(periodEndDay, -1);
            return taskNodes.reduce((sum, node) => {
                const plannedHours = resolvePlannedHours(node);
                if (!plannedHours || plannedHours <= 0)
                    return sum;
                const startDate = parseDateForPeriod(node?.startDate ?? null);
                const endDate = parseDateForPeriod(node?.endDate ?? null);
                if (!startDate && !endDate)
                    return sum;
                let rangeStart = startDate ?? endDate;
                let rangeEnd = endDate ?? startDate;
                if (rangeEnd.getTime() < rangeStart.getTime()) {
                    const temp = rangeStart;
                    rangeStart = rangeEnd;
                    rangeEnd = temp;
                }
                const startDay = startOfDay(rangeStart);
                const endDay = startOfDay(rangeEnd);
                const totalDays = Math.max(1, diffDaysInclusive(startDay, endDay));
                const overlapStart = startDay.getTime() > periodStartDay.getTime() ? startDay : periodStartDay;
                const overlapEnd = endDay.getTime() < periodEndInclusive.getTime() ? endDay : periodEndInclusive;
                if (overlapEnd.getTime() < overlapStart.getTime())
                    return sum;
                const overlapDays = Math.max(1, diffDaysInclusive(overlapStart, overlapEnd));
                const hoursForPeriod = (plannedHours * overlapDays) / totalDays;
                return sum + hoursForPeriod;
            }, 0);
        };
        const today = startOfDay(new Date());
        const mondayIndex = (today.getDay() + 6) % 7;
        const weekStart = addDays(today, -mondayIndex);
        const weekEnd = addDays(weekStart, 7);
        const prevWeekStart = addDays(weekStart, -7);
        const prevWeekEnd = weekStart;
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthEnd = monthStart;
        const round = (value) => Math.round(value * 10) / 10;
        return {
            plannedHoursThisWeek: round(computeHoursForPeriod(weekStart, weekEnd)),
            plannedHoursPrevWeek: round(computeHoursForPeriod(prevWeekStart, prevWeekEnd)),
            plannedHoursThisMonth: round(computeHoursForPeriod(monthStart, monthEnd)),
            plannedHoursPrevMonth: round(computeHoursForPeriod(prevMonthStart, prevMonthEnd))
        };
    }, [serviceCatalog, taskNodes]);
    const { tasksDoneThisMonth, tasksDonePrevMonth } = useMemo(() => {
        if (!taskNodes.length) {
            return { tasksDoneThisMonth: 0, tasksDonePrevMonth: 0 };
        }
        const today = startOfDay(new Date());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const initial = { current: 0, previous: 0 };
        const totals = taskNodes.reduce((count, node) => {
            if (!isDoneStatus(node?.status))
                return count;
            const doneDate = parseDateForPeriod(node?.endDate ?? node?.updatedAt ?? node?.completedAt ?? null);
            if (!doneDate)
                return count;
            if (doneDate >= monthStart && doneDate < nextMonthStart)
                count.current += 1;
            else if (doneDate >= prevMonthStart && doneDate < monthStart)
                count.previous += 1;
            return count;
        }, initial);
        return { tasksDoneThisMonth: totals.current, tasksDonePrevMonth: totals.previous };
    }, [taskNodes]);
    const highlightedProjects = useMemo(() => {
        const candidates = (portfolio ?? []).map((project) => {
            const progress = calcProgress(project.tasksDone, project.tasksTotal);
            const { tone, label } = deriveStatus(project, progress);
            const membersCount = typeof project.membersCount === "number"
                ? project.membersCount
                : Array.isArray(project.teamMembers)
                    ? project.teamMembers.length
                    : null;
            const membersLabel = typeof membersCount === "number" && membersCount >= 0
                ? `${membersCount} membro${membersCount === 1 ? "" : "s"}`
                : "Equipe em definição";
            const tasksDone = project.tasksDone ?? 0;
            const tasksTotal = project.tasksTotal ?? 0;
            const tasksLabel = tasksTotal > 0
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
            if (statusWeightB !== statusWeightA)
                return statusWeightB - statusWeightA;
            if (a.endAt !== b.endAt)
                return a.endAt - b.endAt;
            return b.progress - a.progress;
        })
            .slice(0, 3)
            .map(({ endAt, ...project }) => project);
    }, [portfolio]);
    const projectNameMap = useMemo(() => new Map((projects ?? []).map((project) => [project.id, project.name])), [projects]);
    const teamPerformanceMembers = useMemo(() => {
        if (!taskNodes.length)
            return [];
        const membersMap = new Map();
        let unassignedTotal = 0;
        let unassignedDone = 0;
        taskNodes.forEach((node) => {
            if (node?.deletedAt)
                return;
            const name = resolveResponsibleName(node);
            const isDone = isDoneStatus(node?.status);
            if (!name) {
                unassignedTotal += 1;
                if (isDone)
                    unassignedDone += 1;
                return;
            }
            const key = name.toLowerCase();
            const current = membersMap.get(key) ?? {
                id: `member-${key.replace(/\s+/g, "-")}`,
                name,
                done: 0,
                total: 0
            };
            current.total += 1;
            if (isDone)
                current.done += 1;
            membersMap.set(key, current);
        });
        let members = Array.from(membersMap.values()).map((member) => ({
            ...member,
            percent: calcProgress(member.done, member.total)
        }));
        if (!members.length && unassignedTotal > 0) {
            return [
                {
                    id: "member-unassigned",
                    name: "Sem responsavel",
                    done: unassignedDone,
                    total: unassignedTotal,
                    percent: calcProgress(unassignedDone, unassignedTotal)
                }
            ];
        }
        members = members.sort((a, b) => {
            if (b.done !== a.done)
                return b.done - a.done;
            if (b.percent !== a.percent)
                return b.percent - a.percent;
            return b.total - a.total;
        });
        return members.slice(0, 4);
    }, [taskNodes]);
    const deadlineItems = useMemo(() => {
        if (!taskNodes.length)
            return [];
        const today = startOfDay(new Date());
        const items = taskNodes
            .map((node) => {
            if (node?.deletedAt)
                return null;
            const endDate = parseDate(node?.endDate ?? null);
            if (!endDate)
                return null;
            const isLate = endDate.getTime() < today.getTime() && !isDoneStatus(node?.status);
            const priorityRaw = node?.priority ??
                node?.priorityLabel ??
                node?.priorityLevel ??
                node?.task_priority ??
                node?.taskPriority;
            const priority = PRIORITY_LABELS[normalizePriorityValue(priorityRaw)];
            const baseTitle = String(node?.title ?? node?.name ?? "Tarefa");
            const resolvedProjectId = node?.projectId ?? (selectedProjectId && selectedProjectId !== "all" ? selectedProjectId : null);
            const projectLabel = String(node?.projectName ?? node?.project?.name ?? (resolvedProjectId ? projectNameMap.get(resolvedProjectId) : "")).trim();
            const title = baseTitle;
            const date = formatDateRange(node?.startDate ?? null, node?.endDate ?? null);
            const statusLabel = resolveStatusLabel(node?.status);
            return {
                id: String(node?.id ?? `${title}-${endDate.getTime()}`),
                title,
                projectId: resolvedProjectId,
                projectName: projectLabel || null,
                date,
                priority,
                statusLabel,
                isLate,
                endTime: endDate.getTime()
            };
        })
            .filter(Boolean);
        return items.sort((a, b) => a.endTime - b.endTime);
    }, [taskNodes, projectNameMap, selectedProjectId]);
    const upcomingDeadlines = useMemo(() => {
        if (!deadlineItems.length)
            return [];
        const limit = 4;
        const trimEndTime = (list) => list.slice(0, limit).map(({ endTime, ...item }) => item);
        if (selectedProjectId !== "all") {
            return trimEndTime(deadlineItems);
        }
        const pickedKeys = new Set();
        const pickedIds = new Set();
        const perProject = [];
        deadlineItems.forEach((item) => {
            const key = String(item.projectId ?? item.projectName ?? item.id).toLowerCase();
            if (!pickedKeys.has(key)) {
                pickedKeys.add(key);
                pickedIds.add(item.id);
                perProject.push(item);
            }
        });
        const remaining = deadlineItems.filter((item) => !pickedIds.has(item.id));
        return trimEndTime([...perProject, ...remaining]);
    }, [deadlineItems, selectedProjectId]);
    const upcomingDeadlinesMonth = useMemo(() => {
        if (!deadlineItems.length)
            return [];
        const now = startOfDay(new Date());
        const targetMonth = now.getMonth();
        const targetYear = now.getFullYear();
        return deadlineItems
            .filter((item) => {
            const date = new Date(item.endTime);
            return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
        })
            .map(({ endTime, ...item }) => item);
    }, [deadlineItems]);
    const portfolioSummary = useMemo(() => ({
        activeProjectsCount,
        runningTasksCount,
        riskProjectsCount,
        overdueTasksCount: typeof summary?.overdueTasks === "number"
            ? summary.overdueTasks
            : overdueTasksDerived > 0
                ? overdueTasksDerived
                : null
    }), [activeProjectsCount, riskProjectsCount, runningTasksCount, summary, overdueTasksDerived]);
    const eapStatusSummary = useMemo(() => {
        const counts = STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
        taskNodes.forEach((node) => {
            const normalized = normalizeStatus(node?.status);
            counts[normalized] = (counts[normalized] ?? 0) + 1;
        });
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        return {
            total,
            data: STATUS_ORDER.map((status) => ({
                name: status,
                value: counts[status] ?? 0,
                color: STATUS_COLORS[status]
            }))
        };
    }, [taskNodes]);
    const eapPrioritySummary = useMemo(() => {
        const counts = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };
        taskNodes.forEach((node) => {
            const priorityRaw = node?.priority ??
                node?.priorityLabel ??
                node?.priorityLevel ??
                node?.task_priority ??
                node?.taskPriority;
            const normalized = normalizePriorityValue(priorityRaw);
            counts[normalized] = (counts[normalized] ?? 0) + 1;
        });
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
        return {
            total,
            items: order.map((priority) => ({
                name: PRIORITY_LABELS[priority],
                value: counts[priority] ?? 0,
                color: PRIORITY_COLORS[priority]
            }))
        };
    }, [taskNodes]);
    const eapProgressSummary = useMemo(() => {
        const buildBuckets = (period) => {
            const today = startOfDay(new Date());
            if (period === "weekly") {
                const mondayIndex = (today.getDay() + 6) % 7;
                const weekStart = addDays(today, -mondayIndex);
                return WEEKDAY_LABELS.map((label, index) => ({
                    label,
                    start: addDays(weekStart, index),
                    end: addDays(weekStart, index + 1)
                }));
            }
            if (period === "monthly") {
                const rangeEnd = addDays(today, 1);
                const rangeStart = addDays(rangeEnd, -28);
                return Array.from({ length: 4 }, (_, index) => ({
                    label: `Sem ${index + 1}`,
                    start: addDays(rangeStart, index * 7),
                    end: addDays(rangeStart, (index + 1) * 7)
                }));
            }
            const quarterStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return [-2, -1, 0].map((offset) => {
                const start = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + offset, 1);
                const end = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + offset + 1, 1);
                return { label: formatMonthLabel(start), start, end };
            });
        };
        const buildSeries = (period) => {
            const buckets = buildBuckets(period);
            const createdCounts = new Array(buckets.length).fill(0);
            const completedCounts = new Array(buckets.length).fill(0);
            flattenedWbsNodes.forEach((node) => {
                if (node?.deletedAt)
                    return;
                const createdAt = parseDate(node?.createdAt ?? node?.created_at ?? node?.created ?? node?.startDate ?? null);
                if (createdAt) {
                    const index = buckets.findIndex((bucket) => createdAt >= bucket.start && createdAt < bucket.end);
                    if (index >= 0)
                        createdCounts[index] += 1;
                }
                if (isDoneStatus(node?.status)) {
                    const completedAt = parseDate(node?.updatedAt ?? node?.updated_at ?? node?.completedAt ?? node?.endDate ?? null);
                    if (completedAt) {
                        const index = buckets.findIndex((bucket) => completedAt >= bucket.start && completedAt < bucket.end);
                        if (index >= 0)
                            completedCounts[index] += 1;
                    }
                }
            });
            const data = buckets.map((bucket, index) => ({
                name: bucket.label,
                created: createdCounts[index],
                completed: completedCounts[index]
            }));
            const totalCreated = createdCounts.reduce((sum, value) => sum + value, 0);
            const totalCompleted = completedCounts.reduce((sum, value) => sum + value, 0);
            const efficiency = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
            return {
                data,
                efficiencyLabel: `${efficiency}% eficiência`
            };
        };
        return {
            weekly: buildSeries("weekly"),
            monthly: buildSeries("monthly"),
            quarterly: buildSeries("quarterly")
        };
    }, [flattenedWbsNodes]);
    const recentActivities = useMemo(() => {
        const activityItems = [];
        (comments ?? []).forEach((comment) => {
            const author = comment?.author?.name ?? comment?.authorName ?? "Colaborador";
            const body = comment?.body ?? comment?.text ?? comment?.message ?? "Atualizou o projeto";
            const createdAt = parseDate(comment?.createdAt ?? null);
            if (!createdAt)
                return;
            activityItems.push({
                id: String(comment?.id ?? `${author}-${createdAt.getTime()}`),
                description: `${author} • ${body}`,
                timeAgo: formatTimeAgo(createdAt),
                timestamp: createdAt.getTime()
            });
        });
        taskNodes.forEach((node) => {
            if (node?.deletedAt)
                return;
            const updatedAt = parseDate(node?.updatedAt ?? null);
            const createdAt = parseDate(node?.createdAt ?? null);
            const stamp = updatedAt ?? createdAt;
            if (!stamp)
                return;
            const author = resolveResponsibleName(node) ?? node?.owner?.name ?? "Equipe";
            const title = String(node?.title ?? node?.name ?? "Tarefa");
            const wasCreated = createdAt && updatedAt
                ? Math.abs(updatedAt.getTime() - createdAt.getTime()) < 60000
                : Boolean(createdAt && !updatedAt);
            const action = wasCreated ? "criou a tarefa" : "atualizou a tarefa";
            activityItems.push({
                id: String(node?.id ?? `${author}-${title}-${stamp.getTime()}`),
                description: `${author} • ${action} ${title}`,
                timeAgo: formatTimeAgo(stamp),
                timestamp: stamp.getTime()
            });
        });
        return activityItems
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5)
            .map(({ timestamp, ...item }) => item);
    }, [comments, taskNodes]);
    const isLoading = portfolioLoading;
    return {
        activeProjectsCount,
        runningTasksCount,
        riskProjectsCount,
        loggedHoursLast14Days,
        hoursTrackedTotal,
        hoursTrackedThisWeek,
        hoursTrackedPrevWeek,
        hoursTrackedScopeLabel,
        plannedHoursTotal,
        plannedHoursScopeLabel,
        plannedHoursThisWeek,
        plannedHoursPrevWeek,
        plannedHoursThisMonth,
        plannedHoursPrevMonth,
        tasksDoneThisMonth,
        tasksDonePrevMonth,
        taskTotals,
        completionRate,
        completionRateWeekAgo,
        averageProgress,
        completionStreak,
        completionStreakPrevWeek,
        overdueTasksDerived,
        overdueTasksPrevWeek,
        teamPerformanceMembers,
        upcomingDeadlines,
        upcomingDeadlinesMonth,
        highlightedProjects,
        portfolioSummary,
        eapStatusSummary,
        eapPrioritySummary,
        eapProgressSummary,
        recentActivities,
        isLoading,
        projectToast,
        orgError,
        projectsError
    };
};
