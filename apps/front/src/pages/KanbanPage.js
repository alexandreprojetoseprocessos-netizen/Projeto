import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { KanbanBoard, KANBAN_STATUS_ORDER, STATUS_MAP, } from "../components/KanbanBoard";
import KanbanTaskModal from "../components/KanbanTaskModal";
import { normalizeStatus } from "../utils/status";
import "./KanbanPage.css";
const KanbanPage = () => {
    const { wbsNodes, members, projects, selectedProjectId, wbsError, onUpdateWbsNode, onReloadWbs, onCreateWbsItem, selectedNodeId, onSelectNode, comments, commentsError, onSubmitComment, commentBody, onCommentBodyChange, timeEntryDate, timeEntryHours, timeEntryDescription, timeEntryError, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, } = useOutletContext();
    const [filterText, setFilterText] = useState("");
    const [filterOwner, setFilterOwner] = useState("ALL");
    const [filterPriority, setFilterPriority] = useState("ALL");
    const [filterDue, setFilterDue] = useState("ALL");
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const flattenNodes = (nodes) => {
        const result = [];
        nodes.forEach((n) => {
            result.push(n);
            if (n.children?.length)
                result.push(...flattenNodes(n.children));
        });
        return result;
    };
    const allNodes = useMemo(() => flattenNodes(wbsNodes ?? []), [wbsNodes]);
    const projectNameMap = useMemo(() => new Map((projects ?? []).map((project) => [project.id, project.name])), [projects]);
    const filtered = useMemo(() => {
        const q = filterText.trim().toLowerCase();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const soonLimit = new Date(today);
        soonLimit.setDate(soonLimit.getDate() + 7);
        return allNodes.filter((node) => {
            if (node.deletedAt)
                return false;
            if (filterOwner !== "ALL") {
                const ownerId = node.ownerId ??
                    node.responsible?.membershipId ??
                    node.responsibleMembershipId;
                if (String(ownerId ?? "") !== filterOwner)
                    return false;
            }
            if (filterPriority !== "ALL") {
                const pri = (node.priority ?? "").toString().toUpperCase();
                if (pri !== filterPriority)
                    return false;
            }
            if (filterDue !== "ALL") {
                const rawDate = node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? null;
                const date = rawDate ? new Date(rawDate) : null;
                const valid = date && !Number.isNaN(date.getTime()) ? date : null;
                if (!valid)
                    return false;
                const dateOnly = new Date(valid);
                dateOnly.setHours(0, 0, 0, 0);
                if (filterDue === "OVERDUE" && dateOnly >= today)
                    return false;
                if (filterDue === "UPCOMING" && (dateOnly < today || dateOnly > soonLimit))
                    return false;
            }
            if (!q)
                return true;
            const code = String(node.wbsCode ?? node.code ?? node.displayId ?? "").toLowerCase();
            const title = String(node.title ?? "").toLowerCase();
            return code.includes(q) || title.includes(q);
        });
    }, [allNodes, filterOwner, filterPriority, filterDue, filterText]);
    const mapToTaskStatus = useCallback((raw) => {
        const normalized = normalizeStatus(raw);
        switch (normalized) {
            case "Não iniciado":
                return "BACKLOG";
            case "Em andamento":
                return "IN_PROGRESS";
            case "Em atraso":
                return "DELAYED";
            case "Em risco":
                return "RISK";
            case "Homologação":
                return "REVIEW";
            case "Finalizado":
                return "DONE";
            default:
                return "BACKLOG";
        }
    }, []);
    const kanbanColumns = useMemo(() => {
        const grouped = KANBAN_STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: [] }), {});
        filtered.forEach((node) => {
            const status = mapToTaskStatus(node.status);
            const assigneeSource = node.owner ?? node.responsible ?? null;
            const assignee = assigneeSource
                ? {
                    id: String(assigneeSource.id ??
                        assigneeSource.userId ??
                        assigneeSource.membershipId ??
                        ""),
                    name: assigneeSource.name ?? assigneeSource.email ?? "Responsavel",
                    avatar: assigneeSource.avatar,
                }
                : undefined;
            grouped[status].push({
                id: node.id,
                title: `${node.title ?? "Tarefa"}`.trim(),
                code: node.wbsCode ?? node.code ?? "",
                status,
                projectName: node.projectName ??
                    (node.projectId ? projectNameMap.get(node.projectId) : null) ??
                    (selectedProjectId && selectedProjectId !== "all"
                        ? projectNameMap.get(selectedProjectId)
                        : null) ??
                    undefined,
                dueDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
                startDate: node.startDate ?? node.startAt ?? node.start ?? undefined,
                endDate: node.endDate ?? node.dueDate ?? node.endAt ?? node.end ?? undefined,
                assignee,
                tags: node.wbsCode ? [node.wbsCode] : undefined,
                description: node.description ?? undefined,
                priority: node.priority ?? undefined,
            });
        });
        return KANBAN_STATUS_ORDER.map((status) => ({
            id: status,
            title: STATUS_MAP[status],
            tasks: grouped[status],
            wipLimit: undefined,
        }));
    }, [filtered, mapToTaskStatus, projectNameMap, selectedProjectId]);
    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || destination.droppableId === source.droppableId)
            return;
        const newStatus = destination.droppableId;
        try {
            await onUpdateWbsNode?.(draggableId, { status: newStatus });
            onReloadWbs?.();
        }
        catch (err) {
            console.error("Falha ao mover tarefa", err);
        }
    };
    const handleCreate = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get("title") ?? "Nova tarefa";
        const status = formData.get("status") ?? "BACKLOG";
        try {
            await onCreateWbsItem?.(null, { title, status });
            onReloadWbs?.();
            return true;
        }
        catch (error) {
            console.error("Erro ao criar tarefa", error);
            return false;
        }
    };
    const selectedTask = allNodes.find((n) => n.id === selectedTaskId);
    const handleSaveTask = async (updates) => {
        if (!selectedTask)
            return false;
        try {
            await onUpdateWbsNode?.(selectedTask.id, updates);
            onReloadWbs?.();
            return true;
        }
        catch (error) {
            console.error("Erro ao salvar tarefa", error);
            return false;
        }
    };
    return (_jsxs("section", { className: "kanbanPage", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "EAP" }), _jsx("h1", { children: "Kanban" }), _jsx("p", { className: "subtext", children: "Visualiza\u00E7\u00E3o por status" }), wbsError && _jsx("p", { className: "error-text", children: wbsError })] }), _jsxs("div", { className: "kanbanFilters", children: [_jsx("input", { className: "gp-input", placeholder: "Buscar tarefa", value: filterText, onChange: (e) => setFilterText(e.target.value) }), _jsxs("select", { className: "gp-input", value: filterOwner, onChange: (e) => setFilterOwner(e.target.value), children: [_jsx("option", { value: "ALL", children: "Respons\u00E1vel" }), members?.map((m) => (_jsx("option", { value: m.id, children: m.name ?? m.email ?? "Membro" }, m.id)))] }), _jsxs("select", { className: "gp-input", value: filterPriority, onChange: (e) => setFilterPriority(e.target.value), children: [_jsx("option", { value: "ALL", children: "Prioridade" }), _jsx("option", { value: "CRITICAL", children: "Urgente" }), _jsx("option", { value: "HIGH", children: "Alta" }), _jsx("option", { value: "MEDIUM", children: "M\u00E9dia" }), _jsx("option", { value: "LOW", children: "Baixa" })] }), _jsxs("select", { className: "gp-input", value: filterDue, onChange: (e) => setFilterDue(e.target.value), children: [_jsx("option", { value: "ALL", children: "Datas" }), _jsx("option", { value: "UPCOMING", children: "A vencer" }), _jsx("option", { value: "OVERDUE", children: "Vencidas" })] })] })] }), _jsx(KanbanBoard, { columns: kanbanColumns, onDragEnd: handleDragEnd, onCreate: handleCreate, onTaskClick: (task) => {
                    setSelectedTaskId(task.id);
                    onSelectNode?.(task.id);
                }, newTaskTitle: "", onTaskTitleChange: () => { }, newTaskColumn: "", onTaskColumnChange: () => { } }), selectedTask && (_jsx(KanbanTaskModal, { task: selectedTask, members: members, onSave: handleSaveTask, onClose: () => {
                    setSelectedTaskId(null);
                    onSelectNode?.(null);
                }, selectedNodeId: selectedNodeId, comments: comments, commentsError: commentsError, onSubmitComment: onSubmitComment, commentBody: commentBody, onCommentBodyChange: onCommentBodyChange, timeEntryDate: timeEntryDate, timeEntryHours: timeEntryHours, timeEntryDescription: timeEntryDescription, timeEntryError: timeEntryError, onTimeEntryDateChange: onTimeEntryDateChange, onTimeEntryHoursChange: onTimeEntryHoursChange, onTimeEntryDescriptionChange: onTimeEntryDescriptionChange, onLogTime: onLogTime }))] }));
};
export default KanbanPage;
