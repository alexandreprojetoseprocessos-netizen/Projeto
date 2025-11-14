import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Tree } from "@minoru/react-dnd-treeview";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useAuth } from "./contexts/AuthContext";
import { OrganizationSelector } from "./components/OrganizationSelector";
import { AuthPage } from "./components/AuthPage";
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
                const message = error instanceof Error ? error.message : "Falha ao carregar organiza��es";
                setOrgError(message);
                setSelectedOrganizationId("");
            }
        };
        loadOrganizations();
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
    return (_jsxs("main", { style: { fontFamily: "Inter, sans-serif", padding: "2rem", maxWidth: "1100px", margin: "0 auto" }, children: [_jsxs("header", { style: { marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", gap: "1rem" }, children: [_jsxs("div", { children: [_jsx("h1", { children: "G&P \u2014 Gest\u00E3o de Projetos" }), _jsx("p", { children: "Dashboard consolidado alimentado pela API autenticada no Supabase." }), organizations.length > 0 && (_jsxs("label", { style: { display: "flex", flexDirection: "column", maxWidth: "320px", marginTop: "1rem" }, children: [_jsx("span", { children: "Selecione a organiza\u00E7\u00E3o" }), _jsx("select", { value: selectedOrganizationId, onChange: (event) => setSelectedOrganizationId(event.target.value), children: organizations.map((org) => (_jsxs("option", { value: org.id, children: [org.name, " (", org.role, ")"] }, org.id))) })] })), projects.length > 1 && (_jsxs("label", { style: { display: "flex", flexDirection: "column", maxWidth: "320px", marginTop: "1rem" }, children: [_jsx("span", { children: "Selecione o projeto" }), _jsx("select", { value: selectedProjectId, onChange: (event) => setSelectedProjectId(event.target.value), children: projects.map((project) => (_jsx("option", { value: project.id, children: project.name }, project.id))) })] })), projectsError && _jsx("p", { style: { color: "red" }, children: projectsError })] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsxs("p", { style: { marginBottom: "0.5rem" }, children: ["Logado como ", _jsx("strong", { children: user?.email })] }), _jsx("button", { onClick: signOut, children: "Sair" })] })] }), orgError && _jsx("p", { style: { color: "red" }, children: orgError }), !selectedOrganizationId ? (_jsx("p", { children: "Nenhuma organiza\u00E7\u00E3o dispon\u00EDvel para este usu\u00E1rio." })) : (_jsxs(_Fragment, { children: [_jsxs("section", { style: { marginBottom: "2rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h2", { children: "Resumo do projeto" }), _jsxs("label", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: ["Intervalo (dias):", _jsxs("select", { value: filters.rangeDays, onChange: (event) => setFilters((prev) => ({ ...prev, rangeDays: Number(event.target.value) })), children: [_jsx("option", { value: 7, children: "7" }), _jsx("option", { value: 14, children: "14" }), _jsx("option", { value: 30, children: "30" })] })] })] }), summaryError && _jsx("p", { style: { color: "red" }, children: summaryError }), projectSummary ? (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Tarefas totais:" }), " ", projectSummary.totals.total] }), _jsxs("div", { children: [_jsx("strong", { children: "Conclu\u00EDdas:" }), " ", projectSummary.totals.done] }), _jsxs("div", { children: [_jsx("strong", { children: "Em andamento:" }), " ", projectSummary.totals.inProgress] }), _jsxs("div", { children: [_jsx("strong", { children: "Backlog:" }), " ", projectSummary.totals.backlog] }), _jsxs("div", { children: [_jsx("strong", { children: "Bloqueadas:" }), " ", projectSummary.totals.blocked] }), _jsxs("div", { children: [_jsx("strong", { children: "Tarefas atrasadas:" }), " ", projectSummary.overdueTasks] }), _jsxs("div", { children: [_jsxs("strong", { children: ["Velocity (", filters.rangeDays, "d):"] }), " ", projectSummary.velocity.doneLast7] }), _jsxs("div", { children: [_jsx("strong", { children: "Horas registradas (14d):" }), " ", projectSummary.hoursTracked.toFixed(2)] }), _jsxs("div", { children: [_jsx("strong", { children: "Capacidade semanal:" }), " ", projectSummary.capacity.weeklyCapacity, "h"] })] }), _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }, children: [_jsxs("div", { style: { flex: "1 1 300px", height: "200px" }, children: [_jsx("h3", { children: "Burn-down" }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: projectSummary.burnDown, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "done", stroke: "#22c55e" }), _jsx(Line, { type: "monotone", dataKey: "remaining", stroke: "#ef4444" })] }) })] }), _jsxs("div", { style: { flex: "1 1 300px", height: "200px" }, children: [_jsx("h3", { children: "Horas registradas (14d)" }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: projectSummary.timeEntries, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "hours", fill: "#3b82f6" })] }) })] })] }), _jsxs("div", { style: { marginTop: "1rem" }, children: [_jsx("strong", { children: "Pr\u00F3ximos marcos:" }), " ", projectSummary.upcomingMilestones.length ? (_jsx("ul", { children: projectSummary.upcomingMilestones.map((milestone) => (_jsxs("li", { children: [milestone.name, " \u2014 ", formatDate(milestone.dueDate), " (", milestone.status, ")"] }, milestone.id))) })) : (_jsx("span", { children: "Nenhum marco futuro" }))] })] })) : (_jsx("p", { children: "Selecione um projeto para ver o resumo." }))] }), _jsxs("section", { style: { marginBottom: "2rem" }, children: [_jsx("h2", { children: "Equipe" }), membersError && _jsx("p", { style: { color: "red" }, children: membersError }), !membersError && !members.length && _jsx("p", { children: "Nenhum membro vinculado." }), !membersError && members.length > 0 && (_jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { align: "left", children: "Nome" }), _jsx("th", { align: "left", children: "Email" }), _jsx("th", { align: "left", children: "Papel" }), _jsx("th", { align: "left", children: "Capacidade (h/sem)" })] }) }), _jsx("tbody", { children: members.map((member) => (_jsxs("tr", { children: [_jsx("td", { children: member.name }), _jsx("td", { children: member.email }), _jsx("td", { children: member.role }), _jsx("td", { children: member.capacityWeekly })] }, member.id))) })] }))] }), _jsxs("section", { style: { marginBottom: "2rem" }, children: [_jsx("h2", { children: "Kanban do projeto" }), boardError && _jsx("p", { style: { color: "red" }, children: boardError }), !boardError && boardColumns.length > 0 && (_jsxs("form", { onSubmit: handleCreateTask, style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }, children: [_jsx("input", { type: "text", placeholder: "T\u00EDtulo da tarefa", value: newTaskTitle, onChange: (event) => setNewTaskTitle(event.target.value), required: true }), _jsx("select", { value: newTaskColumn, onChange: (event) => setNewTaskColumn(event.target.value), required: true, children: boardColumns.map((column) => (_jsx("option", { value: column.id, children: column.label }, column.id))) }), _jsx("button", { type: "submit", children: "Adicionar" })] })), !boardError && _jsx(KanbanBoard, { columns: boardColumns, onDragEnd: handleDragEnd })] }), _jsxs("section", { style: { marginBottom: "2rem" }, children: [_jsx("h2", { children: "WBS (Resumo)" }), wbsError && _jsx("p", { style: { color: "red" }, children: wbsError }), !wbsError && _jsx(WbsTreeView, { nodes: wbsNodes, onMove: handleWbsMove })] }), _jsxs("section", { style: { marginBottom: "2rem" }, children: [_jsx("h2", { children: "Coment\u00E1rios do item selecionado" }), wbsNodes.length > 0 && (_jsxs("label", { style: { display: "flex", flexDirection: "column", maxWidth: "320px", marginBottom: "1rem" }, children: [_jsx("span", { children: "Escolha um item da WBS" }), _jsxs("select", { value: selectedNodeId ?? "", onChange: (event) => setSelectedNodeId(event.target.value), children: [_jsx("option", { value: "", children: "Selecione..." }), flattenNodes(wbsNodes).map((node) => (_jsxs("option", { value: node.id, children: [node.title, " (", node.type, ")"] }, node.id)))] })] })), _jsx(CommentsPanel, { comments: comments, error: commentsError }), selectedNodeId ? (_jsxs(_Fragment, { children: [_jsxs("form", { onSubmit: handleCreateComment, style: { marginTop: "1rem", display: "flex", flexDirection: "column" }, children: [_jsx("textarea", { placeholder: "Novo coment\u00E1rio", value: commentBody, onChange: (event) => setCommentBody(event.target.value), rows: 3 }), _jsx("button", { type: "submit", disabled: !commentBody.trim(), children: "Registrar coment\u00E1rio" })] }), _jsxs("form", { onSubmit: handleCreateTimeEntry, style: { marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }, children: [_jsx("input", { type: "number", min: "0", step: "0.25", placeholder: "Horas", value: timeEntryHours, onChange: (event) => setTimeEntryHours(event.target.value), required: true }), _jsx("input", { type: "date", value: timeEntryDate, onChange: (event) => setTimeEntryDate(event.target.value), required: true }), _jsx("input", { type: "text", placeholder: "Descri\u00E7\u00E3o (opcional)", value: timeEntryDescription, onChange: (event) => setTimeEntryDescription(event.target.value) }), _jsx("button", { type: "submit", children: "Registrar horas" })] })] })) : (_jsx("p", { children: "Selecione um item para comentar e registrar horas." }))] }), _jsxs("section", { children: [_jsx("h2", { children: "Gantt simplificado" }), ganttError && _jsx("p", { style: { color: "red" }, children: ganttError }), !ganttError && _jsx(GanttTimeline, { tasks: ganttTasks, milestones: ganttMilestones })] }), _jsxs("section", { style: { marginTop: "2rem" }, children: [_jsx("h2", { children: "Relat\u00F3rio de portf\u00F3lio" }), portfolioError && _jsx("p", { style: { color: "red" }, children: portfolioError }), !portfolioError && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: handleDownloadPortfolio, style: { marginBottom: "1rem" }, children: "Baixar CSV" }), _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { align: "left", children: "Projeto" }), _jsx("th", { align: "left", children: "Status" }), _jsx("th", { align: "left", children: "Tarefas (Done/Total)" }), _jsx("th", { align: "left", children: "Riscos abertos" }), _jsx("th", { align: "left", children: "Horas" })] }) }), _jsx("tbody", { children: portfolio.map((row) => (_jsxs("tr", { children: [_jsx("td", { children: row.projectName }), _jsx("td", { children: row.status }), _jsxs("td", { children: [row.tasksDone, "/", row.tasksTotal] }), _jsx("td", { children: row.risksOpen }), _jsx("td", { children: row.hoursTracked.toFixed(2) })] }, row.projectId))) })] })] }))] })] }))] }));
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




