import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { DashboardLayout, type CreateProjectPayload } from "./components/DashboardLayout";
import { AuthPage } from "./components/AuthPage";
import { OrganizationSelector } from "./components/OrganizationSelector";
import type { PortfolioProject } from "./components/ProjectPortfolio";
import { useAuth } from "./contexts/AuthContext";

type Organization = { id: string; name: string; role: string; activeProjects?: number };
type Project = { id: string; name: string };
type BoardColumn = { id: string; label: string; tasks: any[]; wipLimit?: number };
type WbsNode = {
  id: string;
  title: string;
  type: string;
  status: string;
  parentId: string | null;
  children: WbsNode[];
  level?: number;
  wbsCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  owner?: { id: string; name: string; email?: string | null } | null;
  actualHours?: number | null;
  documents?: number | null;
  description?: string | null;
  progress?: number | null;
  dependencies?: string[] | null;
};
type BoardResponse = { columns: BoardColumn[] };
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (body as any).error ?? (body as any).message ?? `API respondeu com status ${response.status}`;
    throw new Error(message);
  }

  return body as TResponse;
}

export const App = () => {
  const { status, user, token, signIn, signUp, signOut, error: authError } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [orgError, setOrgError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [wbsNodes, setWbsNodes] = useState<WbsNode[]>([]);
  const [wbsError, setWbsError] = useState<string | null>(null);
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
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [reportMetrics, setReportMetrics] = useState<any | null>(null);
  const [reportMetricsError, setReportMetricsError] = useState<string | null>(null);
  const [reportMetricsLoading, setReportMetricsLoading] = useState(false);

  const [filters, setFilters] = useState({ rangeDays: 7 });
  const [boardRefresh, setBoardRefresh] = useState(0);
  const [wbsRefresh, setWbsRefresh] = useState(0);
  const [commentsRefresh, setCommentsRefresh] = useState(0);
  const [summaryRefresh, setSummaryRefresh] = useState(0);
  const [organizationsRefresh, setOrganizationsRefresh] = useState(0);

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

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      setOrganizations([]);
      setSelectedOrganizationId("");
      return;
    }

    const loadOrganizations = async () => {
      try {
        setOrgError(null);
        const data = await fetchJson<{ organizations: Organization[] }>("/me", token);
        const normalized = (data.organizations ?? []).map((org) => ({
          ...org,
          activeProjects: org.activeProjects ?? (org as any).projectCount ?? 0
        }));
        setOrganizations(normalized);
        setSelectedOrganizationId((current) => {
          if (normalized.length === 0) return "";
          if (normalized.length === 1) return normalized[0].id;
          const exists = normalized.some((org) => org.id === current);
          return exists ? current : "";
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar organizações";
        setOrgError(message);
        setOrganizations([]);
        setSelectedOrganizationId("");
      }
    };

    loadOrganizations();
  }, [status, token, organizationsRefresh]);

  const previousOrganizationId = useRef<string | null>(null);
  useEffect(() => {
    if (previousOrganizationId.current === selectedOrganizationId) {
      return;
    }
    previousOrganizationId.current = selectedOrganizationId;
    setSelectedProjectId("");
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
      setSelectedProjectId("");
      return;
    }

    const loadProjects = async () => {
      try {
        setProjectsError(null);
        const data = await fetchJson<{ projects: Project[] }>("/projects", token, undefined, selectedOrganizationId);
        const list = data.projects ?? [];
        setProjects(list);
        setSelectedProjectId((current) => {
          if (list.length === 0) return "";
          const exists = list.some((project) => project.id === current);
          return exists ? current : list[0].id;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar projetos";
        setProjectsError(message);
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
      } catch (error) {
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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar equipe";
        setMembersError(message);
      }
    };

    loadMembers();
  }, [status, token, selectedProjectId, selectedOrganizationId]);

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
    if (!selectedNodeId || status !== "authenticated" || !token || !selectedOrganizationId) {
      setComments([]);
      return;
    }

    const loadComments = async () => {
      try {
        setCommentsError(null);
        const data = await fetchJson(`/wbs/${selectedNodeId}/comments`, token, undefined, selectedOrganizationId);
        setComments(data.comments ?? []);
      } catch (error) {
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
      const data = await fetchJson<BoardResponse>(
        `/projects/${selectedProjectId}/board`,
        token,
        undefined,
        selectedOrganizationId
      );
      const normalized = (data.columns ?? []).map((column: any) => ({
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
    } catch (error) {
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
      } catch (error) {
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
        const data = await fetchJson<{ attachments: any[] }>(
          `/projects/${selectedProjectId}/attachments`,
          token,
          undefined,
          selectedOrganizationId
        );
        setAttachments(data.attachments ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar documentos";
        setAttachmentsError(message);
        setAttachments([]);
      } finally {
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

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedProjectId || !selectedOrganizationId || !newTaskColumn || !newTaskTitle.trim()) {
      return false;
    }

    try {
      await fetchJson(
        `/projects/${selectedProjectId}/board/tasks`,
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
          body: JSON.stringify({ body: commentBody })
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
          hoursTracked: 0,
          tasksTotal: 0,
          tags: []
        }
      ];
    });
    setSelectedProjectId(createdProject.id);
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
              startDate: payload.startDate || project.startDate,
              endDate: payload.endDate || project.endDate
            }
          : project
      )
    );
  };

  const handleCreateOrganization = async () => {
    if (!token) return;
    const name = window.prompt("Nome da nova organização?");
    if (!name || !name.trim()) return;
    const domain = window.prompt("Domínio (opcional)") ?? "";

    try {
      const response = await fetchJson<{ organization: { id: string; name: string } }>(
        "/organizations",
        token,
        {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), domain: domain.trim() || undefined })
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
            activeProjects: 0
          }
        ];
      });
      setOrganizationsRefresh((value) => value + 1);
      setSelectedOrganizationId(newOrg.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar organização";
      setOrgError(message);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (
      !destination ||
      !token ||
      !selectedProjectId ||
      !selectedOrganizationId ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    ) {
      return;
    }

    setBoardColumns((prev) => reorderBoard(prev, source, destination, draggableId));
    try {
      await fetchJson(
        `/projects/${selectedProjectId}/board/tasks/${draggableId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ columnId: destination.droppableId, order: destination.index })
        },
        selectedOrganizationId
      );
      setBoardRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao mover tarefa";
      setBoardError(message);
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

  const handleWbsUpdate = async (nodeId: string, changes: { title?: string; status?: string }) => {
    if (!token || !selectedOrganizationId) return;
    if (!changes.title && !changes.status) return;
    setWbsNodes((prev) => patchWbsNode(prev, nodeId, changes));

    try {
      await fetchJson(
        `/wbs/${nodeId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(changes)
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

  const handleDownloadPortfolio = async () => {
    if (!token || !selectedOrganizationId) return;

    try {
      const response = await fetch(`${apiBaseUrl}/reports/portfolio?format=csv`, {
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
    activeProjects: organization.activeProjects ?? 0
  }));

  if (status === "loading") {
    return <p style={{ padding: "2rem" }}>Carregando autenticação...</p>;
  }

  if (status === "unauthenticated" || !token) {
    return (
      <AuthPage
        onSubmit={({ email, password }: { email: string; password: string }) => signIn(email, password)}
        onSignUp={({ email, password }: { email: string; password: string }) => signUp({ email, password })}
        error={authError}
      />
    );
  }

  if (organizationCards.length > 1 && !selectedOrganizationId) {
    return (
      <OrganizationSelector
        organizations={organizationCards}
        onSelect={(organizationId: string) => setSelectedOrganizationId(organizationId)}
        onCreateOrganization={handleCreateOrganization}
        userEmail={user?.email ?? null}
      />
    );
  }

  return (
    <DashboardLayout
      userEmail={user?.email ?? null}
      organizations={organizations}
      selectedOrganizationId={selectedOrganizationId}
      onOrganizationChange={setSelectedOrganizationId}
      orgError={orgError}
      onSignOut={signOut}
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectChange={setSelectedProjectId}
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
      onExportPortfolio={handleDownloadPortfolio}
      onCreateProject={handleCreateProject}
      onUpdateProject={handleUpdateProject}
    />
  );
};

function reorderBoard(columns: BoardColumn[], source: any, destination: any, taskId: string) {
  const nextColumns = columns.map((column) => ({
    ...column,
    tasks: [...column.tasks]
  }));

  const sourceColumn = nextColumns.find((column) => column.id === source.droppableId);
  const destinationColumn = nextColumns.find((column) => column.id === destination.droppableId);
  if (!sourceColumn || !destinationColumn) return columns;

  const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
  if (!movedTask) return columns;

  destinationColumn.tasks.splice(destination.index, 0, {
    ...movedTask,
    boardColumnId: destinationColumn.id
  });

  return nextColumns;
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

function patchWbsNode(nodes: WbsNode[], nodeId: string, changes: { title?: string; status?: string }): WbsNode[] {
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
