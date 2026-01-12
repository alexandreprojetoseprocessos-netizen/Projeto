import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import "./App.css";
import { AuthPage } from "./components/AuthPage";
import { OrganizationSelector } from "./components/OrganizationOnboarding";
import { useAuth } from "./contexts/AuthContext";
import { STATUS_MAP, KANBAN_STATUS_ORDER } from "./components/KanbanBoard";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
import EDTPage from "./pages/EDTPage";
console.log("[EAP route] EDTPage imported from ./pages/EDTPage");
import KanbanPage from "./pages/KanbanPage";
import { toBackendStatus } from "./utils/status";
import { ProjectEDTPage } from "./pages/ProjectEDTPage";
import { ProjectBoardPage } from "./pages/ProjectBoardPage";
import { ProjectTimelinePage } from "./pages/ProjectTimelinePage";
import { ProjectDocumentsPage } from "./pages/ProjectDocumentsPage";
import { ProjectActivitiesPage } from "./pages/ProjectActivitiesPage";
import BoardPage from "./pages/BoardPage";
import TimelinePage from "./pages/TimelinePage";
import ReportsPage from "./pages/ReportsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import PlanPage from "./pages/PlanPage";
import { TeamPage } from "./pages/TeamPage";
import NotFoundPage from "./pages/NotFoundPage";
import LandingPage from "./pages/LandingPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { apiUrl } from "./config/api";
const SELECTED_ORG_KEY = "gp:selectedOrganizationId";
const SELECTED_PROJECT_KEY = "gp:selectedProjectId";
async function fetchJson(path, token, options, organizationId) {
    const headers = new Headers(options?.headers ?? undefined);
    if (!headers.has("Content-Type"))
        headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    if (organizationId)
        headers.set("X-Organization-Id", organizationId);
    const response = await fetch(apiUrl(path), {
        ...options,
        headers
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = body.error ?? body.message ?? `API respondeu com status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.body = body;
        throw error;
    }
    return body;
}
export const App = () => {
    const { status, user, token, signIn, signUp, signOut, error: authError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [subscriptionStatus, setSubscriptionStatus] = useState(status === "authenticated" ? "loading" : "idle");
    const [subscription, setSubscription] = useState(null);
    const [subscriptionError, setSubscriptionError] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(() => {
        if (typeof window === "undefined")
            return null;
        return window.localStorage.getItem(SELECTED_ORG_KEY);
    });
    const [orgError, setOrgError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        if (typeof window === "undefined")
            return null;
        return window.localStorage.getItem(SELECTED_PROJECT_KEY);
    });
    const [projectsError, setProjectsError] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersError, setMembersError] = useState(null);
    const [wbsNodes, setWbsNodes] = useState([]);
    const [wbsError, setWbsError] = useState(null);
    const [serviceCatalog, setServiceCatalog] = useState([]);
    const [serviceCatalogError, setServiceCatalogError] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsError, setCommentsError] = useState(null);
    const [boardColumns, setBoardColumns] = useState([]);
    const [boardError, setBoardError] = useState(null);
    const [ganttTasks, setGanttTasks] = useState([]);
    const [ganttMilestones, setGanttMilestones] = useState([]);
    const [ganttError, setGanttError] = useState(null);
    const [projectSummary, setProjectSummary] = useState(null);
    const [summaryError, setSummaryError] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [attachmentsError, setAttachmentsError] = useState(null);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [portfolio, setPortfolio] = useState([]);
    const [portfolioError, setPortfolioError] = useState(null);
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [reportMetrics, setReportMetrics] = useState(null);
    const [reportMetricsError, setReportMetricsError] = useState(null);
    const [reportMetricsLoading, setReportMetricsLoading] = useState(false);
    const [wbsRefresh, setWbsRefresh] = useState(0);
    const [serviceCatalogRefresh, setServiceCatalogRefresh] = useState(0);
    const fetchSubscription = useCallback(async () => {
        if (status !== "authenticated" || !token) {
            setSubscription(null);
            setSubscriptionStatus("idle");
            setSubscriptionError(null);
            return null;
        }
        setSubscriptionStatus("loading");
        setSubscriptionError(null);
        try {
            const data = await fetchJson("/me/subscription", token);
            const currentSubscription = data.subscription ?? null;
            setSubscription(currentSubscription);
            setSubscriptionStatus(currentSubscription ? "active" : "none");
            return currentSubscription;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao carregar assinatura";
            setSubscriptionStatus("error");
            setSubscriptionError(message);
            setSubscription(null);
            return null;
        }
    }, [status, token]);
    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);
    const [filters, setFilters] = useState({ rangeDays: 7 });
    const [boardRefresh, setBoardRefresh] = useState(0);
    const [commentsRefresh, setCommentsRefresh] = useState(0);
    const [summaryRefresh, setSummaryRefresh] = useState(0);
    const [organizationsRefresh, setOrganizationsRefresh] = useState(0);
    const [organizationLimits, setOrganizationLimits] = useState(null);
    const [projectLimits, setProjectLimits] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskColumn, setNewTaskColumn] = useState("");
    const [newTaskStartDate, setNewTaskStartDate] = useState("");
    const [newTaskEndDate, setNewTaskEndDate] = useState("");
    const [newTaskAssignee, setNewTaskAssignee] = useState("");
    const [newTaskEstimateHours, setNewTaskEstimateHours] = useState("");
    const [commentBody, setCommentBody] = useState("");
    const [timeEntryHours, setTimeEntryHours] = useState("");
    const [timeEntryDate, setTimeEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [timeEntryDescription, setTimeEntryDescription] = useState("");
    const [timeEntryError, setTimeEntryError] = useState(null);
    const kanbanColumns = useMemo(() => {
        const statusOrder = KANBAN_STATUS_ORDER;
        const grouped = statusOrder.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {});
        const wipLimits = {};
        const statusEntries = Object.entries(STATUS_MAP);
        const resolveStatus = (value) => {
            if (!value)
                return undefined;
            const trimmed = value.trim();
            if (!trimmed)
                return undefined;
            const upper = trimmed.toUpperCase();
            if (statusOrder.includes(upper)) {
                return upper;
            }
            const matched = statusEntries.find(([, label]) => label.toLowerCase() === trimmed.toLowerCase());
            return matched ? matched[0] : undefined;
        };
        boardColumns.forEach((column) => {
            const columnStatus = resolveStatus(column.id) ?? resolveStatus(column.label) ?? statusOrder[0];
            if (columnStatus && typeof column.wipLimit === "number") {
                wipLimits[columnStatus] = column.wipLimit;
            }
            (column.tasks ?? []).forEach((rawTask) => {
                const matchedStatus = resolveStatus(rawTask.status) ?? columnStatus ?? statusOrder[0];
                grouped[matchedStatus].push({
                    ...rawTask,
                    status: matchedStatus
                });
            });
        });
        return statusOrder.map((status) => ({
            id: status,
            title: STATUS_MAP[status],
            tasks: grouped[status].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
            wipLimit: wipLimits[status]
        }));
    }, [boardColumns]);
    useEffect(() => {
        if (status !== "authenticated" || !token) {
            setOrganizations([]);
            setSelectedOrganizationId(null);
            setSelectedProjectId(null);
            setOrganizationLimits(null);
            setProjectLimits(null);
            return;
        }
        const loadOrganizations = async () => {
            try {
                setOrgError(null);
                const data = await fetchJson("/me", token);
                const normalized = (data.organizations ?? []).map((org) => ({
                    ...org,
                    status: org.status ?? "ACTIVE",
                    deletedAt: org.deletedAt ?? null,
                    activeProjects: org.activeProjects ??
                        org.projectsCount ??
                        org.projectCount ??
                        0,
                    projectsCount: org.projectsCount ??
                        org.projectCount ??
                        org.activeProjects ??
                        0,
                    domain: org.domain ?? org.domain ?? null,
                    createdAt: org.createdAt ?? org.createdAt,
                    isActive: typeof org.isActive === "boolean" ? org.isActive : true
                }));
                setOrganizations(normalized);
                setOrganizationLimits(data.organizationLimits ?? null);
                setProjectLimits(data.organizationLimits ?? null);
                setSelectedOrganizationId((current) => {
                    if (normalized.length === 0)
                        return null;
                    if (normalized.length === 1)
                        return normalized[0].id;
                    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
                    const candidate = current || stored || null;
                    const exists = candidate && normalized.some((org) => org.id === candidate);
                    return exists ? candidate : null;
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Falha ao carregar organizações";
                setOrgError(message);
                setOrganizations([]);
                setSelectedOrganizationId((current) => current ?? null);
                setOrganizationLimits(null);
                setProjectLimits(null);
            }
        };
        loadOrganizations();
    }, [status, token, organizationsRefresh]);
    useEffect(() => {
        setSelectedProjectId((current) => {
            if (!projects.length)
                return null;
            if (current && projects.some((project) => project.id === current))
                return current;
            return projects[0].id;
        });
    }, [projects]);
    useEffect(() => {
        if (status !== "authenticated")
            return;
        if (subscriptionStatus !== "active")
            return;
        const isEapRoute = location.pathname.toLowerCase().startsWith("/eap");
        if (organizations.length === 0 && location.pathname !== "/organizacao" && !isEapRoute) {
            navigate("/organizacao", { replace: true });
        }
    }, [status, subscriptionStatus, organizations.length, location.pathname, navigate]);
    const [projectsLoaded, setProjectsLoaded] = useState(false);
    const previousOrganizationId = useRef(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (selectedOrganizationId) {
                window.localStorage.setItem(SELECTED_ORG_KEY, selectedOrganizationId);
            }
            else {
                window.localStorage.removeItem(SELECTED_ORG_KEY);
            }
        }
        if (previousOrganizationId.current === selectedOrganizationId) {
            return;
        }
        previousOrganizationId.current = selectedOrganizationId;
        setSelectedProjectId(null);
        setProjects([]);
        setProjectSummary(null);
        setSummaryError(null);
        setMembers([]);
        setMembersError(null);
        setWbsNodes([]);
        setWbsError(null);
        setSelectedNodeId(null);
        setComments([]);
        setCommentsError(null);
        setBoardColumns([]);
        setBoardError(null);
        setGanttTasks([]);
        setGanttMilestones([]);
        setGanttError(null);
        setAttachments([]);
        setAttachmentsError(null);
        setAttachmentsLoading(false);
        setPortfolio([]);
        setPortfolioError(null);
        setPortfolioLoading(false);
        setReportMetrics(null);
        setReportMetricsError(null);
        setReportMetricsLoading(false);
        setNewTaskTitle("");
        setNewTaskColumn("");
        setNewTaskStartDate("");
        setNewTaskEndDate("");
        setNewTaskAssignee("");
        setNewTaskEstimateHours("");
        setCommentBody("");
        setTimeEntryDescription("");
        setTimeEntryError(null);
        setBoardRefresh(0);
        setWbsRefresh(0);
        setCommentsRefresh(0);
        setSummaryRefresh(0);
    }, [selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedOrganizationId) {
            setProjects([]);
            setSelectedProjectId(null);
            setProjectsLoaded(false);
            return;
        }
        const loadProjects = async () => {
            try {
                setProjectsError(null);
                const data = await fetchJson("/projects", token, undefined, selectedOrganizationId);
                const list = data.projects ?? [];
                setProjects(list);
                setProjectsLoaded(true);
                setSelectedProjectId((current) => {
                    if (list.length === 0)
                        return null;
                    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
                    const candidate = current || stored || null;
                    const exists = candidate && list.some((project) => project.id === candidate);
                    return exists ? candidate : list[0].id;
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Falha ao carregar projetos";
                setProjectsError(message);
                setProjectsLoaded(true);
            }
        };
        loadProjects();
    }, [status, token, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setProjectSummary(null);
            return;
        }
        const loadSummary = async () => {
            try {
                setSummaryError(null);
                const query = new URLSearchParams({ rangeDays: String(filters.rangeDays) });
                const data = await fetchJson(`/projects/${selectedProjectId}/summary?${query.toString()}`, token, undefined, selectedOrganizationId);
                setProjectSummary(data);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar resumo";
                setSummaryError(message);
                setProjectSummary(null);
            }
        };
        loadSummary();
    }, [status, token, selectedProjectId, selectedOrganizationId, filters.rangeDays, summaryRefresh]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setMembers([]);
            return;
        }
        const loadMembers = async () => {
            try {
                setMembersError(null);
                const data = await fetchJson(`/projects/${selectedProjectId}/members`, token, undefined, selectedOrganizationId);
                setMembers(data.members ?? []);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar equipe";
                setMembersError(message);
            }
        };
        loadMembers();
    }, [status, token, selectedProjectId, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setServiceCatalog([]);
            return;
        }
        const loadServiceCatalog = async () => {
            try {
                setServiceCatalogError(null);
                const data = await fetchJson(`/service-catalog?projectId=${selectedProjectId}`, token, undefined, selectedOrganizationId);
                setServiceCatalog(data ?? []);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar catálogo de serviços";
                setServiceCatalogError(message);
            }
        };
        loadServiceCatalog();
    }, [status, token, selectedProjectId, selectedOrganizationId, serviceCatalogRefresh]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setWbsNodes([]);
            setSelectedNodeId(null);
            return;
        }
        const loadWbs = async () => {
            try {
                setWbsError(null);
                const data = await fetchJson(`/projects/${selectedProjectId}/wbs`, token, undefined, selectedOrganizationId);
                const nodes = data.nodes ?? [];
                setWbsNodes(nodes);
                setSelectedNodeId((current) => {
                    if (!current)
                        return null;
                    return treeContainsNode(nodes, current) ? current : null;
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar WBS";
                setWbsError(message);
            }
        };
        loadWbs();
    }, [status, token, selectedProjectId, selectedOrganizationId, wbsRefresh]);
    useEffect(() => {
        if (!selectedNodeId || status !== "authenticated" || !token || !selectedOrganizationId) {
            setComments([]);
            return;
        }
        const loadComments = async () => {
            try {
                setCommentsError(null);
                const data = await fetchJson(`/wbs/${selectedNodeId}/comments`, token, undefined, selectedOrganizationId);
                const nextComments = Array.isArray(data) ? data : data?.comments ?? [];
                setComments(nextComments);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar comentários";
                setCommentsError(message);
            }
        };
        loadComments();
    }, [status, token, selectedNodeId, selectedOrganizationId, commentsRefresh]);
    const loadBoardColumns = useCallback(async () => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            return;
        }
        try {
            setBoardError(null);
            const data = await fetchJson(`/projects/${selectedProjectId}/board`, token, undefined, selectedOrganizationId);
            const normalized = (data.columns ?? []).map((column) => ({
                ...column,
                tasks: [...(column.tasks ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            }));
            setBoardColumns(normalized);
            if (normalized.length) {
                setNewTaskColumn((current) => {
                    if (current && normalized.some((column) => column.id === current)) {
                        return current;
                    }
                    return normalized[0].id;
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao carregar quadro";
            setBoardError(message);
        }
    }, [status, token, selectedProjectId, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setBoardColumns([]);
            return;
        }
        loadBoardColumns();
    }, [status, token, selectedProjectId, selectedOrganizationId, boardRefresh, loadBoardColumns]);
    const handleImportServiceCatalog = useCallback(async (file) => {
        if (!file || !token || !selectedProjectId || !selectedOrganizationId) {
            throw new Error("Arquivo e projeto são obrigatórios.");
        }
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(apiUrl(`/service-catalog/import?projectId=${selectedProjectId}`), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Organization-Id": selectedOrganizationId
            },
            body: formData
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = body?.message ?? "Erro ao importar catálogo";
            throw new Error(message);
        }
        setServiceCatalogRefresh((value) => value + 1);
        return body;
    }, [token, selectedProjectId, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setGanttTasks([]);
            setGanttMilestones([]);
            return;
        }
        const loadGantt = async () => {
            try {
                setGanttError(null);
                const data = await fetchJson(`/projects/${selectedProjectId}/gantt`, token, undefined, selectedOrganizationId);
                setGanttTasks(data.tasks ?? []);
                setGanttMilestones(data.milestones ?? []);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar Gantt";
                setGanttError(message);
            }
        };
        loadGantt();
    }, [status, token, selectedProjectId, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
            setAttachments([]);
            setAttachmentsLoading(false);
            return;
        }
        const loadAttachments = async () => {
            try {
                setAttachmentsLoading(true);
                setAttachmentsError(null);
                const data = await fetchJson(`/projects/${selectedProjectId}/attachments`, token, undefined, selectedOrganizationId);
                setAttachments(data.attachments ?? []);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar documentos";
                setAttachmentsError(message);
                setAttachments([]);
            }
            finally {
                setAttachmentsLoading(false);
            }
        };
        loadAttachments();
    }, [status, token, selectedProjectId, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedOrganizationId) {
            setPortfolio([]);
            setPortfolioLoading(false);
            setReportMetrics(null);
            return;
        }
        const loadPortfolio = async () => {
            try {
                setPortfolioLoading(true);
                setPortfolioError(null);
                const data = await fetchJson("/reports/portfolio", token, undefined, selectedOrganizationId);
                setPortfolio(data.projects ?? []);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar portfólio";
                setPortfolioError(message);
                setPortfolio([]);
            }
            finally {
                setPortfolioLoading(false);
            }
        };
        loadPortfolio();
    }, [status, token, selectedOrganizationId]);
    useEffect(() => {
        if (status !== "authenticated" || !token || !selectedOrganizationId) {
            setReportMetrics(null);
            setReportMetricsLoading(false);
            return;
        }
        const loadMetrics = async () => {
            try {
                setReportMetricsLoading(true);
                setReportMetricsError(null);
                const data = await fetchJson("/reports/metrics", token, undefined, selectedOrganizationId);
                setReportMetrics(data);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar relatórios";
                setReportMetricsError(message);
                setReportMetrics(null);
            }
            finally {
                setReportMetricsLoading(false);
            }
        };
        loadMetrics();
    }, [status, token, selectedOrganizationId]);
    const handleCreateTask = async (event) => {
        event.preventDefault();
        if (!token || !selectedProjectId || !selectedOrganizationId || !newTaskColumn || !newTaskTitle.trim()) {
            return false;
        }
        try {
            await fetchJson(`/projects/${selectedProjectId}/board/tasks`, token, {
                method: "POST",
                body: JSON.stringify({
                    title: newTaskTitle,
                    columnId: newTaskColumn,
                    startDate: newTaskStartDate || undefined,
                    endDate: newTaskEndDate || undefined,
                    ownerId: newTaskAssignee || undefined,
                    estimateHours: newTaskEstimateHours ? Number(newTaskEstimateHours) : undefined
                })
            }, selectedOrganizationId);
            setNewTaskTitle("");
            setNewTaskStartDate("");
            setNewTaskEndDate("");
            setNewTaskAssignee("");
            setNewTaskEstimateHours("");
            setBoardRefresh((value) => value + 1);
            setWbsRefresh((value) => value + 1);
            setBoardError(null);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Falha ao criar tarefa";
            setBoardError(message);
            return false;
        }
    };
    const handleCreateComment = async (event) => {
        event.preventDefault();
        if (!token || !selectedNodeId || !selectedOrganizationId || !commentBody.trim())
            return;
        try {
            await fetchJson(`/wbs/${selectedNodeId}/comments`, token, {
                method: "POST",
                body: JSON.stringify({ message: commentBody, body: commentBody })
            }, selectedOrganizationId);
            setCommentBody("");
            setCommentsRefresh((value) => value + 1);
            setCommentsError(null);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao criar comentário";
            setCommentsError(message);
        }
    };
    const handleCreateTimeEntry = async (event) => {
        event.preventDefault();
        if (!token || !selectedNodeId || !selectedOrganizationId || !timeEntryHours || !timeEntryDate)
            return;
        try {
            setTimeEntryError(null);
            await fetchJson(`/wbs/${selectedNodeId}/time-entries`, token, {
                method: "POST",
                body: JSON.stringify({
                    hours: Number(timeEntryHours),
                    entryDate: timeEntryDate,
                    description: timeEntryDescription
                })
            }, selectedOrganizationId);
            setTimeEntryHours("");
            setTimeEntryDescription("");
            setTimeEntryDate(new Date().toISOString().split("T")[0]);
            setSummaryRefresh((value) => value + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao registrar horas";
            setTimeEntryError(message);
        }
    };
    const handleCreateProject = async (payload) => {
        if (!token || !selectedOrganizationId) {
            throw new Error("Selecione uma organização para criar projetos.");
        }
        try {
            const response = await fetchJson("/projects", token, {
                method: "POST",
                body: JSON.stringify(payload)
            }, selectedOrganizationId);
            const createdProject = response.project ?? response;
            if (!createdProject?.id) {
                throw new Error("Projeto criado, mas resposta inesperada da API.");
            }
            setProjects((prev) => {
                if (prev.some((project) => project.id === createdProject.id))
                    return prev;
                return [...prev, { id: createdProject.id, name: createdProject.name }];
            });
            setPortfolio((prev) => {
                if (!Array.isArray(prev))
                    return prev;
                if (prev.some((project) => project.projectId === createdProject.id))
                    return prev;
                return [
                    ...prev,
                    {
                        projectId: createdProject.id,
                        projectName: createdProject.name,
                        clientName: payload.clientName,
                        hoursTracked: 0,
                        tasksTotal: 0,
                        tags: []
                    }
                ];
            });
            setProjectLimits((current) => current
                ? {
                    ...current,
                    used: current.used + 1,
                    remaining: current.max === null ? null : Math.max(current.max - (current.used + 1), 0)
                }
                : current);
            setSelectedProjectId(createdProject.id);
            setProjectsError(null);
        }
        catch (error) {
            const status = error?.status ?? error?.response?.status;
            const code = error?.body?.code ?? error?.response?.data?.code;
            const message = error?.body?.message ??
                error?.response?.data?.message ??
                (error instanceof Error ? error.message : "Erro ao criar projeto");
            if (status === 409 && code === "PROJECT_LIMIT_REACHED") {
                setProjectsError("Você atingiu o limite de projetos do seu plano. Exclua/arquive um projeto ou faça upgrade para continuar.");
            }
            else {
                setProjectsError(message);
            }
            throw error;
        }
    };
    const handleUpdateProject = async (projectId, payload) => {
        if (!token || !selectedOrganizationId) {
            throw new Error("Selecione uma organização antes de editar projeto.");
        }
        const response = await fetchJson(`/projects/${projectId}`, token, {
            method: "PUT",
            body: JSON.stringify(payload)
        }, selectedOrganizationId);
        const updatedProject = response.project ?? response;
        setProjects((current) => current.map((project) => (project.id === projectId ? { ...project, name: updatedProject.name } : project)));
        setPortfolio((current) => current.map((project) => project.projectId === projectId
            ? {
                ...project,
                projectName: updatedProject.name ?? project.projectName,
                clientName: payload.clientName,
                startDate: payload.startDate || project.startDate,
                endDate: payload.endDate || project.endDate
            }
            : project));
    };
    const handleCreateOrganization = async (name, domain) => {
        if (!token)
            return;
        if (!name || !name.trim())
            return;
        const canCreate = organizationLimits?.max === null ||
            organizationLimits?.remaining === null ||
            (organizationLimits?.remaining ?? 0) > 0;
        if (organizationLimits && !canCreate) {
            setOrgError("Limite de organizacoes do plano atingido. Atualize o plano para criar mais.");
            return;
        }
        try {
            const response = await fetchJson("/organizations", token, {
                method: "POST",
                body: JSON.stringify({ name: name.trim(), domain: domain?.trim() || undefined })
            });
            const newOrg = response.organization;
            setOrganizations((current) => {
                if (current.some((organization) => organization.id === newOrg.id)) {
                    return current;
                }
                return [
                    ...current,
                    {
                        id: newOrg.id,
                        name: newOrg.name,
                        role: "OWNER",
                        activeProjects: 0
                    }
                ];
            });
            setOrganizationsRefresh((value) => value + 1);
            setSelectedOrganizationId(newOrg.id);
            navigate("/projects", { replace: true });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao criar organização";
            setOrgError(message);
        }
    };
    const resolveStatus = (value) => {
        if (!value)
            return undefined;
        const upper = value.trim().toUpperCase();
        if (!upper)
            return undefined;
        if (KANBAN_STATUS_ORDER.includes(upper))
            return upper;
        const matched = Object.entries(STATUS_MAP).find(([, label]) => label.toUpperCase() === upper);
        return matched ? matched[0] : undefined;
    };
    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination ||
            !token ||
            !selectedProjectId ||
            !selectedOrganizationId ||
            (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }
        // Normaliza o status alvo
        const newStatus = resolveStatus(destination.droppableId) ?? "BACKLOG";
        // Atualização otimista do estado local
        setBoardColumns((prev) => reorderBoard(prev, source, destination, draggableId, newStatus));
        try {
            // Persiste no backend com o novo status
            await fetchJson(`/projects/${selectedProjectId}/board/tasks/${draggableId}`, token, {
                method: "PATCH",
                body: JSON.stringify({
                    columnId: destination.droppableId,
                    status: newStatus,
                    order: destination.index
                })
            }, selectedOrganizationId);
            // Recarrega para garantir sincronização
            setBoardRefresh((value) => value + 1);
            setWbsRefresh((value) => value + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao mover tarefa";
            setBoardError(message);
            // Em caso de erro, recarrega para reverter
            setBoardRefresh((value) => value + 1);
        }
    };
    const handleWbsMove = async (nodeId, parentId, position) => {
        if (!token || !selectedOrganizationId)
            return;
        setWbsNodes((prev) => updateNodeParent(prev, nodeId, parentId, position));
        try {
            await fetchJson(`/wbs/${nodeId}`, token, {
                method: "PATCH",
                body: JSON.stringify({ parentId, order: position })
            }, selectedOrganizationId);
            setWbsRefresh((value) => value + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao mover item";
            setWbsError(message);
            setWbsRefresh((value) => value + 1);
        }
    };
    const handleWbsUpdate = async (nodeId, changes) => {
        if (!token || !selectedOrganizationId)
            return;
        const { owner, ...rest } = changes;
        const payload = { ...rest };
        if (Object.keys(payload).length === 0 && owner === undefined) {
            return;
        }
        if ("estimateHours" in payload && payload.estimateHours !== undefined) {
            payload.estimateHours =
                payload.estimateHours === null
                    ? null
                    : payload.estimateHours.toString();
        }
        if ("dependencies" in payload) {
            payload.dependencies = Array.isArray(payload.dependencies) ? payload.dependencies : [];
        }
        if ("status" in payload && payload.status !== undefined && payload.status !== null) {
            payload.status = toBackendStatus(payload.status);
        }
        if ("serviceMultiplier" in payload && payload.serviceMultiplier !== undefined && payload.serviceMultiplier !== null) {
            payload.serviceMultiplier = Number(payload.serviceMultiplier);
        }
        // Recalcula serviceHours = hoursBase × multiplier
        const currentNode = findWbsNode(wbsNodes, nodeId);
        if ("serviceMultiplier" in payload && !("serviceCatalogId" in payload) && currentNode?.serviceCatalogId) {
            payload.serviceCatalogId = currentNode.serviceCatalogId;
        }
        const selectedServiceCatalogId = payload.serviceCatalogId ?? currentNode?.serviceCatalogId ?? null;
        const normalizedMultiplier = payload.serviceMultiplier ?? currentNode?.serviceMultiplier ?? (selectedServiceCatalogId ? 1 : undefined);
        if (selectedServiceCatalogId) {
            const catalogItem = serviceCatalog.find((service) => service.id === selectedServiceCatalogId);
            const hoursBaseRaw = catalogItem?.hoursBase ?? catalogItem?.hours ?? null;
            if (hoursBaseRaw !== null && hoursBaseRaw !== undefined) {
                const hoursBase = Number(hoursBaseRaw);
                const multiplierValue = Number(normalizedMultiplier ?? 1);
                if (!Number.isNaN(hoursBase) && !Number.isNaN(multiplierValue)) {
                    payload.serviceMultiplier = payload.serviceMultiplier ?? multiplierValue;
                    payload.serviceHours = hoursBase * multiplierValue;
                }
            }
        }
        const payloadForState = { ...payload, ...(owner !== undefined ? { owner } : {}) };
        setWbsNodes((prev) => patchWbsNode(prev, nodeId, payloadForState));
        try {
            await fetchJson(`/wbs/${nodeId}`, token, {
                method: "PATCH",
                body: JSON.stringify(payload)
            }, selectedOrganizationId);
            setWbsRefresh((value) => value + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao atualizar tarefa";
            setWbsError(message);
            setWbsRefresh((value) => value + 1);
        }
    };
    const handleWbsResponsibleChange = async (nodeId, membershipId) => {
        if (!token || !selectedOrganizationId)
            return;
        const optimisticResponsible = membershipId && members.length
            ? members
                .filter((member) => member.id === membershipId)
                .map((member) => ({
                membershipId: member.id,
                userId: member.userId,
                name: member.name ?? member.email ?? "Responsável"
            }))[0] ?? null
            : null;
        setWbsNodes((prev) => patchWbsNode(prev, nodeId, { responsible: optimisticResponsible }));
        try {
            const response = await fetchJson(`/wbs/${nodeId}/responsible`, token, {
                method: "PATCH",
                body: JSON.stringify({ membershipId: membershipId ?? null })
            }, selectedOrganizationId);
            setWbsNodes((prev) => patchWbsNode(prev, nodeId, { responsible: response.responsible ?? null }));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao atualizar responsável";
            setWbsError(message);
            setWbsRefresh((value) => value + 1);
        }
    };
    const handleCreateWbsItem = async (parentId, data) => {
        if (!token || !selectedOrganizationId || !selectedProjectId)
            return;
        const payload = {
            title: data?.title ?? "Nova tarefa",
            type: "TASK",
            parentId,
            status: toBackendStatus(data?.status ?? "BACKLOG"),
            priority: data?.priority ?? "MEDIUM",
            description: data?.description ?? undefined,
            estimateHours: data?.durationDays !== undefined && data?.durationDays !== null
                ? String(Number(data.durationDays) * 8)
                : undefined,
            startDate: data?.startDate ?? undefined,
            endDate: data?.endDate ?? undefined
        };
        try {
            setWbsError(null);
            const data = await fetchJson(`/projects/${selectedProjectId}/wbs`, token, {
                method: "POST",
                body: JSON.stringify(payload)
            }, selectedOrganizationId);
            const created = data.node ?? null;
            setWbsRefresh((value) => value + 1);
            if (created?.id) {
                setSelectedNodeId(created.id);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao criar tarefa";
            setWbsError(message);
            setWbsRefresh((value) => value + 1);
        }
    };
    const handleDownloadPortfolio = async () => {
        if (!token || !selectedOrganizationId)
            return;
        try {
            const response = await fetch(apiUrl("/reports/portfolio?format=csv"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Organization-Id": selectedOrganizationId
                }
            });
            if (!response.ok)
                throw new Error("Falha ao baixar CSV");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "portfolio.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao exportar CSV";
            setPortfolioError(message);
        }
    };
    const organizationCards = organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        role: organization.role,
        plan: organization.plan ?? null,
        activeProjects: organization.activeProjects ?? 0,
        projectsCount: organization.projectsCount ?? organization.activeProjects ?? 0,
        domain: organization.domain ?? null,
        createdAt: organization.createdAt,
        isActive: typeof organization.isActive === "boolean" ? organization.isActive : true,
        status: organization.status,
        deletedAt: organization.deletedAt
    }));
    const currentOrgRole = organizationCards.find((org) => org.id === selectedOrganizationId)?.role ?? null;
    const handleCreateServiceCatalog = useCallback(async (payload) => {
        if (!token || !selectedProjectId || !selectedOrganizationId) {
            throw new Error("Projeto selecionado é obrigatório.");
        }
        const body = {
            projectId: selectedProjectId,
            name: payload.name,
            description: payload.description ?? null,
            hoursBase: Number(payload.hoursBase)
        };
        await fetchJson("/service-catalog", token, {
            method: "POST",
            body: JSON.stringify(body)
        }, selectedOrganizationId);
        setServiceCatalogRefresh((value) => value + 1);
    }, [token, selectedProjectId, selectedOrganizationId]);
    const handleUpdateServiceCatalog = useCallback(async (serviceId, payload) => {
        if (!token || !selectedOrganizationId) {
            throw new Error("Organização é obrigatória.");
        }
        await fetchJson(`/service-catalog/${serviceId}`, token, {
            method: "PATCH",
            body: JSON.stringify(payload)
        }, selectedOrganizationId);
        setServiceCatalogRefresh((value) => value + 1);
    }, [token, selectedOrganizationId]);
    const handleDeleteServiceCatalog = useCallback(async (serviceId) => {
        if (!token || !selectedOrganizationId) {
            throw new Error("Organização é obrigatória.");
        }
        await fetchJson(`/service-catalog/${serviceId}`, token, {
            method: "DELETE"
        }, selectedOrganizationId);
        setServiceCatalogRefresh((value) => value + 1);
    }, [token, selectedOrganizationId]);
    useEffect(() => {
        try {
            const storedOrgId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
            const storedProjId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
            if (storedOrgId)
                setSelectedOrganizationId(storedOrgId);
            if (storedProjId)
                setSelectedProjectId(storedProjId);
        }
        catch (error) {
            console.error("Falha ao ler organização/projeto salvos", error);
        }
    }, []);
    useEffect(() => {
        if (!organizations.length)
            return;
        if (!selectedOrganizationId) {
            const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
            if (stored && organizations.some((org) => org.id === stored)) {
                setSelectedOrganizationId(stored);
            }
        }
        else {
            const exists = organizations.some((org) => org.id === selectedOrganizationId);
            if (!exists) {
                setSelectedOrganizationId(null);
                if (typeof window !== "undefined")
                    window.localStorage.removeItem(SELECTED_ORG_KEY);
            }
        }
    }, [organizations, selectedOrganizationId]);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        if (selectedProjectId) {
            window.localStorage.setItem(SELECTED_PROJECT_KEY, selectedProjectId);
        }
        else {
            window.localStorage.removeItem(SELECTED_PROJECT_KEY);
        }
    }, [selectedProjectId]);
    useEffect(() => {
        if (!projects.length)
            return;
        if (!selectedProjectId) {
            const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
            if (stored && projects.some((project) => project.id === stored)) {
                setSelectedProjectId(stored);
            }
            else if (projects.length === 1) {
                setSelectedProjectId(projects[0].id);
            }
            return;
        }
        const exists = projects.some((project) => project.id === selectedProjectId);
        if (!exists) {
            setSelectedProjectId(null);
            if (typeof window !== "undefined")
                window.localStorage.removeItem(SELECTED_PROJECT_KEY);
        }
    }, [projects, selectedProjectId]);
    useEffect(() => {
        if (status === "authenticated" && location.pathname === "/") {
            navigate("/dashboard", { replace: true });
        }
    }, [location.pathname, navigate, status]);
    if (status === "loading") {
        return _jsx("p", { style: { padding: "2rem" }, children: "Carregando autentica\u00E7\u00E3o..." });
    }
    if (status === "unauthenticated" || !token) {
        if (location.pathname === "/") {
            return _jsx(LandingPage, {});
        }
        return (_jsx(AuthPage, { onSubmit: async ({ email, password }) => {
                await signIn(email, password);
                navigate("/dashboard", { replace: true });
            }, onSignUp: async ({ email, password }) => {
                await signUp({ email, password });
                // Novo usuário deve concluir o checkout antes de criar organização
                navigate("/checkout", { replace: true });
            }, error: authError }));
    }
    const storedOrganizationId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
    const hasStoredOrganization = Boolean(selectedOrganizationId || storedOrganizationId);
    const isOnCheckoutRoute = location.pathname === "/checkout";
    if (subscriptionStatus === "loading" || subscriptionStatus === "idle") {
        if (isOnCheckoutRoute) {
            // Permite abrir o checkout enquanto o status é carregado
        }
        else {
            return _jsx("p", { style: { padding: "2rem" }, children: "Carregando assinatura..." });
        }
    }
    if (subscriptionStatus !== "active" && !isOnCheckoutRoute) {
        return _jsx(Navigate, { to: "/checkout", replace: true });
    }
    if (status === "authenticated" &&
        subscriptionStatus === "active" &&
        selectedOrganizationId &&
        projectsLoaded &&
        projects.length === 0 &&
        location.pathname === "/dashboard") {
        return _jsx(Navigate, { to: "/projects", replace: true });
    }
    const handleProjectSelection = (projectId) => {
        setSelectedProjectId(projectId);
        if (selectedOrganizationId && projectId) {
            navigate(`/EAP/organizacao/${selectedOrganizationId}/projeto/${projectId}`, { replace: true });
        }
    };
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsxs(Route, { path: "/*", element: _jsx(DashboardLayout, { userEmail: user?.email ?? null, organizations: organizations, selectedOrganizationId: selectedOrganizationId ?? "", onOrganizationChange: setSelectedOrganizationId, currentOrgRole: currentOrgRole ?? null, orgError: orgError, onSignOut: signOut, projects: projects, selectedProjectId: selectedProjectId ?? "", onProjectChange: handleProjectSelection, onSelectProject: handleProjectSelection, projectsError: projectsError, filters: filters, onRangeChange: (rangeDays) => setFilters((prev) => ({ ...prev, rangeDays })), summary: projectSummary, summaryError: summaryError, members: members, membersError: membersError, attachments: attachments, attachmentsError: attachmentsError, attachmentsLoading: attachmentsLoading, boardColumns: boardColumns, boardError: boardError, onCreateTask: handleCreateTask, onReloadBoard: loadBoardColumns, onDragTask: handleDragEnd, newTaskTitle: newTaskTitle, onTaskTitleChange: setNewTaskTitle, newTaskColumn: newTaskColumn, onTaskColumnChange: setNewTaskColumn, newTaskStartDate: newTaskStartDate, onTaskStartDateChange: setNewTaskStartDate, newTaskEndDate: newTaskEndDate, onTaskEndDateChange: setNewTaskEndDate, newTaskAssignee: newTaskAssignee, onTaskAssigneeChange: setNewTaskAssignee, newTaskEstimateHours: newTaskEstimateHours, onTaskEstimateHoursChange: setNewTaskEstimateHours, wbsNodes: wbsNodes, wbsError: wbsError, onMoveNode: handleWbsMove, onUpdateWbsNode: handleWbsUpdate, onUpdateWbsResponsible: handleWbsResponsibleChange, onCreateWbsItem: handleCreateWbsItem, selectedNodeId: selectedNodeId, onSelectNode: setSelectedNodeId, comments: comments, commentsError: commentsError, onSubmitComment: handleCreateComment, commentBody: commentBody, onCommentBodyChange: setCommentBody, timeEntryDate: timeEntryDate, timeEntryHours: timeEntryHours, timeEntryDescription: timeEntryDescription, onTimeEntryDateChange: setTimeEntryDate, onTimeEntryHoursChange: setTimeEntryHours, onTimeEntryDescriptionChange: setTimeEntryDescription, onLogTime: handleCreateTimeEntry, timeEntryError: timeEntryError, ganttTasks: ganttTasks, ganttMilestones: ganttMilestones, ganttError: ganttError, portfolio: portfolio, portfolioError: portfolioError, portfolioLoading: portfolioLoading, reportMetrics: reportMetrics, reportMetricsError: reportMetricsError, reportMetricsLoading: reportMetricsLoading, kanbanColumns: kanbanColumns, onExportPortfolio: handleDownloadPortfolio, onCreateProject: handleCreateProject, onUpdateProject: handleUpdateProject, projectLimits: projectLimits, serviceCatalog: serviceCatalog, serviceCatalogError: serviceCatalogError, onImportServiceCatalog: handleImportServiceCatalog, onCreateServiceCatalog: handleCreateServiceCatalog, onUpdateServiceCatalog: handleUpdateServiceCatalog, onDeleteServiceCatalog: handleDeleteServiceCatalog, onReloadWbs: () => setWbsRefresh((value) => value + 1) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "checkout", element: _jsx(CheckoutPage, { subscription: subscription, subscriptionError: subscriptionError, onSubscriptionActivated: fetchSubscription }) }), _jsx(Route, { path: "organizacao", element: _jsx(OrganizationSelector, { organizations: organizationCards, onSelect: (organizationId) => {
                                setSelectedOrganizationId(organizationId);
                                setSelectedProjectId(null);
                                if (typeof window !== "undefined") {
                                    window.localStorage.setItem(SELECTED_ORG_KEY, organizationId);
                                    window.localStorage.removeItem(SELECTED_PROJECT_KEY);
                                }
                                navigate("/projects", { replace: true });
                            }, onCreateOrganization: handleCreateOrganization, userEmail: user?.email ?? null, currentOrgRole: currentOrgRole ?? null, organizationLimits: organizationLimits, onReloadOrganizations: () => setOrganizationsRefresh((value) => value + 1) }) }), _jsx(Route, { path: "dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "projects", element: _jsx(ProjectsPage, {}) }), _jsx(Route, { path: "projects/:id", element: _jsx(ProjectDetailsPage, {}) }), _jsx(Route, { path: "projects/:id/edt", element: _jsx(ProjectEDTPage, {}) }), _jsx(Route, { path: "projects/:id/board", element: _jsx(ProjectBoardPage, {}) }), _jsx(Route, { path: "projects/:id/cronograma", element: _jsx(ProjectTimelinePage, {}) }), _jsx(Route, { path: "projects/:id/documentos", element: _jsx(ProjectDocumentsPage, {}) }), _jsx(Route, { path: "projects/:id/atividades", element: _jsx(ProjectActivitiesPage, {}) }), _jsx(Route, { path: "EAP/organizacao/:organizationId/projeto/:projectId", element: _jsx(EDTPage, {}) }), _jsx(Route, { path: "EAP", element: selectedOrganizationId && selectedProjectId ? (_jsx(Navigate, { to: `/EAP/organizacao/${selectedOrganizationId}/projeto/${selectedProjectId}`, replace: true })) : (_jsx(Navigate, { to: "/organizacao", replace: true })) }), _jsx(Route, { path: "edt", element: _jsx(Navigate, { to: "/EAP", replace: true }) }), _jsx(Route, { path: "board", element: _jsx(BoardPage, {}) }), _jsx(Route, { path: "kanban", element: _jsx(KanbanPage, {}) }), _jsx(Route, { path: "cronograma", element: _jsx(TimelinePage, {}) }), _jsx(Route, { path: "relatorios", element: _jsx(ReportsPage, {}) }), _jsx(Route, { path: "documentos", element: _jsx(DocumentsPage, {}) }), _jsx(Route, { path: "atividades", element: _jsx(ActivitiesPage, {}) }), _jsx(Route, { path: "plano", element: _jsx(PlanPage, {}) }), _jsx(Route, { path: "equipe", element: _jsx(TeamPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
};
function reorderBoard(columns, source, destination, taskId, newStatus) {
    const nextColumns = columns.map((column) => ({
        ...column,
        tasks: [...column.tasks]
    }));
    const sourceColumn = nextColumns.find((column) => column.id === source.droppableId);
    const destinationColumn = nextColumns.find((column) => column.id === destination.droppableId);
    if (!sourceColumn || !destinationColumn)
        return columns;
    const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
    if (!movedTask)
        return columns;
    // Atualiza a tarefa com o novo status e coluna
    const updatedTask = {
        ...movedTask,
        boardColumnId: destinationColumn.id,
        status: newStatus || destinationColumn.id // Usa o ID da coluna como status
    };
    destinationColumn.tasks.splice(destination.index, 0, updatedTask);
    return nextColumns;
}
function updateNodeParent(nodes, nodeId, parentId, position) {
    const deepClone = (items) => items.map((node) => ({
        ...node,
        children: deepClone(node.children ?? [])
    }));
    const cloned = deepClone(nodes);
    let itemToMove = null;
    const removeFromTree = (items) => items
        .map((node) => {
        if (node.id === nodeId) {
            itemToMove = node;
            return null;
        }
        return { ...node, children: removeFromTree(node.children ?? []) };
    })
        .filter(Boolean);
    const withoutItem = removeFromTree(cloned);
    if (!itemToMove)
        return nodes;
    const movable = itemToMove;
    const insertIntoTree = (items) => items.map((node) => {
        if (node.id === parentId) {
            const children = [...node.children];
            children.splice(position, 0, { ...movable, parentId: node.id });
            return { ...node, children };
        }
        return { ...node, children: insertIntoTree(node.children ?? []) };
    });
    if (!parentId) {
        const topLevel = [...withoutItem];
        topLevel.splice(position, 0, { ...movable, parentId: null });
        return topLevel;
    }
    return insertIntoTree(withoutItem);
}
function patchWbsNode(nodes, nodeId, changes) {
    return nodes.map((node) => {
        if (node.id === nodeId) {
            return { ...node, ...changes };
        }
        if (node.children?.length) {
            return { ...node, children: patchWbsNode(node.children, nodeId, changes) };
        }
        return node;
    });
}
function treeContainsNode(nodes, nodeId) {
    for (const node of nodes) {
        if (node.id === nodeId)
            return true;
        if (node.children?.length && treeContainsNode(node.children, nodeId)) {
            return true;
        }
    }
    return false;
}
function findWbsNode(nodes, nodeId) {
    for (const node of nodes) {
        if (node.id === nodeId)
            return node;
        if (node.children?.length) {
            const found = findWbsNode(node.children, nodeId);
            if (found)
                return found;
        }
    }
    return null;
}
