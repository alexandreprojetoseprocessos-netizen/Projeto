import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { DropResult } from "@hello-pangea/dnd";
import { DashboardLayout, type CreateProjectPayload } from "./components/DashboardLayout";
import "./App.css";
import { OrganizationSelector } from "./components/OrganizationOnboarding";
import type { PortfolioProject } from "./components/ProjectPortfolio";
import { useAuth } from "./contexts/AuthContext";
import {
  STATUS_MAP,
  KANBAN_STATUS_ORDER,
  type TaskStatus,
  type KanbanTask,
  type KanbanColumn
} from "./components/KanbanBoard";
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
import DiagramPage from "./pages/DiagramPage";
import BoardPage from "./pages/BoardPage";
import TimelinePage from "./pages/TimelinePage";
import ReportsPage from "./pages/ReportsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import PlanPage from "./pages/PlanPage";
import { TeamPage } from "./pages/TeamPage";
import NotFoundPage from "./pages/NotFoundPage";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import { CheckoutPage } from "./pages/CheckoutPage";
import { apiFetch, apiUrl, getNetworkErrorMessage } from "./config/api";
import { getPlanDefinition } from "./config/plans";

type Organization = {
  id: string;
  name: string;
  role: string;
  plan?: string | null;
  activeProjects?: number;
  projectsCount?: number;
  domain?: string | null;
  createdAt?: string;
  isActive?: boolean;
  status?: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED";
  deletedAt?: string | null;
};
type Project = {
  id: string;
  name: string;
  projectId?: string | null;
  projectName?: string | null;
};
type BoardColumn = { id: string; label: string; tasks: any[]; wipLimit?: number };
type WbsNode = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority?: string | null;
  parentId: string | null;
  children: WbsNode[];
  level?: number;
  order?: number | null;
  sortOrder?: number | null;
  wbsCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  owner?: { id: string; name?: string; email?: string | null } | null;
  responsible?:
    | {
        membershipId: string;
        userId: string;
        name: string;
      }
    | null;
  serviceCatalogId?: string | null;
  serviceMultiplier?: number | null;
  serviceHours?: number | null;
  actualHours?: number | null;
  documents?: number | null;
  description?: string | null;
  progress?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  dependencies?: string[] | null;
  estimateHours?: string | null;
};
type BoardResponse = { columns: BoardColumn[] };
const SELECTED_ORG_KEY = "gp:selectedOrganizationId";
const SELECTED_PROJECT_KEY = "gp:selectedProjectId";

async function fetchJson<TResponse = any>(
  path: string,
  token: string,
  options?: RequestInit,
  organizationId?: string
): Promise<TResponse> {
  const headers = new Headers(options?.headers ?? undefined);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (organizationId) headers.set("X-Organization-Id", organizationId);

  let response: Response;
  try {
    response = await apiFetch(path, {
      ...options,
      headers
    });
  } catch (error) {
    const message = getNetworkErrorMessage(error);
    const networkError = new Error(message) as Error & { status?: number; body?: any };
    throw networkError;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (body as any).error ?? (body as any).message ?? `API respondeu com status ${response.status}`;
    const error = new Error(message) as Error & { status?: number; body?: any };
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body as TResponse;
}

export const App = () => {
  const { status, user, token, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeProjectId = useMemo(() => {
    const eapMatch = location.pathname.match(/^\/EAP\/organizacao\/[^/]+\/projeto\/([^/?#]+)/i);
    if (eapMatch?.[1]) {
      try {
        return decodeURIComponent(eapMatch[1]);
      } catch {
        return eapMatch[1];
      }
    }
    const projectMatch = location.pathname.match(/^\/projects\/([^/?#]+)/i);
    if (projectMatch?.[1]) {
      try {
        return decodeURIComponent(projectMatch[1]);
      } catch {
        return projectMatch[1];
      }
    }
    return null;
  }, [location.pathname]);

  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "loading" | "active" | "none" | "error">(
    status === "authenticated" ? "loading" : "idle"
  );
  const [subscription, setSubscription] = useState<any | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_ORG_KEY);
  });
  const [orgError, setOrgError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(SELECTED_PROJECT_KEY);
    return stored === "all" ? null : stored;
  });
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const isAllProjectsSelected = selectedProjectId === "all";
  const activeProjectId = isAllProjectsSelected ? null : selectedProjectId;

const [members, setMembers] = useState<any[]>([]);
const [membersError, setMembersError] = useState<string | null>(null);

const [wbsNodes, setWbsNodes] = useState<WbsNode[]>([]);
const [wbsError, setWbsError] = useState<string | null>(null);
const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);
const [serviceCatalogError, setServiceCatalogError] = useState<string | null>(null);
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [ganttTasks, setGanttTasks] = useState<any[]>([]);
  const [ganttMilestones, setGanttMilestones] = useState<any[]>([]);
  const [ganttError, setGanttError] = useState<string | null>(null);

  const [projectSummary, setProjectSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [portfolioRefresh, setPortfolioRefresh] = useState(0);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
const [reportMetrics, setReportMetrics] = useState<any | null>(null);
const [reportMetricsError, setReportMetricsError] = useState<string | null>(null);
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
      const data = await fetchJson<{ subscription: any }>("/me/subscription", token);
      const currentSubscription = data.subscription ?? null;
      setSubscription(currentSubscription);
      setSubscriptionStatus(currentSubscription ? "active" : "none");
      return currentSubscription;
    } catch (error) {
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
  const [organizationLimits, setOrganizationLimits] = useState<{
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null>(null);
  const [projectLimits, setProjectLimits] = useState<{
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null>(null);

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
  const [timeEntryError, setTimeEntryError] = useState<string | null>(null);

  const kanbanColumns: KanbanColumn[] = useMemo(() => {
    const statusOrder = KANBAN_STATUS_ORDER;
    const grouped = statusOrder.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<TaskStatus, KanbanTask[]>);

    const projectNameMap = new Map(projects.map((project) => [project.id, project.name]));
    const wipLimits: Partial<Record<TaskStatus, number>> = {};
    const statusEntries = Object.entries(STATUS_MAP) as [TaskStatus, string][];

    const resolveStatus = (value?: string | null): TaskStatus | undefined => {
      if (!value) return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const upper = trimmed.toUpperCase();
      if (statusOrder.includes(upper as TaskStatus)) {
        return upper as TaskStatus;
      }
      const matched = statusEntries.find(([, label]) => label.toLowerCase() === trimmed.toLowerCase());
      return matched ? matched[0] : undefined;
    };

    boardColumns.forEach((column) => {
      const columnStatus = resolveStatus(column.id) ?? resolveStatus(column.label) ?? statusOrder[0];
      if (columnStatus && typeof column.wipLimit === "number") {
        wipLimits[columnStatus] = column.wipLimit;
      }
      (column.tasks ?? []).forEach((rawTask: any) => {
        const matchedStatus = resolveStatus(rawTask.status) ?? columnStatus ?? statusOrder[0];
        const resolvedProjectName =
          rawTask.projectName ??
          rawTask.project?.name ??
          (rawTask.projectId ? projectNameMap.get(rawTask.projectId) : null) ??
          (selectedProjectId && selectedProjectId !== "all" ? projectNameMap.get(selectedProjectId) : null);
        grouped[matchedStatus].push({
          ...rawTask,
          status: matchedStatus,
          projectName: resolvedProjectName ?? undefined
        });
      });
    });

    return statusOrder.map((status) => ({
      id: status,
      title: STATUS_MAP[status],
      tasks: grouped[status].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
      wipLimit: wipLimits[status]
    }));
  }, [boardColumns, projects, selectedProjectId]);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      setOrganizations([]);
      setOrganizationsLoaded(false);
      setSelectedOrganizationId(null);
      setSelectedProjectId(null);
      setOrganizationLimits(null);
      setProjectLimits(null);
      return;
    }

    setOrganizationsLoaded(false);

    const loadOrganizations = async () => {
      try {
        setOrgError(null);
        const data = await fetchJson<{ organizations: Organization[]; organizationLimits?: any }>("/me", token);
        const normalized = (data.organizations ?? []).map((org) => ({
          ...org,
          status: (org as any).status ?? "ACTIVE",
          deletedAt: (org as any).deletedAt ?? null,
          activeProjects:
            org.activeProjects ??
            (org as any).projectsCount ??
            (org as any).projectCount ??
            0,
          projectsCount:
            org.projectsCount ??
            (org as any).projectCount ??
            org.activeProjects ??
            0,
          domain: org.domain ?? (org as any).domain ?? null,
          createdAt: org.createdAt ?? (org as any).createdAt,
          isActive: typeof org.isActive === "boolean" ? org.isActive : true
        }));
        setOrganizations(normalized);
        setOrganizationLimits(data.organizationLimits ?? null);
        setOrganizationsLoaded(true);
        setSelectedOrganizationId((current) => {
          if (normalized.length === 0) return null;
          if (normalized.length === 1) return normalized[0].id;
          const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
          const candidate = current || stored || null;
          const exists = candidate && normalized.some((org) => org.id === candidate);
          return exists ? candidate : null;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar organizações";
        setOrgError(message);
        setOrganizations([]);
        setSelectedOrganizationId((current) => current ?? null);
        setOrganizationLimits(null);
        setProjectLimits(null);
        setOrganizationsLoaded(true);
      }
    };

    loadOrganizations();
  }, [status, token, organizationsRefresh]);

  useEffect(() => {
    if (!organizationLimits || !selectedOrganizationId) {
      setProjectLimits(null);
      return;
    }

    const plan = getPlanDefinition(organizationLimits.planCode);
    const maxProjects = plan.limits.projectsPerOrganization;
    const selectedOrg = organizations.find((org) => org.id === selectedOrganizationId) ?? null;
    const usedProjects = selectedOrg?.projectsCount ?? 0;
    const remainingProjects =
      maxProjects === null ? null : Math.max(maxProjects - usedProjects, 0);

    setProjectLimits({
      planCode: plan.code,
      max: maxProjects,
      used: usedProjects,
      remaining: remainingProjects
    });
  }, [organizationLimits, organizations, selectedOrganizationId]);

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null);
      return;
    }
    if (routeProjectId && projects.some((project) => project.id === routeProjectId)) {
      setSelectedProjectId(routeProjectId);
      return;
    }
    setSelectedProjectId((current) => {
      if (current && projects.some((project) => project.id === current)) return current;
      return projects[0].id;
    });
  }, [projects, routeProjectId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (subscriptionStatus !== "active") return;
    if (!organizationsLoaded) return;
    if (orgError) return;
    const isEapRoute = location.pathname.toLowerCase().startsWith("/eap");
    if (organizations.length === 0 && location.pathname !== "/organizacao" && !isEapRoute) {
      navigate("/organizacao", { replace: true });
    }
  }, [status, subscriptionStatus, organizations.length, organizationsLoaded, orgError, location.pathname, navigate]);

  const [projectsLoaded, setProjectsLoaded] = useState(false);

  const previousOrganizationId = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedOrganizationId) {
        window.localStorage.setItem(SELECTED_ORG_KEY, selectedOrganizationId);
      } else {
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
        const data = await fetchJson<{ projects: Project[] }>("/projects", token, undefined, selectedOrganizationId);
        const list = data.projects ?? [];
        setProjects(list);
        setProjectsLoaded(true);
        setSelectedProjectId((current) => {
          if (list.length === 0) return null;
          const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
          const candidate = routeProjectId || current || stored || null;
          const exists = candidate && list.some((project) => project.id === candidate);
          return exists ? candidate : list[0].id;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar projetos";
        setProjectsError(message);
        setProjectsLoaded(true);
      }
    };

    loadProjects();
  }, [status, token, selectedOrganizationId, portfolioRefresh, routeProjectId]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !activeProjectId || !selectedOrganizationId) {
      setProjectSummary(null);
      return;
    }

    const loadSummary = async () => {
      try {
        setSummaryError(null);
        const query = new URLSearchParams({ rangeDays: String(filters.rangeDays) });
        const data = await fetchJson(`/projects/${activeProjectId}/summary?${query.toString()}`, token, undefined, selectedOrganizationId);
        setProjectSummary(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar resumo";
        setSummaryError(message);
        setProjectSummary(null);
      }
    };

    loadSummary();
  }, [status, token, selectedProjectId, selectedOrganizationId, filters.rangeDays, summaryRefresh]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !activeProjectId || !selectedOrganizationId) {
      setMembers([]);
      return;
    }

    const loadMembers = async () => {
      try {
        setMembersError(null);
        const data = await fetchJson(`/projects/${activeProjectId}/members`, token, undefined, selectedOrganizationId);
        setMembers(data.members ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar equipe";
        setMembersError(message);
      }
    };

    loadMembers();
  }, [status, token, selectedProjectId, selectedOrganizationId]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !activeProjectId || !selectedOrganizationId) {
      setServiceCatalog([]);
      return;
    }

    const loadServiceCatalog = async () => {
      try {
        setServiceCatalogError(null);
        const data = await fetchJson(`/service-catalog?projectId=${activeProjectId}`, token, undefined, selectedOrganizationId);
        setServiceCatalog(data ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar catálogo de serviços";
        setServiceCatalogError(message);
      }
    };

    loadServiceCatalog();
  }, [status, token, selectedProjectId, selectedOrganizationId, serviceCatalogRefresh]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      setWbsNodes([]);
      setSelectedNodeId(null);
      return;
    }
    if (selectedProjectId === "all") {
      setSelectedNodeId(null);
      return;
    }
    if (!activeProjectId) {
      setWbsNodes([]);
      setSelectedNodeId(null);
      return;
    }

    const loadWbs = async () => {
      try {
        setWbsError(null);
        const data = await fetchJson(`/projects/${activeProjectId}/wbs`, token, undefined, selectedOrganizationId);
        const nodes = ensureWbsTree(data.nodes ?? []);
        setWbsNodes(nodes);
        setSelectedNodeId((current) => {
          if (!current) return null;
          return treeContainsNode(nodes, current) ? current : null;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar WBS";
        setWbsError(message);
      }
    };

    loadWbs();
  }, [status, token, selectedProjectId, selectedOrganizationId, wbsRefresh]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedOrganizationId || selectedProjectId !== "all") {
      return;
    }
    if (!projects.length) {
      setWbsNodes([]);
      return;
    }

    const loadAllWbs = async () => {
      try {
        setWbsError(null);
        const results = await Promise.allSettled(
          projects.map((project) =>
            fetchJson(`/projects/${project.id}/wbs`, token, undefined, selectedOrganizationId).then((data) => ({
              ...data,
              projectId: project.id,
              projectName: project.name
            }))
          )
        );

        const attachProjectMeta = (
          nodes: WbsNode[] = [],
          meta: { projectId: string; projectName: string }
        ): WbsNode[] =>
          nodes.map((node) => ({
            ...node,
            projectId: meta.projectId,
            projectName: meta.projectName,
            children: attachProjectMeta(node.children ?? [], meta)
          }));

        const merged = results.flatMap((result) => {
          if (result.status !== "fulfilled") return [];
          const { nodes = [], projectId, projectName } = result.value as {
            nodes?: WbsNode[];
            projectId?: string;
            projectName?: string;
          };
          if (!projectId || !projectName) return nodes ?? [];
          const tree = ensureWbsTree(nodes ?? []);
          return attachProjectMeta(tree, { projectId, projectName });
        });

        setWbsNodes(merged);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar WBS";
        setWbsError(message);
      }
    };

    loadAllWbs();
  }, [status, token, selectedProjectId, selectedOrganizationId, projects, wbsRefresh]);

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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar comentários";
        setCommentsError(message);
      }
    };

    loadComments();
  }, [status, token, selectedNodeId, selectedOrganizationId, commentsRefresh]);

  const loadBoardColumns = useCallback(async () => {
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      return;
    }

    if (selectedProjectId === "all") {
      try {
        setBoardError(null);
        if (!projects.length) {
          setBoardColumns([]);
          return;
        }

        const results = await Promise.allSettled(
          projects.map((project) =>
            fetchJson<BoardResponse>(
              `/projects/${project.id}/board`,
              token,
              undefined,
              selectedOrganizationId
            ).then((data) => ({ ...data, projectId: project.id, projectName: project.name }))
          )
        );

        const statusOrder = KANBAN_STATUS_ORDER;
        const statusEntries = Object.entries(STATUS_MAP) as [TaskStatus, string][];
        const resolveStatus = (value?: string | null): TaskStatus | undefined => {
          if (!value) return undefined;
          const trimmed = value.trim();
          if (!trimmed) return undefined;
          const upper = trimmed.toUpperCase();
          if ((statusOrder as readonly string[]).includes(upper)) return upper as TaskStatus;
          const matched = statusEntries.find(([, label]) => label.toUpperCase() === upper);
          return matched ? matched[0] : undefined;
        };

        const aggregated = statusOrder.map((status, index) => ({
          id: status,
          label: STATUS_MAP[status],
          order: index,
          status,
          tasks: [] as KanbanTask[]
        }));

        const columnMap = aggregated.reduce((acc, column) => {
          acc[column.id as TaskStatus] = column;
          return acc;
        }, {} as Record<TaskStatus, (typeof aggregated)[number]>);

        results.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const data = result.value as BoardResponse & { projectId?: string; projectName?: string };
          (data.columns ?? []).forEach((column: any) => {
            const columnStatus =
              resolveStatus(column.status) ??
              resolveStatus(column.id) ??
              resolveStatus(column.label) ??
              statusOrder[0];
            (column.tasks ?? []).forEach((task: any) => {
              const taskStatus = resolveStatus(task.status) ?? columnStatus ?? statusOrder[0];
              const target = columnMap[taskStatus] ?? columnMap[statusOrder[0]];
              target.tasks.push({
                ...task,
                status: taskStatus,
                projectName: task.projectName ?? data.projectName
              });
            });
          });
        });

        aggregated.forEach((column) => {
          column.tasks = [...column.tasks].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
        });

        setBoardColumns(aggregated);
        setNewTaskColumn(statusOrder[0]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar quadro";
        setBoardError(message);
      }
      return;
    }

    if (!activeProjectId) {
      return;
    }

    try {
      setBoardError(null);
      const data = await fetchJson<BoardResponse>(
        `/projects/${activeProjectId}/board`,
        token,
        undefined,
        selectedOrganizationId
      );
      const projectName = projects.find((project) => project.id === activeProjectId)?.name;
      const normalized = (data.columns ?? []).map((column: any) => ({
        ...column,
        tasks: [...(column.tasks ?? [])]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((task: any) => ({
            ...task,
            projectName: task.projectName ?? projectName
          }))
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar quadro";
      setBoardError(message);
    }
  }, [status, token, selectedProjectId, selectedOrganizationId, activeProjectId, projects]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      setBoardColumns([]);
      return;
    }
    if (!activeProjectId && selectedProjectId !== "all") {
      setBoardColumns([]);
      return;
    }

    loadBoardColumns();
  }, [status, token, selectedProjectId, selectedOrganizationId, activeProjectId, boardRefresh, loadBoardColumns]);

  const handleImportServiceCatalog = useCallback(
    async (file: File | null) => {
      if (!file || !token || !activeProjectId || !selectedOrganizationId) {
        throw new Error("Arquivo e projeto são obrigatórios.");
      }
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        apiUrl(`/service-catalog/import?projectId=${activeProjectId}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Organization-Id": selectedOrganizationId
          },
          body: formData
        }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = (body as any)?.message ?? "Erro ao importar catálogo";
        throw new Error(message);
      }
      setServiceCatalogRefresh((value) => value + 1);
      return body;
    },
    [token, selectedProjectId, selectedOrganizationId]
  );

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      setGanttTasks([]);
      setGanttMilestones([]);
      return;
    }

    if (selectedProjectId === "all") {
      if (!projects.length) {
        setGanttTasks([]);
        setGanttMilestones([]);
        return;
      }

      const loadAllGantt = async () => {
        try {
          setGanttError(null);
          const results = await Promise.allSettled(
            projects.map((project) =>
              fetchJson(`/projects/${project.id}/gantt`, token, undefined, selectedOrganizationId).then((data) => ({
                ...data,
                projectId: project.id,
                projectName: project.name
              }))
            )
          );

          const mergedTasks = results.flatMap((result) => {
            if (result.status !== "fulfilled") return [];
            const { tasks = [], projectId, projectName } = result.value as {
              tasks?: any[];
              projectId?: string;
              projectName?: string;
            };
            return (tasks ?? []).map((task) => ({
              ...task,
              projectId,
              projectName
            }));
          });

          const mergedMilestones = results.flatMap((result) => {
            if (result.status !== "fulfilled") return [];
            const { milestones = [], projectId, projectName } = result.value as {
              milestones?: any[];
              projectId?: string;
              projectName?: string;
            };
            return (milestones ?? []).map((milestone) => ({
              ...milestone,
              projectId,
              projectName
            }));
          });

          setGanttTasks(mergedTasks);
          setGanttMilestones(mergedMilestones);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro ao carregar Gantt";
          setGanttError(message);
        }
      };

      loadAllGantt();
      return;
    }

    if (!activeProjectId) {
      setGanttTasks([]);
      setGanttMilestones([]);
      return;
    }

    const loadGantt = async () => {
      try {
        setGanttError(null);
        const data = await fetchJson(`/projects/${activeProjectId}/gantt`, token, undefined, selectedOrganizationId);
        setGanttTasks(data.tasks ?? []);
        setGanttMilestones(data.milestones ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar Gantt";
        setGanttError(message);
      }
    };

    loadGantt();
  }, [status, token, selectedProjectId, selectedOrganizationId, activeProjectId, projects]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      setAttachments([]);
      setAttachmentsLoading(false);
      return;
    }

    const loadAttachments = async () => {
      try {
        setAttachmentsLoading(true);
        setAttachmentsError(null);

        if (selectedProjectId === "all") {
          if (!projects.length) {
            setAttachments([]);
            return;
          }

          const responses = await Promise.all(
            projects.map(async (project) => {
              const projectId = project.id ?? project.projectId;
              if (!projectId) return [];
              const data = await fetchJson<{ attachments: any[] }>(
                `/projects/${projectId}/attachments`,
                token,
                undefined,
                selectedOrganizationId
              );
              const projectName = project.projectName ?? project.name ?? "Projeto";
              return (data.attachments ?? []).map((attachment) => ({
                ...attachment,
                projectId,
                projectName
              }));
            })
          );

          setAttachments(responses.flat());
          return;
        }

        if (!activeProjectId) {
          setAttachments([]);
          return;
        }

        const data = await fetchJson<{ attachments: any[] }>(
          `/projects/${activeProjectId}/attachments`,
          token,
          undefined,
          selectedOrganizationId
        );
        const projectName =
          projects.find((project) => (project.id ?? project.projectId) === activeProjectId)?.projectName ??
          projects.find((project) => (project.id ?? project.projectId) === activeProjectId)?.name ??
          "Projeto";
        setAttachments(
          (data.attachments ?? []).map((attachment) => ({
            ...attachment,
            projectId: activeProjectId,
            projectName
          }))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar documentos";
        setAttachmentsError(message);
        setAttachments([]);
      } finally {
        setAttachmentsLoading(false);
      }
    };

    loadAttachments();
  }, [status, token, selectedProjectId, selectedOrganizationId, activeProjectId, projects]);


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
        const data = await fetchJson<{ projects: PortfolioProject[] }>("/reports/portfolio", token, undefined, selectedOrganizationId);
        setPortfolio(data.projects ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar portfólio";
        setPortfolioError(message);
        setPortfolio([]);
      } finally {
        setPortfolioLoading(false);
      }
    };

    loadPortfolio();
  }, [status, token, selectedOrganizationId, portfolioRefresh]);

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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar relatórios";
        setReportMetricsError(message);
        setReportMetrics(null);
      } finally {
        setReportMetricsLoading(false);
      }
    };

    loadMetrics();
  }, [status, token, selectedOrganizationId]);

    const onReloadPortfolio = () => setPortfolioRefresh((value) => value + 1);

const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !activeProjectId || !selectedOrganizationId || !newTaskColumn || !newTaskTitle.trim()) {
      return false;
    }

    try {
      await fetchJson(
        `/projects/${activeProjectId}/board/tasks`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            title: newTaskTitle,
            columnId: newTaskColumn,
            startDate: newTaskStartDate || undefined,
            endDate: newTaskEndDate || undefined,
            ownerId: newTaskAssignee || undefined,
            estimateHours: newTaskEstimateHours ? Number(newTaskEstimateHours) : undefined
          })
        },
        selectedOrganizationId
      );
      setNewTaskTitle("");
      setNewTaskStartDate("");
      setNewTaskEndDate("");
      setNewTaskAssignee("");
      setNewTaskEstimateHours("");
      setBoardRefresh((value) => value + 1);
      setWbsRefresh((value) => value + 1);
      setBoardError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar tarefa";
      setBoardError(message);
      return false;
    }
  };

  const handleCreateComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedNodeId || !selectedOrganizationId || !commentBody.trim()) return;

    try {
      await fetchJson(
        `/wbs/${selectedNodeId}/comments`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ message: commentBody, body: commentBody })
        },
        selectedOrganizationId
      );
      setCommentBody("");
      setCommentsRefresh((value) => value + 1);
      setCommentsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar comentário";
      setCommentsError(message);
    }
  };

  const handleCreateTimeEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedNodeId || !selectedOrganizationId || !timeEntryHours || !timeEntryDate) return;

    try {
      setTimeEntryError(null);
      await fetchJson(
        `/wbs/${selectedNodeId}/time-entries`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            hours: Number(timeEntryHours),
            entryDate: timeEntryDate,
            description: timeEntryDescription
          })
        },
        selectedOrganizationId
      );
      setTimeEntryHours("");
      setTimeEntryDescription("");
      setTimeEntryDate(new Date().toISOString().split("T")[0]);
      setSummaryRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar horas";
      setTimeEntryError(message);
    }
  };

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    if (!token || !selectedOrganizationId) {
      throw new Error("Selecione uma organização para criar projetos.");
    }

    try {
      const response = await fetchJson<{ project: Project & { clientName?: string } }>(
        "/projects",
        token,
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        selectedOrganizationId
      );

      const createdProject = (response as any).project ?? response;
      if (!createdProject?.id) {
        throw new Error("Projeto criado, mas resposta inesperada da API.");
      }

      setProjects((prev) => {
        if (prev.some((project) => project.id === createdProject.id)) return prev;
        return [...prev, { id: createdProject.id, name: createdProject.name }];
      });
      setPortfolio((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (prev.some((project) => project.projectId === createdProject.id)) return prev;
        return [
          ...prev,
          {
            projectId: createdProject.id,
            projectName: createdProject.name,
            clientName: payload.clientName,
            description: payload.description ?? null,
            status: createdProject.status ?? payload.status ?? "PLANNED",
            priority: createdProject.priority ?? payload.priority ?? "MEDIUM",
            startDate: payload.startDate ?? null,
            endDate: payload.endDate ?? null,
            budget: Number.isFinite(payload.budget) ? payload.budget : null,
            repositoryUrl: payload.repositoryUrl ?? null,
            teamMembers: payload.teamMembers,
            hoursTracked: 0,
            tasksTotal: 0,
            tags: []
          }
        ];
      });
      setOrganizations((current) =>
        current.map((organization) =>
          organization.id === selectedOrganizationId
            ? {
                ...organization,
                activeProjects: (organization.activeProjects ?? 0) + 1,
                projectsCount: (organization.projectsCount ?? 0) + 1
              }
            : organization
        )
      );
      setSelectedProjectId(createdProject.id);
      setProjectsError(null);
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const code = error?.body?.code ?? error?.response?.data?.code;
      const message =
        error?.body?.message ??
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Erro ao criar projeto");

      if (status === 409 && (code === "PLAN_LIMIT_REACHED" || code === "PROJECT_LIMIT_REACHED")) {
        setProjectsError("Limite de projetos do seu plano atingido.");
      } else {
        setProjectsError(message);
      }

      throw error;
    }
  };

  const handleUpdateProject = async (projectId: string, payload: CreateProjectPayload) => {
    if (!token || !selectedOrganizationId) {
      throw new Error("Selecione uma organização antes de editar projeto.");
    }

    const response = await fetchJson(
      `/projects/${projectId}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify(payload)
      },
      selectedOrganizationId
    );
    const updatedProject = (response as any).project ?? response;

    setProjects((current) =>
      current.map((project) => (project.id === projectId ? { ...project, name: updatedProject.name } : project))
    );

    setPortfolio((current) =>
      current.map((project) =>
        project.projectId === projectId
          ? {
              ...project,
              projectName: updatedProject.name ?? project.projectName,
              clientName: payload.clientName,
              description: payload.description !== undefined ? payload.description : updatedProject.description ?? project.description,
              status: updatedProject.status ?? payload.status ?? project.status,
              priority: updatedProject.priority ?? payload.priority ?? project.priority,
              startDate: payload.startDate || project.startDate,
              endDate: payload.endDate || project.endDate
            }
          : project
      )
    );
  };

  const handleCreateOrganization = async (name: string, domain?: string) => {
    if (!token) return;
    if (!name || !name.trim()) return;
    const canCreate =
      organizationLimits?.max === null ||
      organizationLimits?.remaining === null ||
      (organizationLimits?.remaining ?? 0) > 0;
    if (organizationLimits && !canCreate) {
      setOrgError("Limite de organizações do plano atingido. Atualize o plano para criar mais.");
      return;
    }

    try {
      const response = await fetchJson<{ organization: { id: string; name: string } }>(
        "/organizations",
        token,
        {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), domain: domain?.trim() || undefined })
        }
      );
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
            activeProjects: 0,
            projectsCount: 0
          }
        ];
      });
      setOrganizationsRefresh((value) => value + 1);
      setSelectedOrganizationId(newOrg.id);
      navigate("/projects", { replace: true });
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const code = error?.body?.code ?? error?.response?.data?.code;
      const message =
        error?.body?.message ??
        error?.response?.data?.message ??
        (error instanceof Error ? error.message : "Erro ao criar organização");
      if (status === 409 && code === "ORG_LIMIT_REACHED") {
        setOrgError("Limite de organizações do seu plano atingido.");
      } else {
        setOrgError(message);
      }
    }
  };

  const resolveStatus = (value?: string | null): TaskStatus | undefined => {
    if (!value) return undefined;
    const upper = value.trim().toUpperCase();
    if (!upper) return undefined;
    if ((KANBAN_STATUS_ORDER as readonly string[]).includes(upper)) return upper as TaskStatus;
    const matched = Object.entries(STATUS_MAP).find(([, label]) => label.toUpperCase() === upper);
    return matched ? (matched[0] as TaskStatus) : undefined;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (
      !destination ||
      !token ||
      !activeProjectId ||
      !selectedOrganizationId ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    ) {
      return;
    }

    // Normaliza o status alvo
    const newStatus = resolveStatus(destination.droppableId) ?? "BACKLOG";

    // Atualização otimista do estado local
    setBoardColumns((prev) => reorderBoard(prev, source, destination, draggableId, newStatus));
    
    try {
      // Persiste no backend com o novo status
      await fetchJson(
        `/projects/${activeProjectId}/board/tasks/${draggableId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ 
            columnId: destination.droppableId,
            status: newStatus,
            order: destination.index 
          })
        },
        selectedOrganizationId
      );
      
      // Recarrega para garantir sincronização
      setBoardRefresh((value) => value + 1);
      setWbsRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao mover tarefa";
      setBoardError(message);
      // Em caso de erro, recarrega para reverter
      setBoardRefresh((value) => value + 1);
    }
  };

  const handleWbsMove = async (nodeId: string, parentId: string | null, position: number) => {
    if (!token || !selectedOrganizationId) return;
    setWbsNodes((prev) => updateNodeParent(prev, nodeId, parentId, position));

    try {
      await fetchJson(
        `/wbs/${nodeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ parentId, order: position })
        },
        selectedOrganizationId
      );
      setWbsRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao mover item";
      setWbsError(message);
      setWbsRefresh((value) => value + 1);
    }
  };

  const normalizePriority = (value?: string | null) => {
    const raw = String(value ?? "").trim().toUpperCase();
    if (!raw) return "MEDIUM";
    if (raw === "URGENTE" || raw === "URGENT" || raw === "CRITICAL") return "CRITICAL";
    if (raw === "ALTA" || raw === "HIGH") return "HIGH";
    if (raw === "MEDIA" || raw === "MÉDIA" || raw === "MEDIUM") return "MEDIUM";
    if (raw === "BAIXA" || raw === "LOW") return "LOW";
    return "MEDIUM";
  };

  const handleWbsUpdate = async (
    nodeId: string,
    changes: {
      title?: string;
      status?: string;
      priority?: string;
      startDate?: string | null;
      endDate?: string | null;
      description?: string | null;
      estimateHours?: number | null;
      dependencies?: string[];
      ownerId?: string | null;
      owner?: { id: string; name?: string; email?: string | null } | null;
      serviceCatalogId?: string | null;
      serviceMultiplier?: number | null;
      serviceHours?: number | null;
    }
  ) => {
    if (!token || !selectedOrganizationId) return;
    const { owner, ...rest } = changes;
    const payload: Record<string, any> = { ...rest };
    if (Object.keys(payload).length === 0 && owner === undefined) {
      return;
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

    // Recalcula datas automaticamente quando a dependência muda
    const currentNode = findWbsNode(wbsNodes, nodeId);
    if (
      "dependencies" in payload &&
      Array.isArray(payload.dependencies) &&
      payload.dependencies.length > 0 &&
      !("startDate" in payload) &&
      !("endDate" in payload)
    ) {
      const derivedSchedule = resolveDependencySchedule(wbsNodes, payload.dependencies, currentNode);
      if (derivedSchedule) {
        payload.startDate = derivedSchedule.startDate;
        payload.endDate = derivedSchedule.endDate;
        payload.estimateHours = derivedSchedule.estimateHours;
      }
    }

    if ("estimateHours" in payload && payload.estimateHours !== undefined) {
      payload.estimateHours =
        payload.estimateHours === null
          ? null
          : payload.estimateHours.toString();
    }

    // Recalcula serviceHours = hoursBase × multiplier
    if ("priority" in payload && payload.priority !== undefined && payload.priority !== null) {
      const normalizedPriority = normalizePriority(payload.priority);
      payload.priority = normalizedPriority;
      if (currentNode && "prioridade" in currentNode) payload.prioridade = normalizedPriority;
      if (currentNode && "task_priority" in currentNode) payload.task_priority = normalizedPriority;
      if (currentNode && "taskPriority" in currentNode) payload.taskPriority = normalizedPriority;
    }
    if ("serviceMultiplier" in payload && !("serviceCatalogId" in payload) && currentNode?.serviceCatalogId) {
      payload.serviceCatalogId = currentNode.serviceCatalogId;
    }
    const selectedServiceCatalogId = payload.serviceCatalogId ?? currentNode?.serviceCatalogId ?? null;
    const normalizedMultiplier =
      payload.serviceMultiplier ?? currentNode?.serviceMultiplier ?? (selectedServiceCatalogId ? 1 : undefined);

    if (selectedServiceCatalogId) {
      const catalogItem = serviceCatalog.find((service: any) => service.id === selectedServiceCatalogId);
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
      await fetchJson(
        `/wbs/${nodeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        },
        selectedOrganizationId
      );
      setWbsRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar tarefa";
      setWbsError(message);
      setWbsRefresh((value) => value + 1);
    }
  };

  const handleWbsResponsibleChange = async (nodeId: string, membershipId: string | null) => {
    if (!token || !selectedOrganizationId) return;

    const optimisticResponsible =
      membershipId && members.length
        ? members
            .filter((member: any) => member.id === membershipId)
            .map((member: any) => ({
              membershipId: member.id,
              userId: member.userId,
              name: member.name ?? member.email ?? "Responsável"
            }))[0] ?? null
        : null;

    setWbsNodes((prev) => patchWbsNode(prev, nodeId, { responsible: optimisticResponsible }));

    try {
      const response = await fetchJson<{ id: string; responsible: WbsNode["responsible"] }>(
        `/wbs/${nodeId}/responsible`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ membershipId: membershipId ?? null })
        },
        selectedOrganizationId
      );

      setWbsNodes((prev) => patchWbsNode(prev, nodeId, { responsible: response.responsible ?? null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar responsável";
      setWbsError(message);
      setWbsRefresh((value) => value + 1);
    }
  };

  const handleCreateWbsItem = async (parentId: string | null, data?: Record<string, any>) => {
    if (!token || !selectedOrganizationId || !activeProjectId) return;

    const payload: Record<string, any> = {
      title: data?.title ?? "Nova tarefa",
      type: "TASK",
      parentId,
      status: toBackendStatus(data?.status ?? "BACKLOG"),
      priority: data?.priority ?? "MEDIUM",
      description: data?.description ?? undefined,
      estimateHours:
        data?.durationDays !== undefined && data?.durationDays !== null
          ? String(Number(data.durationDays) * 8)
          : undefined,
      startDate: data?.startDate ?? undefined,
      endDate: data?.endDate ?? undefined
    };

    try {
      setWbsError(null);
      const data = await fetchJson(
        `/projects/${activeProjectId}/wbs`,
        token,
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        selectedOrganizationId
      );
      const created = (data as any).node ?? null;
      setWbsRefresh((value) => value + 1);
      if (created?.id) {
        setSelectedNodeId(created.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar tarefa";
      setWbsError(message);
      setWbsRefresh((value) => value + 1);
    }
  };

  const handleDownloadPortfolio = async () => {
    if (!token || !selectedOrganizationId) return;

    try {
      const response = await fetch(apiUrl("/reports/portfolio?format=csv"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Organization-Id": selectedOrganizationId
        }
      });
      if (!response.ok) throw new Error("Falha ao baixar CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "portfolio.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
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

  const handleCreateServiceCatalog = useCallback(
    async (payload: { name: string; hoursBase: number; description?: string | null }) => {
      if (!token || !activeProjectId || !selectedOrganizationId) {
        throw new Error("Projeto selecionado é obrigatório.");
      }

      const body = {
        projectId: activeProjectId,
        name: payload.name,
        description: payload.description ?? null,
        hoursBase: Number(payload.hoursBase)
      };

      await fetchJson(
        "/service-catalog",
        token,
        {
          method: "POST",
          body: JSON.stringify(body)
        },
        selectedOrganizationId
      );

      setServiceCatalogRefresh((value) => value + 1);
    },
    [token, selectedProjectId, selectedOrganizationId]
  );

  const handleUpdateServiceCatalog = useCallback(
    async (serviceId: string, payload: { name?: string; hoursBase?: number; description?: string | null }) => {
      if (!token || !selectedOrganizationId) {
        throw new Error("Organização é obrigatória.");
      }

      await fetchJson(
        `/service-catalog/${serviceId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload)
        },
        selectedOrganizationId
      );

      setServiceCatalogRefresh((value) => value + 1);
    },
    [token, selectedOrganizationId]
  );

  const handleDeleteServiceCatalog = useCallback(
    async (serviceId: string) => {
      if (!token || !selectedOrganizationId) {
        throw new Error("Organização é obrigatória.");
      }

      await fetchJson(
        `/service-catalog/${serviceId}`,
        token,
        {
          method: "DELETE"
        },
        selectedOrganizationId
      );

      setServiceCatalogRefresh((value) => value + 1);
    },
    [token, selectedOrganizationId]
  );
  useEffect(() => {
    try {
      const storedOrgId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
      const storedProjId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
      if (storedOrgId) setSelectedOrganizationId(storedOrgId);
      if (storedProjId && storedProjId !== "all") setSelectedProjectId(storedProjId);
    } catch (error) {
      console.error("Falha ao ler organização/projeto salvos", error);
    }
  }, []);

  useEffect(() => {
    if (!organizations.length) return;
    if (!selectedOrganizationId) {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
      if (stored && organizations.some((org) => org.id === stored)) {
        setSelectedOrganizationId(stored);
      }
    } else {
      const exists = organizations.some((org) => org.id === selectedOrganizationId);
      if (!exists) {
        setSelectedOrganizationId(null);
        if (typeof window !== "undefined") window.localStorage.removeItem(SELECTED_ORG_KEY);
      }
    }
  }, [organizations, selectedOrganizationId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedProjectId && selectedProjectId !== "all") {
      window.localStorage.setItem(SELECTED_PROJECT_KEY, selectedProjectId);
    } else {
      window.localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!projects.length) return;
    if (routeProjectId && projects.some((project) => project.id === routeProjectId)) {
      if (selectedProjectId !== routeProjectId) {
        setSelectedProjectId(routeProjectId);
      }
      return;
    }
    if (!selectedProjectId) {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_PROJECT_KEY) : null;
      if (stored && stored !== "all" && projects.some((project) => project.id === stored)) {
        setSelectedProjectId(stored);
      } else if (projects.length === 1) {
        setSelectedProjectId(projects[0].id);
      }
      return;
    }
    if (selectedProjectId === "all") {
      if (projects.length) {
        setSelectedProjectId(projects[0].id);
      }
      return;
    }
    const exists = projects.some((project) => project.id === selectedProjectId);
    if (!exists) {
      setSelectedProjectId(null);
      if (typeof window !== "undefined") window.localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, [projects, selectedProjectId, routeProjectId]);

  useEffect(() => {
    if (status === "authenticated" && location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, navigate, status]);

  if (status === "loading") {
    return <p style={{ padding: "2rem" }}>Carregando autenticação...</p>;
  }

  if (status === "unauthenticated" || !token) {
    if (location.pathname === "/") {
      return <Landing />;
    }
    return <Auth />;
  }

  const storedOrganizationId = typeof window !== "undefined" ? window.localStorage.getItem(SELECTED_ORG_KEY) : null;
  const hasStoredOrganization = Boolean(selectedOrganizationId || storedOrganizationId);
  const isOnCheckoutRoute = location.pathname === "/checkout";
  
  if (subscriptionStatus === "loading" || subscriptionStatus === "idle") {
    if (isOnCheckoutRoute) {
      // Permite abrir o checkout enquanto o status é carregado
    } else {
      return <p style={{ padding: "2rem" }}>Carregando assinatura...</p>;
    }
  }

  if (subscriptionStatus !== "active" && !isOnCheckoutRoute) {
    return <Navigate to="/checkout" replace />;
  }

  if (
    status === "authenticated" &&
    subscriptionStatus === "active" &&
    selectedOrganizationId &&
    projectsLoaded &&
    projects.length === 0 &&
    location.pathname === "/dashboard"
  ) {
    return <Navigate to="/projects" replace />;
  }

  const handleProjectSelection = (projectId: string) => {
    const currentPath = location.pathname;
    const lowerPath = currentPath.toLowerCase();

    if (projectId === "all") {
      const fallback = projects[0]?.id ?? "";
      if (fallback) {
        setSelectedProjectId(fallback);
      } else {
        setSelectedProjectId(null);
      }
      setSelectedNodeId(null);
      return;
    }

    setSelectedProjectId(projectId);
    if (!projectId) return;

    if (lowerPath.includes("/eap") || lowerPath.includes("/edt")) {
      if (selectedOrganizationId) {
        navigate(`/EAP/organizacao/${selectedOrganizationId}/projeto/${projectId}`, { replace: true });
      }
      return;
    }

    if (lowerPath.startsWith("/projects/")) {
      const suffix = currentPath.replace(/\/projects\/[^/]+/i, "");
      navigate(`/projects/${projectId}${suffix}`, { replace: true });
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/*"
        element={
          <DashboardLayout
            userEmail={user?.email ?? null}
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId ?? ""}
            onOrganizationChange={setSelectedOrganizationId}
            currentOrgRole={(currentOrgRole as any) ?? null}
            orgError={orgError}
            onSignOut={signOut}
            projects={projects}
            selectedProjectId={selectedProjectId ?? ""}
            onProjectChange={handleProjectSelection}
            onSelectProject={handleProjectSelection}
            projectsError={projectsError}
            filters={filters}
            onRangeChange={(rangeDays) => setFilters((prev) => ({ ...prev, rangeDays }))}
            summary={projectSummary}
            summaryError={summaryError}
            members={members}
            membersError={membersError}
            attachments={attachments}
            attachmentsError={attachmentsError}
            attachmentsLoading={attachmentsLoading}
            boardColumns={boardColumns}
            boardError={boardError}
            onCreateTask={handleCreateTask}
            onReloadBoard={loadBoardColumns}
            onDragTask={handleDragEnd}
            newTaskTitle={newTaskTitle}
            onTaskTitleChange={setNewTaskTitle}
            newTaskColumn={newTaskColumn}
            onTaskColumnChange={setNewTaskColumn}
            newTaskStartDate={newTaskStartDate}
            onTaskStartDateChange={setNewTaskStartDate}
            newTaskEndDate={newTaskEndDate}
            onTaskEndDateChange={setNewTaskEndDate}
            newTaskAssignee={newTaskAssignee}
            onTaskAssigneeChange={setNewTaskAssignee}
            newTaskEstimateHours={newTaskEstimateHours}
            onTaskEstimateHoursChange={setNewTaskEstimateHours}
            wbsNodes={wbsNodes}
            wbsError={wbsError}
            onMoveNode={handleWbsMove}
            onUpdateWbsNode={handleWbsUpdate}
            onUpdateWbsResponsible={handleWbsResponsibleChange}
            onCreateWbsItem={handleCreateWbsItem}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            comments={comments}
            commentsError={commentsError}
            onSubmitComment={handleCreateComment}
            commentBody={commentBody}
            onCommentBodyChange={setCommentBody}
            timeEntryDate={timeEntryDate}
            timeEntryHours={timeEntryHours}
            timeEntryDescription={timeEntryDescription}
            onTimeEntryDateChange={setTimeEntryDate}
            onTimeEntryHoursChange={setTimeEntryHours}
            onTimeEntryDescriptionChange={setTimeEntryDescription}
            onLogTime={handleCreateTimeEntry}
            timeEntryError={timeEntryError}
            ganttTasks={ganttTasks}
            ganttMilestones={ganttMilestones}
            ganttError={ganttError}
            portfolio={portfolio}
            portfolioError={portfolioError}
            portfolioLoading={portfolioLoading}
            reportMetrics={reportMetrics}
            reportMetricsError={reportMetricsError}
            reportMetricsLoading={reportMetricsLoading}
            kanbanColumns={kanbanColumns}
            onExportPortfolio={handleDownloadPortfolio}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            projectLimits={projectLimits}
            serviceCatalog={serviceCatalog}
            serviceCatalogError={serviceCatalogError}
            onImportServiceCatalog={handleImportServiceCatalog}
            onCreateServiceCatalog={handleCreateServiceCatalog}
            onUpdateServiceCatalog={handleUpdateServiceCatalog}
            onDeleteServiceCatalog={handleDeleteServiceCatalog}
            onReloadWbs={() => setWbsRefresh((value) => value + 1)}
          />
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="checkout"
          element={
            <CheckoutPage
              subscription={subscription}
              subscriptionError={subscriptionError}
              onSubscriptionActivated={fetchSubscription}
            />
          }
        />
        <Route
          path="organizacao"
          element={
            <OrganizationSelector
              organizations={organizationCards}
              onSelect={(organizationId: string) => {
                setSelectedOrganizationId(organizationId);
                setSelectedProjectId(null);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(SELECTED_ORG_KEY, organizationId);
                  window.localStorage.removeItem(SELECTED_PROJECT_KEY);
                }
                navigate("/projects", { replace: true });
              }}
              onCreateOrganization={handleCreateOrganization}
              userEmail={user?.email ?? null}
              currentOrgRole={(currentOrgRole as any) ?? null}
              organizationLimits={organizationLimits}
              onReloadOrganizations={() => setOrganizationsRefresh((value) => value + 1)}
            />
          }
        />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailsPage />} />
        <Route path="projects/:id/edt" element={<ProjectEDTPage />} />
        <Route path="projects/:id/board" element={<ProjectBoardPage />} />
        <Route path="projects/:id/cronograma" element={<ProjectTimelinePage />} />
        <Route path="projects/:id/documentos" element={<ProjectDocumentsPage />} />
        <Route path="projects/:id/atividades" element={<ProjectActivitiesPage />} />
        <Route
          path="EAP/organizacao/:organizationId/projeto/:projectId"
          element={<EDTPage />}
        />
        <Route
          path="EAP"
          element={
            selectedOrganizationId && activeProjectId ? (
              <Navigate
                to={`/EAP/organizacao/${selectedOrganizationId}/projeto/${activeProjectId}`}
                replace
              />
            ) : (
              <Navigate to="/organizacao" replace />
            )
          }
        />
        <Route path="edt" element={<Navigate to="/EAP" replace />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="cronograma" element={<TimelinePage />} />
        <Route path="diagrama" element={<DiagramPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="atividades" element={<ActivitiesPage />} />
        <Route path="plano" element={<PlanPage />} />
        <Route path="equipe" element={<TeamPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

function reorderBoard(
  columns: BoardColumn[], 
  source: any, 
  destination: any, 
  taskId: string,
  newStatus?: string
) {
  const nextColumns = columns.map((column) => ({
    ...column,
    tasks: [...column.tasks]
  }));

  const sourceColumn = nextColumns.find((column) => column.id === source.droppableId);
  const destinationColumn = nextColumns.find((column) => column.id === destination.droppableId);
  if (!sourceColumn || !destinationColumn) return columns;

  const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
  if (!movedTask) return columns;

  // Atualiza a tarefa com o novo status e coluna
  const updatedTask = {
    ...movedTask,
    boardColumnId: destinationColumn.id,
    status: newStatus || destinationColumn.id // Usa o ID da coluna como status
  };

  destinationColumn.tasks.splice(destination.index, 0, updatedTask);

  return nextColumns;
}

function buildWbsTree(nodes: WbsNode[]): WbsNode[] {
  const codeMap = new Map<string, string>();
  nodes.forEach((node) => {
    if (node.wbsCode) {
      codeMap.set(String(node.wbsCode).toLowerCase(), node.id);
    }
  });

  const normalized = nodes.map((node) => {
    if (!node.parentId && node.wbsCode && String(node.wbsCode).includes(".")) {
      const parentCode = String(node.wbsCode).split(".").slice(0, -1).join(".");
      const inferredParentId = codeMap.get(parentCode.toLowerCase()) ?? null;
      if (inferredParentId) {
        return { ...node, parentId: inferredParentId };
      }
    }
    return node;
  });

  const map = new Map<string, WbsNode>();
  normalized.forEach((node) => {
    map.set(node.id, { ...node, children: [] });
  });

  const roots: WbsNode[] = [];
  normalized.forEach((node) => {
    const current = map.get(node.id)!;
    const parentId = current.parentId ?? null;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(current);
    } else {
      roots.push(current);
    }
  });

  const sortNodes = (items: WbsNode[]) => {
    items.sort((a, b) => {
      const sortA = typeof a.sortOrder === "number" ? a.sortOrder : 0;
      const sortB = typeof b.sortOrder === "number" ? b.sortOrder : 0;
      if (sortA != sortB) return sortA - sortB;
      const orderA = typeof a.order === "number" ? a.order : 0;
      const orderB = typeof b.order === "number" ? b.order : 0;
      if (orderA != orderB) return orderA - orderB;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    items.forEach((item) => {
      if (item.children?.length) {
        sortNodes(item.children);
      }
    });
  };

  sortNodes(roots);

  return roots;
}
function ensureWbsTree(nodes: WbsNode[]): WbsNode[] {
  if (!Array.isArray(nodes)) return [];
  const hasChildren = nodes.some((node) => Array.isArray(node.children) && node.children.length > 0);
  if (hasChildren) return nodes;
  return buildWbsTree(nodes);
}


function updateNodeParent(nodes: WbsNode[], nodeId: string, parentId: string | null, position: number) {
  const deepClone = (items: WbsNode[]): WbsNode[] =>
    items.map((node) => ({
      ...node,
      children: deepClone(node.children ?? [])
    }));

  const cloned = deepClone(nodes);
  let itemToMove: WbsNode | null = null;

  const removeFromTree = (items: WbsNode[]): WbsNode[] =>
    items
      .map((node) => {
        if (node.id === nodeId) {
          itemToMove = node;
          return null;
        }
        return { ...node, children: removeFromTree(node.children ?? []) };
      })
      .filter(Boolean) as WbsNode[];

  const withoutItem = removeFromTree(cloned);
  if (!itemToMove) return nodes;
  const movable = itemToMove as WbsNode;

  const insertIntoTree = (items: WbsNode[]): WbsNode[] =>
    items.map((node) => {
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

function patchWbsNode(
  nodes: WbsNode[],
  nodeId: string,
  changes: {
    title?: string;
    status?: string;
    priority?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
    estimateHours?: string | null;
    dependencies?: string[];
    owner?: { id: string; name?: string; email?: string | null } | null;
    responsible?:
      | {
          membershipId: string;
          userId: string;
          name: string;
        }
      | null;
    serviceCatalogId?: string | null;
    serviceMultiplier?: number | null;
    serviceHours?: number | null;
  }
): WbsNode[] {
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

function treeContainsNode(nodes: WbsNode[], nodeId: string): boolean {
  for (const node of nodes) {
    if (node.id === nodeId) return true;
    if (node.children?.length && treeContainsNode(node.children, nodeId)) {
      return true;
    }
  }
  return false;
}

function findWbsNode(nodes: WbsNode[], nodeId: string): WbsNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children?.length) {
      const found = findWbsNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function parseWbsDate(value?: string | null): Date | null {
  if (!value) return null;
  if (value.includes("/")) {
    const [day, month, year] = value.split("/");
    if (!day || !month || !year) return null;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLocalMidnightIso(value: Date): string {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).toISOString();
}

function addDaysToDate(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function resolveNodeDurationInDays(node: WbsNode | null): number {
  const start = parseWbsDate(node?.startDate ?? null);
  const end = parseWbsDate(node?.endDate ?? null);
  if (start && end) {
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diff > 0) return diff;
  }

  const estimateHours = Number(node?.estimateHours ?? 0);
  if (Number.isFinite(estimateHours) && estimateHours > 0) {
    return Math.max(1, Math.round(estimateHours / 8));
  }

  return 1;
}

function resolveDependencySchedule(
  nodes: WbsNode[],
  dependencyIds: string[],
  targetNode: WbsNode | null
): { startDate: string; endDate: string; estimateHours: number } | null {
  const uniqueDependencyIds = Array.from(
    new Set((dependencyIds ?? []).map((value) => String(value).trim()).filter(Boolean))
  );
  if (!uniqueDependencyIds.length) return null;

  let latestDependencyDate: Date | null = null;

  uniqueDependencyIds.forEach((dependencyId) => {
    const dependencyNode = findWbsNode(nodes, dependencyId);
    if (!dependencyNode) return;
    const referenceDate = parseWbsDate(dependencyNode.endDate ?? null) ?? parseWbsDate(dependencyNode.startDate ?? null);
    if (!referenceDate) return;
    if (!latestDependencyDate || referenceDate.getTime() > latestDependencyDate.getTime()) {
      latestDependencyDate = referenceDate;
    }
  });

  if (!latestDependencyDate) return null;

  const durationInDays = resolveNodeDurationInDays(targetNode);
  const nextStart = addDaysToDate(latestDependencyDate, 1);
  const nextEnd = addDaysToDate(nextStart, Math.max(durationInDays - 1, 0));

  return {
    startDate: toLocalMidnightIso(nextStart),
    endDate: toLocalMidnightIso(nextEnd),
    estimateHours: durationInDays * 8
  };
}










