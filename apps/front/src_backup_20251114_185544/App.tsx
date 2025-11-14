import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Tree } from "@minoru/react-dnd-treeview";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { OrganizationSelector } from "./components/OrganizationSelector";
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
async function fetchJson(path, token, options, organizationId) {
    const headers = new Headers(options?.headers ?? undefined);
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    headers.set("Authorization", `Bearer ${token}`);
    if (organizationId) {
        headers.set("X-Organization-Id", organizationId);
    }
    const response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = body.error ?? body.message ?? `API respondeu com status ${response.status}`;
        throw new Error(message);
    }
    return body;
}
const formatDate = (value) => {
    if (!value)
        return "N/A";
    return new Date(value).toLocaleDateString("pt-BR");
};
const LoginView = (props) => _jsx(AuthPage, { ...props });
const OrganizationView = (props) => _jsx(OrganizationSelector, { ...props });
const KanbanBoard = ({ columns, onDragEnd }) => {
    if (!columns.length)
        return _jsx("p", { children: "Quadro vazio." });
    return (_jsx(DragDropContext, { onDragEnd: onDragEnd, children: _jsx("div", { style: { display: "flex", gap: "1rem", overflowX: "auto" }, children: columns.map((column) => (_jsx(Droppable, { droppableId: column.id, children: (provided) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, style: {
                        minWidth: "220px",
                        background: "#f7f7f8",
                        borderRadius: "8px",
                        padding: "0.75rem"
                    }, children: [_jsxs("div", { style: { marginBottom: "0.5rem" }, children: [_jsx("strong", { children: column.label }), " ", column.wipLimit ? (_jsxs("small", { children: ["(", column.tasks.length, "/", column.wipLimit, ")"] })) : null] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: [column.tasks.length === 0 && _jsx("span", { style: { color: "#777" }, children: "Sem tarefas" }), column.tasks.map((task, index) => (_jsx(Draggable, { draggableId: task.id, index: index, children: (dragProvided, snapshot) => (_jsxs("article", { ref: dragProvided.innerRef, ...dragProvided.draggableProps, ...dragProvided.dragHandleProps, style: {
                                            background: snapshot.isDragging ? "#e0d7ff" : "#fff",
                                            borderRadius: "6px",
                                            padding: "0.5rem",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                            ...dragProvided.draggableProps.style
                                        }, children: [_jsx("strong", { children: task.title }), _jsxs("div", { style: { fontSize: "0.85rem" }, children: [_jsxs("span", { children: ["Status: ", task.status] }), task.priority && (_jsxs(_Fragment, { children: [" ", "\u00B7 ", _jsxs("span", { children: ["Prioridade: ", task.priority] })] }))] })] })) }, task.id)))] }), provided.placeholder] })) }, column.id))) }) }));
};
const WbsTreeView = ({ nodes, onMove }) => {
    if (!nodes.length)
        return _jsx("p", { children: "Nenhum item cadastrado." });
    const treeNodes = flattenNodes(nodes).map((node) => ({
        id: node.id,
        parent: node.parentId ?? 0,
        text: node.title,
        droppable: true,
        data: node
    }));
    return (_jsx(Tree, { tree: treeNodes, rootId: 0, onDrop: (_, options) => {
            const nodeId = options.dragSource?.id;
            if (!nodeId)
                return;
            const parentId = options.dropTarget?.id && options.dropTarget.id !== 0 ? options.dropTarget.id : null;
            onMove(nodeId, parentId, options.destinationIndex ?? 0);
        }, render: (node) => (_jsxs("div", { style: { padding: "0.25rem 0" }, children: [_jsx("strong", { children: node.data?.title }), " \u2014 ", node.data?.type, " (", node.data?.status, ")"] })) }));
};
const GanttTimeline = ({ tasks, milestones }) => {
    if (!tasks.length)
        return _jsx("p", { children: "Nenhuma tarefa com datas definidas." });
    const allDates = [
        ...tasks.flatMap((task) => [task.startDate, task.endDate]),
        ...milestones.map((milestone) => milestone.dueDate)
    ]
        .filter(Boolean)
        .map((value) => new Date(value));
    const minDate = allDates.reduce((acc, date) => (acc.getTime() > date.getTime() ? date : acc), allDates[0]);
    const maxDate = allDates.reduce((acc, date) => (acc.getTime() < date.getTime() ? date : acc), allDates[0]);
    const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const offsetPercent = (value) => {
        if (!value)
            return 0;
        const diff = new Date(value).getTime() - minDate.getTime();
        return Math.max(0, (diff / (1000 * 60 * 60 * 24)) / totalDays) * 100;
    };
    const widthPercent = (start, end) => {
        if (!start || !end)
            return 5;
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.max(5, (diff / (1000 * 60 * 60 * 24)) / totalDays * 100);
    };
    return (_jsxs("div", { style: { border: "1px solid #e1e1e6", borderRadius: "8px", padding: "1rem" }, children: [_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: tasks.map((task) => (_jsxs("div", { children: [_jsxs("div", { style: { fontSize: "0.9rem" }, children: [_jsx("strong", { children: task.title }), " \u2014 ", task.status] }), _jsx("div", { style: { position: "relative", height: "18px", background: "#f0f0f5", borderRadius: "4px" }, children: _jsx("span", { style: {
                                    position: "absolute",
                                    left: `${offsetPercent(task.startDate)}%`,
                                    width: `${widthPercent(task.startDate, task.endDate)}%`,
                                    background: "#7c3aed",
                                    height: "100%",
                                    borderRadius: "4px"
                                } }) })] }, task.id))) }), _jsxs("div", { style: { marginTop: "1rem", fontSize: "0.9rem" }, children: [_jsx("strong", { children: "Marcos:" }), " ", milestones.length
                        ? milestones.map((milestone) => `${milestone.name} (${formatDate(milestone.dueDate)})`).join(", ")
                        : "Nenhum marco"] })] }));
};
const CommentsPanel = ({ comments, error }) => {
    if (error)
        return _jsx("p", { style: { color: "red" }, children: error });
    if (!comments.length)
        return _jsx("p", { children: "Nenhum comentario para o item selecionado." });
    return (_jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0 }, children: comments.map((comment) => (_jsxs("li", { style: { borderBottom: "1px solid #eee", padding: "0.5rem 0" }, children: [_jsx("p", { style: { margin: 0 }, children: comment.body }), _jsxs("small", { children: [comment.author.name, " \u00B7 ", formatDate(comment.createdAt)] })] }, comment.id))) }));
};
export const App = () => {
    const { status, user, token, signIn, signUp, signOut, error: authError } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
    const [orgError, setOrgError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectsError, setProjectsError] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersError, setMembersError] = useState(null);
    const [wbsNodes, setWbsNodes] = useState([]);
    const [wbsError, setWbsError] = useState(null);
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
    const [portfolio, setPortfolio] = useState([]);
    const [portfolioError, setPortfolioError] = useState(null);
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
                const data = await fetchJson("/me", token);
                const normalized = data.organizations.map((org) => ({
                    ...org,
                    activeProjects: org.activeProjects ?? org.projectCount ?? 0
                }));
                setOrganizations(normalized);
                const hasSelected = normalized.some((org) => org.id === selectedOrganizationId);
                if (normalized.length === 1) {
                    setSelectedOrganizationId(normalized[0]?.id ?? "");
                }
                else if (!hasSelected) {
                    setSelectedOrganizationId("");
                }
            }
            catch (error) {
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
                const data = await fetchJson("/projects", token, undefined, selectedOrganizationId);
                setProjects(data.projects ?? []);
                if (data.projects?.length) {
                    if (!data.projects.find((project) => project.id === selectedProjectId)) {
                        setSelectedProjectId(data.projects[0].id);
                    }
                }
                else {
                    setSelectedProjectId("");
                }
            }
            catch (error) {
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
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Falha ao carregar resumo";
                setSummaryError(message);
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
            setWbsNodes([]);
            setSelectedNodeId(null);
            return;
        }
        const loadWbs = async () => {
            try {
                setWbsError(null);
                const data = await fetchJson(`/projects/${selectedProjectId}/wbs`, token, undefined, selectedOrganizationId);
                setWbsNodes(data.nodes ?? []);
                if (!selectedNodeId && data.nodes?.length) {
                    setSelectedNodeId(data.nodes[0].id);
                }
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
                setComments(data.comments ?? []);
            }
            catch (error) {
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
                const normalized = (data.columns ?? []).map((column) => ({
                    ...column,
                    tasks: [...column.tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                }));
                setBoardColumns(normalized);
                if (!newTaskColumn && normalized.length) {
                    setNewTaskColumn(normalized[0].id);
                }
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Erro ao carregar portfólio";
                setPortfolioError(message);
            }
        };
        loadPortfolio();
    }, [status, token, selectedOrganizationId]);
    const handleCreateTask = async (event) => {
        event.preventDefault();
        if (!token || !selectedProjectId || !selectedOrganizationId || !newTaskColumn || !newTaskTitle.trim()) {
            return;
        }
        try {
            await fetchJson(`/projects/${selectedProjectId}/board/tasks`, token, {
                method: "POST",
                body: JSON.stringify({ title: newTaskTitle, columnId: newTaskColumn })
            }, selectedOrganizationId);
            setNewTaskTitle("");
            setBoardRefresh((value) => value + 1);
            setWbsRefresh((value) => value + 1);
            setBoardError(null);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Falha ao criar tarefa";
            setBoardError(message);
        }
    };
    const handleCreateComment = async (event) => {
        event.preventDefault();
        if (!token || !selectedNodeId || !selectedOrganizationId || !commentBody.trim())
            return;
        try {
            await fetchJson(`/wbs/${selectedNodeId}/comments`, token, {
                method: "POST",
                body: JSON.stringify({ body: commentBody })
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao registrar horas";
            setCommentsError(message);
        }
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
        setBoardColumns((prev) => reorderBoard(prev, source, destination, draggableId));
        try {
            await fetchJson(`/projects/${selectedProjectId}/board/tasks/${draggableId}`, token, {
                method: "PATCH",
                body: JSON.stringify({ columnId: destination.droppableId, order: destination.index })
            }, selectedOrganizationId);
            setBoardRefresh((value) => value + 1);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao mover tarefa";
            setBoardError(message);
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
    const handleDownloadPortfolio = async () => {
        if (!token || !selectedOrganizationId)
            return;
        try {
            const response = await fetch(`${apiBaseUrl}/reports/portfolio?format=csv`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Organization-Id": selectedOrganizationId
                }
            });
            if (!response.ok) {
                throw new Error("Falha ao baixar CSV");
            }
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
    if (status === "loading") {
        return _jsx("p", { style: { padding: "2rem" }, children: "Carregando autentica\u00E7\u00E3o..." });
    }
    if (status === "unauthenticated" || !token) {
        return (_jsx(LoginView, { onSubmit: ({ email, password }) => signIn(email, password), onSignUp: ({ email, password }) => signUp({ email, password }), error: authError }));
    }
    const organizationCards = organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        role: organization.role,
        activeProjects: organization.activeProjects ?? 0
    }));
    if (organizationCards.length > 1 && !selectedOrganizationId) {
        return (_jsx(OrganizationView, { organizations: organizationCards, onSelect: (organizationId) => setSelectedOrganizationId(organizationId), onCreateOrganization: () => alert("Fluxo de criação de organização em breve."), userEmail: user?.email ?? null }));
    }
    return (_jsx(DashboardLayout, {
        userEmail: user?.email ?? null,
        organizations,
        selectedOrganizationId,
        onOrganizationChange: (organizationId) => setSelectedOrganizationId(organizationId),
        orgError,
        onSignOut: signOut,
        projects,
        selectedProjectId,
        onProjectChange: (projectId) => setSelectedProjectId(projectId),
        projectsError,
        filters,
        onRangeChange: (rangeDays) => setFilters((prev) => ({ ...prev, rangeDays })),
        summary: projectSummary,
        summaryError,
        members,
        membersError,
        boardColumns: columns,
        boardError,
        onCreateTask: handleCreateTask,
        onDragTask: handleDragEnd,
        newTaskTitle,
        onTaskTitleChange: (value) => setNewTaskTitle(value),
        newTaskColumn,
        onTaskColumnChange: (value) => setNewTaskColumn(value),
        wbsNodes,
        wbsError,
        onMoveNode: handleWbsMove,
        selectedNodeId,
        onSelectNode: (nodeId) => setSelectedNodeId(nodeId),
        comments,
        commentsError,
        onSubmitComment: handleCreateComment,
        commentBody,
        onCommentBodyChange: (value) => setCommentBody(value),
        timeEntryDate,
        timeEntryHours,
        timeEntryDescription,
        onTimeEntryDateChange: (value) => setTimeEntryDate(value),
        onTimeEntryHoursChange: (value) => setTimeEntryHours(value),
        onTimeEntryDescriptionChange: (value) => setTimeEntryDescription(value),
        onLogTime: handleCreateTimeEntry,
        ganttTasks,
        ganttMilestones,
        ganttError,
        portfolio,
        portfolioError,
        onExportPortfolio: handleDownloadPortfolio
    }));

};
function flattenNodes(nodes) {
    return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}
function reorderBoard(columns, source, destination, taskId) {
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
    destinationColumn.tasks.splice(destination.index, 0, {
        ...movedTask,
        boardColumnId: destinationColumn.id
    });
    return nextColumns;
}
function updateNodeParent(nodes, nodeId, parentId, position) {
    const deepClone = (items) => items.map((node) => ({
        ...node,
        children: deepClone(node.children)
    }));
    const cloned = deepClone(nodes);
    let itemToMove = null;
    const removeFromTree = (items) => items
        .map((node) => {
        if (node.id === nodeId) {
            itemToMove = node;
            return null;
        }
        return { ...node, children: removeFromTree(node.children) };
    })
        .filter(Boolean);
    const withoutItem = removeFromTree(cloned);
    if (!itemToMove)
        return nodes;
    const insertIntoTree = (items) => items.map((node) => {
        if (node.id === parentId) {
            const children = [...node.children];
            children.splice(position, 0, { ...itemToMove, parentId: node.id });
            return { ...node, children };
        }
        return { ...node, children: insertIntoTree(node.children) };
    });
    if (!parentId) {
        const topLevel = [...withoutItem];
        topLevel.splice(position, 0, { ...itemToMove, parentId: null });
        return topLevel;
    }
    return insertIntoTree(withoutItem);
}






