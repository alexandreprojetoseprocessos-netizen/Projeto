import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { DashboardLayout } from "./components/DashboardLayout";
import { AuthPage } from "./components/AuthPage";
import { OrganizationSelector } from "./components/OrganizationSelector";
import { useAuth } from "./contexts/AuthContext";

type Organization = { id: string; name: string; role: string; activeProjects?: number };
type Project = { id: string; name: string };
type BoardColumn = { id: string; label: string; tasks: any[]; wipLimit?: number };
type WbsNode = { id: string; title: string; type: string; status: string; parentId: string | null; children: WbsNode[] };

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function fetchJson<TResponse>(
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

  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ rangeDays: 7 });
  const [boardRefresh, setBoardRefresh] = useState(0);
  const [wbsRefresh, setWbsRefresh] = useState(0);
  const [commentsRefresh, setCommentsRefresh] = useState(0);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumn, setNewTaskColumn] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [timeEntryHours, setTimeEntryHours] = useState("");
  const [timeEntryDate, setTimeEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [timeEntryDescription, setTimeEntryDescription] = useState("");

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

        const hasSelected = normalized.some((org) => org.id === selectedOrganizationId);
        if (normalized.length === 1) {
          setSelectedOrganizationId(normalized[0]?.id ?? "");
        } else if (!hasSelected) {
          setSelectedOrganizationId("");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar organizações";
        setOrgError(message);
        setOrganizations([]);
        setSelectedOrganizationId("");
      }
    };

    loadOrganizations();
  }, [status, token, selectedOrganizationId]);

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
        setProjects(data.projects ?? []);

        if (data.projects?.length) {
          const exists = data.projects.find((project) => project.id === selectedProjectId);
          if (!exists) setSelectedProjectId(data.projects[0].id);
        } else {
          setSelectedProjectId("");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar projetos";
        setProjectsError(message);
      }
    };

    loadProjects();
  }, [status, token, selectedOrganizationId, selectedProjectId]);

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
  }, [status, token, selectedProjectId, selectedOrganizationId, filters.rangeDays]);

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
        if (!selectedNodeId && nodes.length) setSelectedNodeId(nodes[0].id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar WBS";
        setWbsError(message);
      }
    };

    loadWbs();
  }, [status, token, selectedProjectId, selectedOrganizationId, wbsRefresh, selectedNodeId]);

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

  useEffect(() => {
    if (status !== "authenticated" || !token || !selectedProjectId || !selectedOrganizationId) {
      setBoardColumns([]);
      return;
    }

    const loadBoard = async () => {
      try {
        setBoardError(null);
        const data = await fetchJson(`/projects/${selectedProjectId}/board`, token, undefined, selectedOrganizationId);
        const normalized = (data.columns ?? []).map((column: any) => ({
          ...column,
          tasks: [...(column.tasks ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        }));
        setBoardColumns(normalized);
        if (!newTaskColumn && normalized.length) setNewTaskColumn(normalized[0].id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar quadro";
        setBoardError(message);
      }
    };

    loadBoard();
  }, [status, token, selectedProjectId, selectedOrganizationId, boardRefresh, newTaskColumn]);

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
    if (status !== "authenticated" || !token || !selectedOrganizationId) {
      setPortfolio([]);
      return;
    }

    const loadPortfolio = async () => {
      try {
        setPortfolioError(null);
        const data = await fetchJson("/reports/portfolio", token, undefined, selectedOrganizationId);
        setPortfolio(data.projects ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar portfólio";
        setPortfolioError(message);
      }
    };

    loadPortfolio();
  }, [status, token, selectedOrganizationId]);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedProjectId || !selectedOrganizationId || !newTaskColumn || !newTaskTitle.trim()) return;

    try {
      await fetchJson(
        `/projects/${selectedProjectId}/board/tasks`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ title: newTaskTitle, columnId: newTaskColumn })
        },
        selectedOrganizationId
      );
      setNewTaskTitle("");
      setBoardRefresh((value) => value + 1);
      setWbsRefresh((value) => value + 1);
      setBoardError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar tarefa";
      setBoardError(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar horas";
      setCommentsError(message);
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
        onCreateOrganization={() => alert("Fluxo de criação de organização em breve.")}
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
      boardColumns={boardColumns}
      boardError={boardError}
      onCreateTask={handleCreateTask}
      onDragTask={handleDragEnd}
      newTaskTitle={newTaskTitle}
      onTaskTitleChange={setNewTaskTitle}
      newTaskColumn={newTaskColumn}
      onTaskColumnChange={setNewTaskColumn}
      wbsNodes={wbsNodes}
      wbsError={wbsError}
      onMoveNode={handleWbsMove}
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
      ganttTasks={ganttTasks}
      ganttMilestones={ganttMilestones}
      ganttError={ganttError}
      portfolio={portfolio}
      portfolioError={portfolioError}
      onExportPortfolio={handleDownloadPortfolio}
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

  const insertIntoTree = (items: WbsNode[]): WbsNode[] =>
    items.map((node) => {
      if (node.id === parentId) {
        const children = [...node.children];
        children.splice(position, 0, { ...itemToMove!, parentId: node.id });
        return { ...node, children };
      }
      return { ...node, children: insertIntoTree(node.children ?? []) };
    });

  if (!parentId) {
    const topLevel = [...withoutItem];
    topLevel.splice(position, 0, { ...itemToMove, parentId: null });
    return topLevel;
  }

  return insertIntoTree(withoutItem);
}
