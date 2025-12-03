import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
ï;
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Fragment, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { KanbanBoard as CustomKanbanBoard } from "./KanbanBoard";
const formatDate = (value) => {
    if (!value)
        return "N/A";
    return new Date(value).toLocaleDateString("pt-BR");
};
const svgStrokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};
const BriefcaseIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" }), _jsx("rect", { x: "3", y: "7", width: "18", height: "13", rx: "2" }), _jsx("path", { d: "M16 7H8" }), _jsx("path", { d: "M12 12v3" })] }));
const ListChecksIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("rect", { x: "3", y: "4", width: "10", height: "16", rx: "2" }), _jsx("path", { d: "M8 8h3" }), _jsx("path", { d: "M8 12h3" }), _jsx("path", { d: "M8 16h3" }), _jsx("path", { d: "M17 8l2 2 3-3" }), _jsx("path", { d: "M17 14l2 2 3-3" })] }));
const AlertTriangleIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" }), _jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), _jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })] }));
const ClockIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("circle", { cx: "12", cy: "12", r: "8" }), _jsx("path", { d: "M12 8v5l3 2" })] }));
const UsersIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("path", { d: "M17 11a4 4 0 1 0-3.36-6.17" }), _jsx("path", { d: "M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" }), _jsx("path", { d: "M17 21v-1.5a4.5 4.5 0 0 0-2-3.74" })] }));
const BarChartIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("line", { x1: "3", y1: "21", x2: "21", y2: "21" }), _jsx("rect", { x: "6", y: "4", width: "3", height: "13", rx: "1.5" }), _jsx("rect", { x: "11", y: "9", width: "3", height: "8", rx: "1.5" }), _jsx("rect", { x: "16", y: "6", width: "3", height: "11", rx: "1.5" })] }));
const SettingsIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l0 0a2 2 0 1 1-2.83 2.83h0a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v0a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33h0a2 2 0 1 1-2.83-2.83h0a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h0a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82h0a2 2 0 1 1 2.83-2.83h0a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.1V3a2 2 0 0 1 4 0v0a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33h0a2 2 0 1 1 2.83 2.83h0a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h0a1.65 1.65 0 0 0-1.51 1Z" })] }));
export const FileIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M8 3h5l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" }), _jsx("path", { d: "M13 3v4a1 1 0 0 0 1 1h4" })] }));
const CommentIcon = (props) => (_jsx("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: _jsx("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9H12a8.5 8.5 0 0 1 9 8.5Z" }) }));
const InsightIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M12 2v3" }), _jsx("path", { d: "m16.2 7 2.1-2.1" }), _jsx("path", { d: "M22 12h-3" }), _jsx("path", { d: "m16.2 17 2.1 2.1" }), _jsx("path", { d: "M12 19v3" }), _jsx("path", { d: "m7.8 17-2.1 2.1" }), _jsx("path", { d: "M5 12H2" }), _jsx("path", { d: "M7.8 7 5.7 4.9" }), _jsx("circle", { cx: "12", cy: "12", r: "4" })] }));
const BuildingIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M9 3v18" }), _jsx("path", { d: "M15 3v18" }), _jsx("path", { d: "M3 9h6" }), _jsx("path", { d: "M3 15h6" }), _jsx("path", { d: "M15 9h6" }), _jsx("path", { d: "M15 15h6" })] }));
const UploadCloudIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M12 16V4" }), _jsx("path", { d: "m6 10 6-6 6 6" }), _jsx("path", { d: "M20 16.5a4.5 4.5 0 0 0-3.5-7.5h-1" }), _jsx("path", { d: "M6 19a4 4 0 0 1 0-8h1" })] }));
const DownloadIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("path", { d: "m7 10 5 5 5-5" }), _jsx("path", { d: "M12 15V3" })] }));
const TrashIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, ...props, children: [_jsx("path", { d: "M3 6h18" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }), _jsx("path", { d: "M14 10v8" }), _jsx("path", { d: "M10 10v8" }), _jsx("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })] }));
const MenuDotsIcon = (props) => (_jsxs("svg", { viewBox: "0 0 24 24", ...svgStrokeProps, strokeWidth: 2.4, ...props, children: [_jsx("circle", { cx: "5", cy: "12", r: "1.5" }), _jsx("circle", { cx: "12", cy: "12", r: "1.5" }), _jsx("circle", { cx: "19", cy: "12", r: "1.5" })] }));
const sidebarNavigation = [
    { id: "organizacao", label: "Organizacoes", icon: BuildingIcon, path: "/organizacao" },
    { id: "dashboard", label: "Dashboard", icon: BriefcaseIcon, path: "/dashboard" },
    { id: "projects", label: "Projetos", icon: ListChecksIcon, path: "/projects" },
    { id: "edt", label: "EAP", icon: UsersIcon, path: "/edt" },
    { id: "board", label: "Kanban", icon: ListChecksIcon, path: "/board" },
    { id: "cronograma", label: "Cronograma", icon: ClockIcon, path: "/cronograma" },
    { id: "atividades", label: "Timeline", icon: CommentIcon, path: "/atividades" },
    { id: "documentos", label: "Documentos", icon: FileIcon, path: "/documentos" },
    { id: "relatorios", label: "Relatorios", icon: BarChartIcon, path: "/relatorios" },
    { id: "equipe", label: "Equipes", icon: UsersIcon, path: "/equipe" },
    { id: "plano", label: "Meu plano", icon: BriefcaseIcon, path: "/plano" }
];
const SIDEBAR_STORAGE_KEY = "gp-sidebar-collapsed";
export const EmptyStateCard = ({ icon: Icon, title, description, actionLabel, onAction }) => (_jsxs("article", { className: "empty-state-card", children: [_jsx("div", { className: "empty-state-card__icon", children: _jsx(Icon, { width: 32, height: 32 }) }), _jsxs("div", { className: "empty-state-card__body", children: [_jsx("h4", { children: title }), _jsx("p", { children: description })] }), actionLabel ? (_jsx("button", { type: "button", className: "primary-button empty-state-card__cta", onClick: onAction, children: actionLabel })) : null] }));
const createEmptyProjectForm = () => ({
    name: "",
    clientName: "",
    budget: "",
    repositoryUrl: "",
    startDate: "",
    endDate: "",
    description: "",
    teamMembers: ""
});
const CalendarIcon = () => (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "3", y: "5.5", width: "18", height: "15", rx: "2", ry: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("line", { x1: "8", y1: "3", x2: "8", y2: "7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("line", { x1: "16", y1: "3", x2: "16", y2: "7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const FolderIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M3 7.5a2.5 2.5 0 012.5-2.5H10l2.3 2.3c.3.3.7.5 1.1.5h7.1A1.5 1.5 0 0122 8.8v8.2A3 3 0 0119 20H5a3 3 0 01-3-3Z", fill: "currentColor", opacity: "0.15" }), _jsx("path", { d: "M4.5 6H10a2 2 0 011.4.6l1.2 1.3c.4.4.9.6 1.4.6h5.7A1.5 1.5 0 0120 10v7a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 012 17V9.5A3.5 3.5 0 015.5 6Z", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinejoin: "round" })] }));
const TaskIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "4", y: "6", width: "16", height: "12", rx: "2", ry: "2", fill: "none", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("path", { d: "M8 10h8M8 14h5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
const MoreIcon = () => (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "5", cy: "12", r: "1.6", fill: "currentColor" }), _jsx("circle", { cx: "12", cy: "12", r: "1.6", fill: "currentColor" }), _jsx("circle", { cx: "19", cy: "12", r: "1.6", fill: "currentColor" })] }));
const DetailsIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm7 4v6m0-6V8m0 0h.01M7 12h4m-4 4h10", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const statusDictionary = {
    DONE: { label: "Finalizado", tone: "success" },
    COMPLETED: { label: "Finalizado", tone: "success" },
    FINISHED: { label: "Finalizado", tone: "success" },
    IN_PROGRESS: { label: "Em andamento", tone: "info" },
    WORKING: { label: "Em andamento", tone: "info" },
    BACKLOG: { label: "Nï¿½o iniciado", tone: "neutral" },
    PLANNED: { label: "Nï¿½o iniciado", tone: "neutral" },
    NOT_STARTED: { label: "Nï¿½o iniciado", tone: "neutral" },
    WAITING: { label: "Nï¿½o iniciado", tone: "neutral" },
    LATE: { label: "Em atraso", tone: "danger" },
    OVERDUE: { label: "Em atraso", tone: "danger" },
    AT_RISK: { label: "Em risco", tone: "warning" },
    BLOCKED: { label: "Em risco", tone: "warning" }
};
const editableStatusValues = ["BACKLOG", "IN_PROGRESS", "DONE", "LATE", "AT_RISK"];
const WORKDAY_HOURS = 8;
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const formatDateInputValue = (value) => {
    if (!value)
        return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
};
const isoFromDateInput = (value) => {
    if (!value)
        return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime()))
        return null;
    return date.toISOString();
};
const computeDurationDays = (start, end) => {
    if (!start || !end)
        return null;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime))
        return null;
    return Math.max(1, Math.round((endTime - startTime) / MS_IN_DAY));
};
const getDurationInputValue = (node) => {
    const diff = computeDurationDays(node.startDate, node.endDate);
    if (diff !== null)
        return String(diff);
    const rawHours = typeof node.estimateHours === "number"
        ? node.estimateHours
        : Number(node.estimateHours ?? 0);
    if (Number.isFinite(rawHours) && rawHours > 0) {
        return String(Math.max(1, Math.round(rawHours / WORKDAY_HOURS)));
    }
    return "";
};
export const WbsTreeView = ({ nodes, loading, error, onCreate, onUpdate, onDelete, onRestore, onMove, selectedNodeId, onSelect, dependencyOptions, onUpdateDependency }) => {
    const [expandedNodes, setExpandedNodes] = useState({});
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [statusPickerId, setStatusPickerId] = useState(null);
    const [editingDependenciesId, setEditingDependenciesId] = useState(null);
    const [pendingDependencies, setPendingDependencies] = useState([]);
    const dependencyEditorRef = useRef(null);
    const allRows = useMemo(() => {
        const buildRows = (tree, marker = [], parentId = null, level = 0) => tree.flatMap((node, index) => {
            const wbsMarker = [...marker, index + 1];
            const children = Array.isArray(node.children) ? node.children : [];
            const current = {
                node,
                displayId: wbsMarker.join("."),
                level,
                parentId,
                hasChildren: children.length > 0
            };
            return [current, ...buildRows(children, wbsMarker, node.id, level + 1)];
        });
        return buildRows(nodes);
    }, [nodes]);
    const rowMap = useMemo(() => {
        const map = new Map();
        allRows.forEach((row) => map.set(row.node.id, row));
        return map;
    }, [allRows]);
    const cancelTitleEdit = () => {
        setEditingNodeId(null);
        setEditingTitle("");
    };
    const closeDependencyEditor = () => {
        dependencyEditorRef.current = null;
        setEditingDependenciesId(null);
        setPendingDependencies([]);
    };
    const handleBeginTitleEdit = (event, node) => {
        event.stopPropagation();
        setStatusPickerId(null);
        setEditingNodeId(node.id);
        setEditingTitle(node.title ?? "");
    };
    const commitTitleEdit = () => {
        if (!editingNodeId)
            return;
        const trimmed = editingTitle.trim();
        const previous = rowMap.get(editingNodeId)?.node.title ?? "";
        cancelTitleEdit();
        if (!trimmed || trimmed === previous) {
            return;
        }
        onUpdate(editingNodeId, { title: trimmed });
    };
    const handleTitleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitTitleEdit();
        }
        else if (event.key === "Escape") {
            event.preventDefault();
            cancelTitleEdit();
        }
    };
    const handleStatusToggle = (event, nodeId) => {
        event.stopPropagation();
        cancelTitleEdit();
        setStatusPickerId((current) => (current === nodeId ? null : nodeId));
    };
    const handleStatusChange = (event, nodeId, statusValue) => {
        event.stopPropagation();
        setStatusPickerId(null);
        const normalized = statusValue.toUpperCase();
        const current = (rowMap.get(nodeId)?.node.status ?? "").toUpperCase();
        if (current === normalized)
            return;
        onUpdate(nodeId, { status: normalized });
    };
    const handleDateFieldChange = (nodeId, field, inputValue) => {
        cancelTitleEdit();
        setStatusPickerId(null);
        const row = rowMap.get(nodeId);
        if (!row)
            return;
        const isoValue = isoFromDateInput(inputValue);
        const nextStart = field === "startDate" ? isoValue : row.node.startDate ?? null;
        const nextEnd = field === "endDate" ? isoValue : row.node.endDate ?? null;
        const updates = {};
        if (field === "startDate")
            updates.startDate = isoValue;
        if (field === "endDate")
            updates.endDate = isoValue;
        const durationDays = computeDurationDays(nextStart, nextEnd);
        if (durationDays !== null) {
            updates.estimateHours = durationDays * WORKDAY_HOURS;
        }
        onUpdate(nodeId, updates);
    };
    const handleDurationInputChange = (nodeId, value) => {
        cancelTitleEdit();
        setStatusPickerId(null);
        if (!value)
            return;
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return;
        const durationDays = Math.max(1, Math.round(parsed));
        const row = rowMap.get(nodeId);
        if (!row)
            return;
        const updates = {
            estimateHours: durationDays * WORKDAY_HOURS
        };
        if (row.node.startDate) {
            const startDate = new Date(row.node.startDate);
            if (!Number.isNaN(startDate.getTime())) {
                const newEnd = new Date(startDate.getTime());
                newEnd.setDate(startDate.getDate() + (durationDays - 1));
                updates.endDate = newEnd.toISOString();
            }
        }
        onUpdate(nodeId, updates);
    };
    const statusPopoverStyle = {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        background: "#fff",
        borderRadius: "0.65rem",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
        padding: "0.35rem",
        display: "flex",
        flexDirection: "column",
        minWidth: "180px",
        gap: "0.25rem",
        zIndex: 20
    };
    const progressMap = useMemo(() => {
        const cache = new Map();
        const compute = (node) => {
            if (cache.has(node.id))
                return cache.get(node.id);
            let value = 0;
            if (typeof node.progress === "number" && Number.isFinite(node.progress)) {
                value = Math.max(0, Math.min(100, Math.round(node.progress)));
            }
            else if (Array.isArray(node.children) && node.children.length) {
                const total = node.children.reduce((sum, child) => sum + compute(child), 0);
                value = node.children.length ? Math.round(total / node.children.length) : 0;
            }
            cache.set(node.id, value);
            return value;
        };
        nodes.forEach((node) => compute(node));
        return cache;
    }, [nodes]);
    useEffect(() => {
        if (!editingDependenciesId)
            return;
        const handleDocumentMouseDown = (event) => {
            if (!dependencyEditorRef.current)
                return;
            if (!dependencyEditorRef.current.contains(event.target)) {
                closeDependencyEditor();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeDependencyEditor();
            }
        };
        document.addEventListener("mousedown", handleDocumentMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [editingDependenciesId]);
    const visibleRows = useMemo(() => {
        return allRows.filter((row) => {
            if (row.level === 0)
                return true;
            let parentId = row.parentId;
            while (parentId) {
                const parentRow = rowMap.get(parentId);
                if (!parentRow)
                    break;
                const isExpanded = expandedNodes[parentId] ?? parentRow.level < 1;
                if (!isExpanded)
                    return false;
                parentId = parentRow.parentId;
            }
            return true;
        });
    }, [allRows, rowMap, expandedNodes]);
    const handleLevelAdjust = (event, nodeId, direction) => {
        event.stopPropagation();
        cancelTitleEdit();
        setStatusPickerId(null);
        const currentRow = rowMap.get(nodeId);
        if (!currentRow)
            return;
        if (direction === "up") {
            if (!currentRow.parentId)
                return;
            const parentRow = rowMap.get(currentRow.parentId);
            if (!parentRow)
                return;
            const newParentId = parentRow.parentId ?? null;
            const newParentRow = newParentId ? rowMap.get(newParentId) : null;
            const siblings = newParentRow ? newParentRow.node.children ?? [] : nodes;
            const parentIndex = siblings.findIndex((child) => child.id === parentRow.node.id);
            const position = parentIndex >= 0 ? parentIndex + 1 : siblings.length;
            onMove(nodeId, newParentId, position);
            return;
        }
        const parentRow = currentRow.parentId ? rowMap.get(currentRow.parentId) : null;
        const siblings = parentRow ? parentRow.node.children ?? [] : nodes;
        const currentIndex = siblings.findIndex((child) => child.id === nodeId);
        if (currentIndex <= 0)
            return;
        const newParentNode = siblings[currentIndex - 1];
        if (!newParentNode)
            return;
        const childCount = Array.isArray(newParentNode.children) ? newParentNode.children.length : 0;
        onMove(nodeId, newParentNode.id, childCount);
        setExpandedNodes((prev) => ({ ...prev, [newParentNode.id]: true }));
    };
    const resolveStatus = (status) => {
        if (!status)
            return { label: "Nï¿½o iniciado", tone: "neutral" };
        const normalized = status.toUpperCase();
        return statusDictionary[normalized] ?? { label: status, tone: "neutral" };
    };
    const formatDuration = (start, end) => {
        if (!start || !end)
            return "â€”";
        const diff = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
        return `${diff}d`;
    };
    const selectedRow = selectedNodeId ? rowMap.get(selectedNodeId) ?? null : null;
    const selectedNode = selectedRow?.node ?? null;
    const selectedStatus = resolveStatus(selectedNode?.status);
    const selectedProgress = selectedNode ? progressMap.get(selectedNode.id) ?? 0 : 0;
    const selectedChecklist = Array.isArray(selectedNode?.checklist) ? selectedNode.checklist : [];
    const ensureAncestorsExpanded = useCallback((nodeId) => {
        setExpandedNodes((current) => {
            const next = { ...current };
            let parentId = rowMap.get(nodeId)?.parentId ?? null;
            while (parentId) {
                next[parentId] = true;
                parentId = rowMap.get(parentId)?.parentId ?? null;
            }
            return next;
        });
    }, [rowMap]);
    const handleToggle = (event, nodeId, level) => {
        event.stopPropagation();
        setExpandedNodes((prev) => ({
            ...prev,
            [nodeId]: !(prev[nodeId] ?? level < 1)
        }));
    };
    const handleRowSelect = (nodeId) => {
        const isSame = selectedNodeId === nodeId;
        onSelect(isSame ? null : nodeId);
        setOpenMenuId(null);
        setStatusPickerId(null);
        cancelTitleEdit();
        closeDependencyEditor();
    };
    const openDependencyEditorForNode = (nodeId, dependencies) => {
        cancelTitleEdit();
        setStatusPickerId(null);
        setOpenMenuId(null);
        if (editingDependenciesId === nodeId) {
            closeDependencyEditor();
        }
        else {
            setEditingDependenciesId(nodeId);
            setPendingDependencies(dependencies);
        }
    };
    const handleDependencyAreaKeyDown = (event, nodeId, dependencies) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDependencyEditorForNode(nodeId, dependencies);
        }
        else if (event.key === "Escape") {
            event.preventDefault();
            closeDependencyEditor();
        }
    };
    const handleDependencyToggle = (nodeId, dependencyId, checked) => {
        if (editingDependenciesId !== nodeId)
            return;
        setPendingDependencies((current) => {
            let next = current;
            if (checked && !current.includes(dependencyId)) {
                next = [...current, dependencyId];
            }
            else if (!checked && current.includes(dependencyId)) {
                next = current.filter((value) => value !== dependencyId);
            }
            if (next !== current) {
                onUpdate(nodeId, { dependencies: next });
            }
            return next;
        });
    };
    const handleMenuToggle = (event, nodeId) => {
        event.stopPropagation();
        cancelTitleEdit();
        setStatusPickerId(null);
        closeDependencyEditor();
        setOpenMenuId((current) => (current === nodeId ? null : nodeId));
    };
    const handleMenuAction = (event, label, node) => {
        event.stopPropagation();
        window.alert(`Aï¿½ï¿½o "${label}" para ${node.title} dispoNï¿½vel em breve.`);
        setOpenMenuId(null);
    };
    const handleCloseDetails = (event) => {
        event.stopPropagation();
        onSelect(null);
        setOpenMenuId(null);
    };
    const handleDetailsButton = (event, nodeId) => {
        event.stopPropagation();
        handleRowSelect(nodeId);
    };
    if (!nodes.length) {
        return _jsx("p", { className: "muted", children: "Nenhum item cadastrado." });
    }
    return (_jsx("div", { className: "wbs-table-card", children: _jsx("div", { className: "edt-horizontal-scroll", children: _jsxs("table", { className: "wbs-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "col-id", children: "ID" }), _jsx("th", { className: "col-level", children: "N\u00EF\u00BF\u00BDvel" }), _jsx("th", { className: "col-name", children: "Nome da tarefa" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "DurA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo" }), _jsx("th", { children: "In\u00EF\u00BF\u00BDcio" }), _jsx("th", { children: "T\u00EF\u00BF\u00BDrmino" }), _jsx("th", { children: "Respons\u00EF\u00BF\u00BDvel" }), _jsx("th", { children: "Depend\u00EF\u00BF\u00BDncias" }), _jsx("th", { children: "Detalhes" }), _jsx("th", {})] }) }), _jsx("tbody", { children: visibleRows.map((row) => {
                            const displayId = row.node.wbsCode ?? row.displayId;
                            const visualLevel = typeof row.node.level === "number" ? row.node.level : row.level;
                            const status = resolveStatus(row.node.status);
                            const isExpanded = row.hasChildren ? expandedNodes[row.node.id] ?? visualLevel < 1 : false;
                            const isActive = selectedNodeId === row.node.id;
                            const ownerName = row.node.owner?.name ?? null;
                            const ownerEmail = row.node.owner?.email ?? null;
                            const ownerTooltip = ownerName && ownerEmail ? `${ownerName} (${ownerEmail})` : ownerName ?? "Sem Responsï¿½vel definido";
                            const initials = ownerName
                                ? ownerName
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()
                                : null;
                            const dependencyBadges = Array.isArray(row.node.dependencies) ? row.node.dependencies : [];
                            const dependencyInfos = dependencyBadges.map((dependencyId) => {
                                const dependencyRow = rowMap.get(dependencyId);
                                if (!dependencyRow) {
                                    return {
                                        id: dependencyId,
                                        label: dependencyId,
                                        tooltip: "Tarefa Nï¿½o encontrada",
                                        row: null
                                    };
                                }
                                const label = dependencyRow.node.wbsCode ?? dependencyRow.displayId;
                                return {
                                    id: dependencyId,
                                    label,
                                    tooltip: `${label} - ${dependencyRow.node.title}`,
                                    row: dependencyRow
                                };
                            });
                            const parentRow = row.parentId ? rowMap.get(row.parentId) : null;
                            const siblingsAtLevel = parentRow ? parentRow.node.children ?? [] : nodes;
                            const currentLevelIndex = siblingsAtLevel.findIndex((child) => child.id === row.node.id);
                            const canLevelUp = Boolean(parentRow);
                            const canLevelDown = currentLevelIndex > 0;
                            const limitedLevel = Math.max(0, Math.min(visualLevel, 4));
                            const levelClass = `level-${limitedLevel}`;
                            const isEditingTitle = editingNodeId === row.node.id;
                            const normalizedStatus = (row.node.status ?? "").toUpperCase();
                            const isStatusPickerOpen = statusPickerId === row.node.id;
                            return (_jsxs(Fragment, { children: [_jsxs("tr", { className: `wbs-row level-${limitedLevel} ${isActive ? "is-active" : ""}`, children: [_jsx("td", { className: "wbs-id", children: displayId }), _jsxs("td", { className: "wbs-level-cell", children: [_jsxs("span", { className: "wbs-level-pill", children: ["N", visualLevel] }), _jsxs("div", { className: "wbs-level-actions", role: "group", "aria-label": "Ajustar N\u00EF\u00BF\u00BDvel", children: [_jsx("button", { type: "button", className: "level-arrow", "aria-label": "Subir N\u00EF\u00BF\u00BDvel", onClick: (event) => handleLevelAdjust(event, row.node.id, "up"), disabled: !canLevelUp, children: "<" }), _jsx("button", { type: "button", className: "level-arrow", "aria-label": "Descer N\u00EF\u00BF\u00BDvel", onClick: (event) => handleLevelAdjust(event, row.node.id, "down"), disabled: !canLevelDown, children: ">" })] })] }), _jsx("td", { className: "wbs-name-cell", children: _jsxs("div", { className: `wbs-task-name ${visualLevel <= 1 ? "is-phase" : ""} ${levelClass}`, children: [row.hasChildren ? (_jsx("button", { type: "button", className: `wbs-toggle ${isExpanded ? "is-open" : ""}`, onClick: (event) => handleToggle(event, row.node.id, visualLevel), "aria-label": isExpanded ? "Recolher subtarefas" : "Expandir subtarefas", "aria-expanded": isExpanded, children: isExpanded ? "v" : ">" })) : (_jsx("span", { className: "wbs-toggle placeholder" })), _jsx("span", { className: `wbs-node-icon ${row.hasChildren ? "is-folder" : "is-task"}`, children: row.hasChildren ? _jsx(FolderIcon, {}) : _jsx(TaskIcon, {}) }), _jsx("div", { className: "wbs-task-text", title: row.node.title ?? "Tarefa sem nome", onDoubleClick: (event) => handleBeginTitleEdit(event, row.node), children: isEditingTitle ? (_jsx("input", { className: "wbs-title-input", value: editingTitle, onChange: (event) => setEditingTitle(event.target.value), onBlur: commitTitleEdit, onKeyDown: handleTitleKeyDown, onClick: (event) => event.stopPropagation(), autoFocus: true, placeholder: "Nome da tarefa" })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: row.node.title ?? "Tarefa sem nome" }), row.node.description && _jsx("small", { title: row.node.description, children: row.node.description })] })) })] }) }), _jsx("td", { children: _jsxs("div", { style: { position: "relative", display: "inline-flex" }, children: [_jsx("button", { type: "button", className: `wbs-status wbs-status--${status.tone}`, onClick: (event) => handleStatusToggle(event, row.node.id), children: status.label }), isStatusPickerOpen && (_jsx("div", { className: "wbs-status-picker", style: statusPopoverStyle, children: editableStatusValues.map((value) => {
                                                                const option = statusDictionary[value] ?? {
                                                                    label: value,
                                                                    tone: "neutral"
                                                                };
                                                                const isActiveOption = normalizedStatus === value;
                                                                return (_jsx("button", { type: "button", onClick: (event) => handleStatusChange(event, row.node.id, value), style: {
                                                                        border: "none",
                                                                        background: isActiveOption ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                                                        padding: 0,
                                                                        textAlign: "left",
                                                                        cursor: "pointer"
                                                                    }, children: _jsx("span", { className: `wbs-status wbs-status--${option.tone}`, children: option.label }) }, value));
                                                            }) }))] }) }), _jsx("td", { children: _jsx("input", { type: "number", min: 1, className: "wbs-duration-input", "aria-label": "DurA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo em dias", value: getDurationInputValue(row.node), placeholder: "\u00E2\u20AC\u201D", onChange: (event) => handleDurationInputChange(row.node.id, event.target.value) }) }), _jsx("td", { children: _jsxs("div", { className: "wbs-date-input-wrapper", children: [_jsx(CalendarIcon, {}), _jsx("input", { type: "date", "aria-label": "Data de In\u00EF\u00BF\u00BDcio", value: formatDateInputValue(row.node.startDate), onChange: (event) => handleDateFieldChange(row.node.id, "startDate", event.target.value) })] }) }), _jsx("td", { children: _jsxs("div", { className: "wbs-date-input-wrapper", children: [_jsx(CalendarIcon, {}), _jsx("input", { type: "date", "aria-label": "Data de T\u00EF\u00BF\u00BDrmino", value: formatDateInputValue(row.node.endDate), onChange: (event) => handleDateFieldChange(row.node.id, "endDate", event.target.value) })] }) }), _jsx("td", { children: ownerName ? (_jsxs("div", { className: "wbs-owner", title: ownerTooltip, children: [_jsx("span", { className: "wbs-owner__avatar", children: initials }), _jsx("strong", { children: ownerName })] })) : (_jsx("span", { className: "muted", children: "Sem Respons\u00EF\u00BF\u00BDvel" })) }), _jsxs("td", { className: "wbs-dependencies-cell", children: [_jsx("div", { className: `wbs-dependencies-display ${editingDependenciesId === row.node.id ? "is-open" : ""}`, role: "button", tabIndex: 0, onClick: (event) => {
                                                            event.stopPropagation();
                                                            openDependencyEditorForNode(row.node.id, dependencyBadges);
                                                        }, onKeyDown: (event) => handleDependencyAreaKeyDown(event, row.node.id, dependencyBadges), children: dependencyInfos.length ? (_jsxs("div", { className: "wbs-dependencies", children: [_jsx("span", { className: "wbs-dependencies__label", children: "Depende de" }), _jsxs("div", { className: "wbs-dependencies__items", children: [dependencyInfos.slice(0, 3).map((info) => (_jsx("span", { className: "wbs-dependency-pill", title: info.tooltip, children: info.label }, `${row.node.id}-${info.id}`))), dependencyInfos.length > 3 && (_jsxs("span", { className: "wbs-dependency-pill extra", title: dependencyInfos
                                                                                .slice(3)
                                                                                .map((info) => info.tooltip)
                                                                                .join("\n"), children: ["+", dependencyInfos.length - 3] }))] })] })) : (_jsx("span", { className: "wbs-dependency-pill muted", children: "Sem Depend\u00EF\u00BF\u00BDncias" })) }), editingDependenciesId === row.node.id && (_jsxs("div", { className: "wbs-dependencies-editor", ref: (element) => {
                                                            if (editingDependenciesId === row.node.id) {
                                                                dependencyEditorRef.current = element;
                                                            }
                                                        }, onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "wbs-dependencies-editor__header", children: [_jsx("strong", { children: "Selecione predecessoras" }), _jsx("p", { className: "subtext", children: "Marque as tarefas das quais esta atividade depende." })] }), _jsx("div", { className: "wbs-dependencies-editor__list", children: allRows
                                                                    .filter((optionRow) => optionRow.node.id !== row.node.id)
                                                                    .map((optionRow) => {
                                                                    const optionId = optionRow.node.id;
                                                                    const label = optionRow.node.wbsCode ?? optionRow.displayId;
                                                                    const title = optionRow.node.title ?? "Tarefa sem nome";
                                                                    const checked = pendingDependencies.includes(optionId);
                                                                    return (_jsxs("label", { className: "dependency-option", title: `${label} - ${title}`, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (event) => {
                                                                                    event.stopPropagation();
                                                                                    handleDependencyToggle(row.node.id, optionId, event.currentTarget.checked);
                                                                                } }), _jsxs("span", { className: "dependency-option__title", children: [label, " - ", title] })] }, optionId));
                                                                }) })] }))] }), _jsx("td", { className: "wbs-details-cell", children: _jsxs("button", { type: "button", className: `wbs-details-button ${isActive ? "is-active" : ""}`, onClick: (event) => handleDetailsButton(event, row.node.id), "aria-label": "Ver detalhes da tarefa", children: [_jsx(DetailsIcon, {}), _jsx("span", { className: "details-label", children: "Detalhes" })] }) }), _jsx("td", { children: _jsxs("div", { className: "wbs-actions", children: [_jsx("button", { type: "button", className: "wbs-actions__trigger", onClick: (event) => handleMenuToggle(event, row.node.id), "aria-label": "Op\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes da tarefa", children: _jsx(MoreIcon, {}) }), openMenuId === row.node.id && (_jsx("div", { className: "wbs-actions__menu", children: [
                                                                "Editar tarefa",
                                                                "Mover Nï¿½vel",
                                                                "Adicionar subtarefa",
                                                                "Duplicar",
                                                                "Excluir"
                                                            ].map((label) => (_jsx("button", { type: "button", onClick: (event) => handleMenuAction(event, label, row.node), children: label }, label))) }))] }) })] }), isActive && selectedNode && (_jsx("tr", { className: "wbs-detail-row", children: _jsx("td", { colSpan: 11, children: _jsxs("div", { className: "wbs-detail-card", children: [_jsxs("header", { className: "wbs-detail-card__header", children: [_jsxs("div", { children: [_jsx("span", { className: "wbs-level-tag", children: selectedNode.wbsCode ?? selectedRow?.displayId }), _jsx("h4", { children: selectedNode.title }), _jsx("span", { className: `wbs-status wbs-status--${selectedStatus.tone}`, children: selectedStatus.label })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseDetails, children: "Fechar" })] }), _jsx("p", { className: "wbs-detail-card__description", children: selectedNode.description ?? "Nenhuma descriï¿½ï¿½o registrada para esta tarefa." }), _jsxs("div", { className: "wbs-detail-card__grid", children: [_jsxs("div", { children: [_jsx("span", { className: "subtext", children: "In\u00EF\u00BF\u00BDcio" }), _jsx("strong", { children: formatDate(selectedNode.startDate) })] }), _jsxs("div", { children: [_jsx("span", { className: "subtext", children: "T\u00EF\u00BF\u00BDrmino" }), _jsx("strong", { children: formatDate(selectedNode.endDate) })] }), _jsxs("div", { children: [_jsx("span", { className: "subtext", children: "DurA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo" }), _jsx("strong", { children: formatDuration(selectedNode.startDate, selectedNode.endDate) })] }), _jsxs("div", { children: [_jsx("span", { className: "subtext", children: "Progresso" }), _jsxs("strong", { children: [selectedProgress, "%"] })] }), _jsxs("div", { children: [_jsx("span", { className: "subtext", children: "Horas registradas" }), _jsxs("strong", { children: [selectedNode.actualHours ?? 0, "h"] })] }), _jsxs("div", { children: [_jsx("span", { className: "subtext", children: "Documentos" }), _jsx("strong", { children: selectedNode.documents ?? 0 })] })] }), _jsxs("div", { className: "wbs-detail-card__responsible", children: [_jsx("h5", { children: "Respons\u00EF\u00BF\u00BDvel" }), selectedNode.owner ? (_jsxs("div", { className: "wbs-owner", children: [_jsx("span", { className: "wbs-owner__avatar", children: selectedNode.owner.name
                                                                            ?.split(" ")
                                                                            .map((part) => part[0])
                                                                            .join("")
                                                                            .slice(0, 2)
                                                                            .toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: selectedNode.owner.name }), selectedNode.owner.email && _jsx("small", { children: selectedNode.owner.email })] })] })) : (_jsx("p", { className: "muted", children: "Defina um Respons\u00EF\u00BF\u00BDvel para acompanhar esta atividade." }))] }), _jsxs("div", { className: "wbs-detail-card__checklist", children: [_jsx("h5", { children: "Checklist" }), selectedChecklist.length ? (_jsx("ul", { className: "wbs-checklist", children: selectedChecklist.map((item) => (_jsxs("li", { children: [_jsx("input", { type: "checkbox", checked: Boolean(item.done), readOnly: true }), _jsx("span", { children: item.title })] }, item.id ?? item.title))) })) : (_jsx("p", { className: "muted", children: "Nenhum item de checklist cadastrado." }))] }), _jsxs("div", { className: "wbs-detail-card__documents", children: [_jsx("h5", { children: "Documentos" }), _jsx("p", { className: "muted", children: selectedNode.documents
                                                                    ? `${selectedNode.documents} arquivos vinculados a esta entrega.`
                                                                    : "Sem anexos atï¿½ o momento." })] })] }) }) }))] }, row.node.id));
                        }) })] }) }) }));
};
export const GanttTimeline = ({ tasks, milestones }) => {
    if (!tasks.length)
        return _jsx("p", { className: "muted", children: "Nenhuma tarefa com datas definidas." });
    const allDates = [
        ...tasks.flatMap((task) => [task.startDate, task.endDate]),
        ...milestones.map((milestone) => milestone.dueDate)
    ]
        .filter(Boolean)
        .map((value) => new Date(value));
    if (!allDates.length) {
        return _jsx("p", { className: "muted", children: "Defina datas para visualizar o cronograma." });
    }
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
    return (_jsxs("div", { className: "gantt", children: [tasks.map((task) => (_jsxs("div", { className: "gantt-row", children: [_jsxs("div", { className: "gantt-row__label", children: [_jsx("strong", { children: task.title }), _jsx("span", { children: task.status })] }), _jsx("div", { className: "gantt-row__bar", children: _jsx("span", { style: {
                                left: `${offsetPercent(task.startDate)}%`,
                                width: `${widthPercent(task.startDate, task.endDate)}%`
                            } }) })] }, task.id))), _jsxs("div", { className: "gantt-milestones", children: [_jsx("strong", { children: "Marcos:" }), " ", milestones.length
                        ? milestones.map((milestone) => `${milestone.name} (${formatDate(milestone.dueDate)})`).join(", ")
                        : "Nenhum marco"] })] }));
};
export const ProjectDetailsTabs = ({ projectMeta, projectLoading, onEditProject, onAddTask, summary, summaryError, filters, onRangeChange, myTasks, members, membersError, attachments, attachmentsError, attachmentsLoading, reportMetrics, reportMetricsError, reportMetricsLoading, boardColumns, kanbanColumns, boardError, onCreateTask, onReloadBoard, onDragTask, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange, newTaskStartDate, onTaskStartDateChange, newTaskEndDate, onTaskEndDateChange, newTaskAssignee, onTaskAssigneeChange, newTaskEstimateHours, onTaskEstimateHoursChange, wbsNodes, wbsError, onMoveNode, onUpdateNode, selectedNodeId, onSelectNode, comments, commentsError, onSubmitComment, commentBody, onCommentBodyChange, timeEntryDate, timeEntryHours, timeEntryDescription, timeEntryError, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, ganttTasks, ganttMilestones, ganttError, onKanbanTaskClick }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const tabs = [
        { id: "overview", label: "Visï¿½o geral" },
        { id: "edt", label: "EDT" },
        { id: "board", label: "Board" },
        { id: "gantt", label: "Cronograma" },
        { id: "calendar", label: "Calendï¿½rio" },
        { id: "docs", label: "Documentos" },
        { id: "activity", label: "Atividade" }
    ];
    const progressPercent = summary?.totals?.total
        ? Math.round((summary.totals.done / summary.totals.total) * 100)
        : 0;
    const circumference = 2 * Math.PI * 54;
    const strokeValue = (progressPercent / 100) * circumference;
    const calendarEvents = useMemo(() => {
        const milestoneEvents = (ganttMilestones ?? [])
            .filter((milestone) => milestone?.dueDate)
            .map((milestone) => ({
            id: milestone.id ?? milestone.name,
            title: milestone.name ?? "Marco",
            date: milestone.dueDate,
            type: "Marco"
        }));
        const taskEvents = (ganttTasks ?? [])
            .filter((task) => task.startDate || task.endDate)
            .slice(0, 6)
            .map((task) => ({
            id: task.id,
            title: task.title,
            date: task.startDate ?? task.endDate,
            type: task.status ?? "Tarefa"
        }));
        return [...milestoneEvents, ...taskEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [ganttMilestones, ganttTasks]);
    const activityItems = useMemo(() => (comments ?? []).map((comment) => ({
        id: comment.id,
        author: comment.author?.name ?? comment.authorName ?? "Colaborador",
        role: comment.author?.role ?? comment.authorRole ?? "Equipe",
        body: comment.body,
        createdAt: comment.createdAt ?? new Date().toISOString()
    })), [comments]);
    const commentTextareaRef = useRef(null);
    const focusCommentComposer = () => {
        if (commentTextareaRef.current) {
            commentTextareaRef.current.focus();
            commentTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };
    const handleAddDocument = () => {
        if (typeof window !== "undefined") {
            window.alert("IntegrAï¿½ï¿½o de upload em breve.");
        }
    };
    const formatShortDate = (value) => {
        if (!value)
            return "â€”";
        try {
            return new Date(value).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short"
            });
        }
        catch {
            return "â€”";
        }
    };
    const formatFileSize = (value) => {
        if (!value)
            return "â€”";
        if (value < 1024)
            return `${value} B`;
        if (value < 1024 * 1024)
            return `${(value / 1024).toFixed(1)} KB`;
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    };
    const renderStatusBadge = (status) => {
        if (!status)
            return _jsx("span", { className: "pill pill-neutral", children: "Sem status" });
        const normalized = status.toUpperCase();
        const toneMap = {
            DONE: "pill-success",
            COMPLETED: "pill-success",
            IN_PROGRESS: "pill-warning",
            PLANNED: "pill-neutral",
            AT_RISK: "pill-danger",
            BLOCKED: "pill-danger"
        };
        const labelMap = {
            DONE: "Concluï¿½do",
            COMPLETED: "Concluï¿½do",
            IN_PROGRESS: "Em andamento",
            PLANNED: "Planejado",
            AT_RISK: "Em risco",
            BLOCKED: "Bloqueado"
        };
        return _jsx("span", { className: `pill ${toneMap[normalized] ?? "pill-neutral"}`, children: labelMap[normalized] ?? status });
    };
    if (!projectMeta) {
        return (_jsx("section", { className: "project-details", children: _jsxs("article", { className: "card", children: [_jsx("h2", { children: projectLoading ? "Carregando dados do projeto..." : "Selecione um projeto" }), _jsx("p", { className: "muted", children: projectLoading ? "Buscando cards do portfï¿½lio para montar o cabeï¿½alho." : "Escolha um projeto no topo para ver os detalhes completos." })] }) }));
    }
    const overviewHeader = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "project-details__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Detalhes do projeto" }), _jsx("h2", { children: projectMeta.projectName }), _jsxs("p", { className: "subtext", children: ["C\u00EF\u00BF\u00BDdigo ", projectMeta.code ?? "â€”", " \u00C2\u00B7 Cliente ", projectMeta.clientName ?? "Nï¿½o informado"] }), _jsxs("div", { className: "project-header__meta", children: [renderStatusBadge(projectMeta.status), _jsxs("span", { children: ["Respons\u00EF\u00BF\u00BDvel: ", projectMeta.responsibleName ?? "â€”"] }), _jsxs("span", { children: ["Per\u00EF\u00BF\u00BDodo: ", formatShortDate(projectMeta.startDate), " \u00E2\u20AC\u201D ", formatShortDate(projectMeta.endDate)] })] })] }), _jsxs("div", { className: "project-header__actions", children: [_jsx("button", { type: "button", className: "secondary-button project-action project-action--secondary", onClick: onEditProject, disabled: !onEditProject, children: "Editar projeto" }), _jsx("button", { type: "button", className: "primary-button project-action project-action--primary", onClick: onAddTask, children: "Adicionar tarefa" }), _jsx("button", { type: "button", className: "ghost-button project-action project-action--link", children: "Compartilhar" })] })] }), _jsx("div", { className: "tabs", children: tabs.map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.id ? "is-active" : "", onClick: () => {
                        if (tab.id === "edt") {
                            const targetId = projectMeta?.projectId ?? projectMeta?.id ?? null;
                            if (targetId) {
                                navigate(`/projects/${targetId}/edt`);
                            }
                            return;
                        }
                        if (tab.id === "board") {
                            const targetId = projectMeta?.projectId ?? projectMeta?.id ?? null;
                            if (targetId) {
                                navigate(`/projects/${targetId}/board`);
                            }
                            return;
                        }
                        if (tab.id === "gantt") {
                            const targetId = projectMeta?.projectId ?? projectMeta?.id ?? null;
                            if (targetId) {
                                navigate(`/projects/${targetId}/cronograma`);
                            }
                            return;
                        }
                        if (tab.id === "docs") {
                            const targetId = projectMeta?.projectId ?? projectMeta?.id ?? null;
                            if (targetId) {
                                navigate(`/projects/${targetId}/documentos`);
                            }
                            return;
                        }
                        if (tab.id === "activity") {
                            const targetId = projectMeta?.projectId ?? projectMeta?.id ?? null;
                            if (targetId) {
                                navigate(`/projects/${targetId}/atividades`);
                            }
                            return;
                        }
                        setActiveTab(tab.id);
                    }, children: tab.label }, tab.id))) })] }));
    const overviewContent = (_jsxs("div", { className: "tab-panel", children: [_jsxs("div", { className: "status-grid", children: [_jsxs("article", { className: "card status-card", children: [_jsx("h3", { children: "Progresso geral" }), _jsxs("div", { className: "progress-ring", children: [_jsxs("svg", { width: "140", height: "140", children: [_jsx("circle", { cx: "70", cy: "70", r: "54", strokeWidth: "12", className: "progress-ring__bg" }), _jsx("circle", { cx: "70", cy: "70", r: "54", strokeWidth: "12", className: "progress-ring__value", strokeDasharray: `${strokeValue} ${circumference}` })] }), _jsxs("div", { className: "progress-ring__label", children: [_jsxs("strong", { children: [progressPercent, "%"] }), _jsx("span", { children: "Conclu\u00EF\u00BF\u00BDdo" })] })] }), _jsxs("ul", { className: "progress-legend", children: [_jsxs("li", { children: [_jsx("span", { className: "dot dot-done" }), summary?.totals?.done ?? 0, " Conclu\u00EF\u00BF\u00BDdas"] }), _jsxs("li", { children: [_jsx("span", { className: "dot dot-inprogress" }), summary?.totals?.inProgress ?? 0, " em andamento"] }), _jsxs("li", { children: [_jsx("span", { className: "dot dot-backlog" }), summary?.totals?.backlog ?? 0, " backlog"] })] })] }), _jsxs("article", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("h3", { children: "Burn-down / Horas" }), _jsxs("p", { className: "subtext", children: ["Vis\u00EF\u00BF\u00BDo dos \u00EF\u00BF\u00BDltimos ", filters.rangeDays, " dias"] })] }), _jsxs("label", { className: "inline-select", children: ["Intervalo", _jsxs("select", { value: filters.rangeDays, onChange: (event) => onRangeChange(Number(event.target.value)), children: [_jsx("option", { value: 7, children: "7" }), _jsx("option", { value: 14, children: "14" }), _jsx("option", { value: 30, children: "30" })] })] })] }), summaryError && _jsx("p", { className: "error-text", children: summaryError }), summary ? (_jsxs("div", { className: "chart-grid", children: [_jsx("div", { className: "chart-card", children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: summary.burnDown, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate, stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }, labelStyle: { fontWeight: 600, color: "#0c2748" } }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "done", stroke: "#34d399", strokeWidth: 3, dot: { r: 4 } }), _jsx(Line, { type: "monotone", dataKey: "remaining", stroke: "#f87171", strokeWidth: 3, dot: { r: 4 } })] }) }) }), _jsx("div", { className: "chart-card", children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: summary.timeEntries, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate, stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }, labelStyle: { fontWeight: 600, color: "#0c2748" } }), _jsx(Bar, { dataKey: "hours", fill: "#6b4eff", radius: [8, 8, 0, 0] })] }) }) })] })) : (_jsx("p", { className: "muted", children: "Selecione um projeto para ver o resumo." }))] })] }), summary && (_jsxs("div", { className: "summary-stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: summary.totals.total })] }), _jsxs("div", { children: [_jsx("span", { children: "Conclu\u00EF\u00BF\u00BDdas" }), _jsx("strong", { children: summary.totals.done })] }), _jsxs("div", { children: [_jsx("span", { children: "Em andamento" }), _jsx("strong", { children: summary.totals.inProgress })] }), _jsxs("div", { children: [_jsx("span", { children: "Backlog" }), _jsx("strong", { children: summary.totals.backlog })] }), _jsxs("div", { children: [_jsx("span", { children: "Bloqueadas" }), _jsx("strong", { children: summary.totals.blocked })] }), _jsxs("div", { children: [_jsx("span", { children: "Atrasadas" }), _jsx("strong", { children: summary.overdueTasks })] })] })), _jsxs("div", { className: "overview-grid", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Marcos" }) }), ganttMilestones?.length ? (_jsx("ul", { className: "milestone-list", children: ganttMilestones.slice(0, 4).map((milestone) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: milestone.name }), _jsx("span", { children: formatShortDate(milestone.dueDate) })] }), _jsx("span", { className: "pill pill-neutral", children: milestone.status ?? "Previsto" })] }, milestone.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum marco cadastrado." }))] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Riscos e impedimentos" }) }), _jsx("p", { className: "highlight-number", children: projectMeta.risksOpen ?? 0 }), _jsx("p", { className: "subtext", children: "Riscos abertos" }), _jsx("p", { className: "muted", children: "Acompanhe o plano de mitiga\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo e distribua respons\u00EF\u00BF\u00BDveis para cada item cr\u00EF\u00BF\u00BDtico." })] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Horas registradas" }) }), _jsxs("p", { className: "highlight-number", children: [Number(projectMeta.hoursTracked ?? summary?.hoursTracked ?? 0).toFixed(1), "h"] }), _jsx("p", { className: "subtext", children: "Somat\u00EF\u00BF\u00BDrio das \u00EF\u00BF\u00BDltimas entregas" })] })] }), _jsxs("div", { className: "split-grid", children: [_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h3", { children: "Minhas tarefas" }), _jsx("button", { type: "button", className: "ghost-button", children: "Ver todas" })] }), myTasks.length ? (_jsx("ul", { className: "task-list", children: myTasks.map((task) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: task.title }), _jsx("span", { children: task.column })] }), _jsx("span", { className: `pill ${task.status.toLowerCase()}`, children: task.status })] }, task.id))) })) : (_jsx("p", { className: "muted", children: "Nenhuma tarefa atribu\u00EF\u00BF\u00BDda." }))] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Equipe" }) }), membersError && _jsx("p", { className: "error-text", children: membersError }), members.length ? (_jsx("ul", { className: "team-list", children: members.map((member) => (_jsxs("li", { children: [_jsx("div", { className: "avatar", children: member.name?.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.role })] }), _jsxs("span", { children: [member.capacityWeekly ?? 0, "h"] })] }, member.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum membro vinculado." }))] })] })] }));
    const boardContent = (_jsxs("div", { className: "tab-panel", children: [boardError && _jsx("p", { className: "error-text", children: boardError }), _jsx(CustomKanbanBoard, { columns: kanbanColumns, onDragEnd: onDragTask, onCreate: onCreateTask, onTaskClick: onKanbanTaskClick, newTaskTitle: newTaskTitle, onTaskTitleChange: onTaskTitleChange, newTaskColumn: newTaskColumn, onTaskColumnChange: onTaskColumnChange })] }));
    const ganttContent = (_jsxs("div", { className: "tab-panel", children: [ganttError && _jsx("p", { className: "error-text", children: ganttError }), _jsx(GanttTimeline, { tasks: ganttTasks, milestones: ganttMilestones })] }));
    const calendarContent = (_jsx("div", { className: "tab-panel", children: calendarEvents.length ? (_jsx("ul", { className: "calendar-list", children: calendarEvents.map((event) => (_jsxs("li", { children: [_jsxs("div", { className: "calendar-date", children: [_jsx("span", { children: formatShortDate(event.date) }), _jsx("small", { children: event.type })] }), _jsx("strong", { children: event.title })] }, event.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum evento agendado." })) }));
    const docsContent = (_jsxs("div", { className: "tab-panel", children: [attachmentsError && _jsx("p", { className: "error-text", children: attachmentsError }), attachmentsLoading ? (_jsx("div", { className: "docs-grid", children: [0, 1, 2].map((index) => (_jsxs("article", { className: "doc-card skeleton-card", children: [_jsx("div", { className: "skeleton skeleton-title" }), _jsx("div", { className: "skeleton skeleton-text" }), _jsx("div", { className: "skeleton skeleton-text", style: { width: "40%" } })] }, index))) })) : attachments.length ? (_jsx("div", { className: "docs-grid", children: attachments.map((doc) => (_jsxs("article", { className: "doc-card", children: [_jsxs("div", { children: [_jsx("h4", { children: doc.fileName }), _jsx("p", { className: "subtext", children: doc.category ?? "Documento" })] }), _jsxs("small", { children: [doc.uploadedBy?.fullName ?? doc.uploadedBy?.email ?? "Equipe", " \u00C2\u00B7 ", formatShortDate(doc.createdAt)] }), _jsxs("small", { children: [formatFileSize(doc.fileSize), " \u00C2\u00B7 ", doc.targetType === "WBS_NODE" ? "Vinculado ï¿½ WBS" : "Projeto"] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => window.alert("IntegrAï¿½ï¿½o de download em breve."), children: "Baixar" })] }, doc.id))) })) : (_jsx(EmptyStateCard, { icon: FileIcon, title: "Nenhum documento enviado", description: "Centralize atas, contratos e anexos importantes para facilitar o acompanhamento.", actionLabel: "Adicionar documento", onAction: handleAddDocument }))] }));
    const activityContent = (_jsxs("div", { className: "tab-panel activity-panel", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Timeline de atividades" }) }), commentsError && _jsx("p", { className: "error-text", children: commentsError }), activityItems.length ? (_jsx("ul", { className: "activity-timeline", children: activityItems.map((activity) => (_jsxs("li", { children: [_jsx("div", { className: "activity-avatar", children: activity.author?.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: activity.author }), _jsx("span", { children: activity.role }), _jsx("p", { children: activity.body }), _jsx("small", { children: formatShortDate(activity.createdAt) })] })] }, activity.id))) })) : (_jsx(EmptyStateCard, { icon: CommentIcon, title: "Nenhuma atividade registrada", description: "Compartilhe atualiza\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes ou registre horas para construir o hist\u00EF\u00BF\u00BDrico colaborativo do projeto.", actionLabel: "Registrar atualizA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo", onAction: focusCommentComposer }))] }), _jsxs("div", { className: "split-grid", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Novo coment\u00EF\u00BF\u00BDrio" }) }), _jsxs("form", { onSubmit: onSubmitComment, className: "feedback-form", children: [_jsx("p", { className: "muted", children: "Selecione um item na EDT para vincular o coment\u00EF\u00BF\u00BDrio." }), _jsx("textarea", { ref: commentTextareaRef, placeholder: "Anote atualiza\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes ou decis\u00EF\u00BF\u00BDes...", value: commentBody, onChange: (event) => onCommentBodyChange(event.target.value) }), _jsx("button", { type: "submit", className: "primary-button", disabled: !selectedNodeId || !commentBody.trim(), children: "Registrar coment\u00EF\u00BF\u00BDrio" })] })] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Registro r\u00EF\u00BF\u00BDpido de horas" }) }), _jsxs("form", { onSubmit: onLogTime, className: "time-form", children: [_jsx("p", { className: "muted", children: "Selecione uma tarefa na EDT antes de registrar." }), _jsxs("label", { children: ["Data", _jsx("input", { type: "date", value: timeEntryDate, onChange: (event) => onTimeEntryDateChange(event.target.value) })] }), _jsxs("label", { children: ["Horas", _jsx("input", { type: "number", min: "0.25", step: "0.25", value: timeEntryHours, onChange: (event) => onTimeEntryHoursChange(event.target.value) })] }), _jsxs("label", { children: ["descri\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo", _jsx("textarea", { value: timeEntryDescription, onChange: (event) => onTimeEntryDescriptionChange(event.target.value) })] }), timeEntryError && (_jsx("p", { className: "error-text", role: "status", children: timeEntryError })), _jsx("button", { type: "submit", className: "primary-button", disabled: !selectedNodeId, children: "Registrar horas" })] })] })] })] }));
    const boardTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "O board deste projeto est\u00EF\u00BF\u00BD em uma p\u00EF\u00BF\u00BDgina dedicada." }) }));
    const ganttTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "O cronograma deste projeto est\u00EF\u00BF\u00BD em uma p\u00EF\u00BF\u00BDgina dedicada." }) }));
    const docsTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "Os documentos deste projeto est\u00EF\u00BF\u00BDo em uma p\u00EF\u00BF\u00BDgina dedicada." }) }));
    const tabContentMap = {
        overview: overviewContent,
        board: boardTabPlaceholder,
        gantt: ganttTabPlaceholder,
        calendar: calendarContent,
        docs: docsTabPlaceholder,
        activity: activityContent
    };
    return (_jsxs("section", { className: "project-details", children: [overviewHeader, tabContentMap[activeTab]] }));
};
const TeamPanel = ({ members, membersError, projectName }) => {
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState(null);
    const enrichedMembers = useMemo(() => {
        return members.map((member) => {
            const allocation = Math.min(100, Math.round(((member.capacityWeekly ?? 40) / 40) * 100));
            const status = allocation >= 90 ? "Alta carga" : allocation <= 40 ? "DispoNï¿½vel" : "Balanceado";
            const skills = Array.isArray(member.skills) && member.skills.length
                ? member.skills
                : [member.role, `Carga ${allocation}%`];
            return {
                ...member,
                allocation,
                status,
                skills,
                avatar: member.name?.slice(0, 2).toUpperCase() ?? "EQ",
                workload: allocation
            };
        });
    }, [members]);
    const filteredMembers = useMemo(() => {
        return enrichedMembers.filter((member) => {
            const matchesRole = roleFilter === "all" || member.role === roleFilter;
            const matchesStatus = statusFilter === "all" || member.status === statusFilter;
            const matchesSearch = !search ||
                member.name?.toLowerCase().includes(search.toLowerCase()) ||
                member.email?.toLowerCase().includes(search.toLowerCase());
            return matchesRole && matchesStatus && matchesSearch;
        });
    }, [enrichedMembers, roleFilter, statusFilter, search]);
    const roleOptions = useMemo(() => Array.from(new Set(members.map((member) => member.role))).filter(Boolean), [members]);
    if (!members.length && !membersError) {
        return null;
    }
    return (_jsxs("section", { className: "team-section", children: [_jsxs("div", { className: "team-section__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Equipe" }), _jsx("h2", { children: "Vis\u00EF\u00BF\u00BDo da Equipe do projeto" }), _jsx("p", { className: "subtext", children: "Filtre por papel, status ou busque pessoas para abrir o painel detalhado." })] }), _jsxs("div", { className: "team-summary", children: [_jsx("strong", { children: members.length }), _jsxs("span", { children: ["Colaboradores no projeto ", projectName ?? "atual"] })] })] }), _jsxs("div", { className: "team-filters", children: [_jsxs("label", { children: ["Papel", _jsxs("select", { value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), roleOptions.map((role) => (_jsx("option", { value: role, children: role }, role)))] })] }), _jsxs("label", { children: ["Status", _jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "DispoN\u00EF\u00BF\u00BDvel", children: "DispoN\u00EF\u00BF\u00BDvel" }), _jsx("option", { value: "Alocado", children: "Alocado" }), _jsx("option", { value: "Em f\u00EF\u00BF\u00BDrias / folga", children: "Em f\u00EF\u00BF\u00BDrias / folga" })] })] }), _jsxs("label", { className: "search-field", children: ["Busca", _jsx("input", { type: "search", placeholder: "Nome ou e-mail...", value: search, onChange: (event) => setSearch(event.target.value) })] })] }), membersError && _jsx("p", { className: "error-text", children: membersError }), filteredMembers.length ? (_jsx("div", { className: "team-grid", children: filteredMembers.map((member) => (_jsxs("article", { className: "team-card", onClick: () => setSelectedMember(member), children: [_jsxs("div", { className: "team-card__header", children: [_jsx("div", { className: "avatar", children: member.avatar }), _jsxs("div", { children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.role })] }), _jsx("span", { className: "pill pill-neutral", children: member.status })] }), _jsxs("div", { className: "team-card__body", children: [_jsx("p", { children: member.email }), _jsx("div", { className: "progress-bar team-card__allocation", children: _jsx("span", { style: { width: `${member.allocation}%` } }) }), _jsxs("small", { children: ["AlocA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo: ", member.allocation, "%"] }), _jsx("div", { className: "team-card__skills", children: member.skills.map((skill) => (_jsx("span", { children: skill }, `${member.id}-${skill}`))) })] }), _jsx("button", { type: "button", className: "ghost-button", children: "Ver detalhes" })] }, member.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum membro corresponde aos filtros selecionados." })), selectedMember && (_jsx("div", { className: "team-drawer", onClick: () => setSelectedMember(null), children: _jsxs("div", { className: "team-drawer__content", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("div", { className: "avatar is-large", children: selectedMember.avatar }), _jsxs("div", { children: [_jsx("h3", { children: selectedMember.name }), _jsx("p", { children: selectedMember.email }), _jsx("span", { className: "pill pill-neutral", children: selectedMember.status })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => setSelectedMember(null), children: "Fechar" })] }), _jsxs("div", { className: "team-drawer__details", children: [_jsxs("div", { children: [_jsx("strong", { children: "Papel" }), _jsx("p", { children: selectedMember.role })] }), _jsxs("div", { children: [_jsx("strong", { children: "Capacidade semanal" }), _jsxs("p", { children: [selectedMember.capacityWeekly ?? 0, "h"] })] }), _jsxs("div", { children: [_jsx("strong", { children: "AlocA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo" }), _jsxs("p", { children: [selectedMember.allocation, "%"] })] })] }), _jsxs("div", { children: [_jsx("strong", { children: "Skills" }), _jsx("div", { className: "team-card__skills", children: selectedMember.skills.map((skill) => (_jsx("span", { children: skill }, `${selectedMember.id}-${skill}`))) })] })] }) }))] }));
};
export const ReportsPanel = ({ metrics, metricsError, metricsLoading }) => {
    const [activeTab, setActiveTab] = useState("status");
    const statusData = useMemo(() => {
        if (!metrics?.byStatus)
            return [];
        return Object.entries(metrics.byStatus).map(([status, value]) => ({
            status,
            value: Number(value)
        }));
    }, [metrics]);
    const riskData = metrics?.riskSummary ?? { open: 0, closed: 0 };
    const hoursByProject = (metrics?.hoursByProject ?? []).slice(0, 5);
    const progressSeries = metrics?.progressSeries ?? [];
    if (!metrics && !metricsError && !metricsLoading)
        return null;
    return (_jsxs("section", { className: "reports-section", children: [_jsxs("header", { className: "reports-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Relat\u00EF\u00BF\u00BDrios" }), _jsx("h2", { children: "Vis\u00EF\u00BF\u00BDo anal\u00EF\u00BF\u00BDtica" }), _jsx("p", { className: "subtext", children: "Escolha o foco para comparar resultados do portf\u00EF\u00BF\u00BDlio." })] }), _jsx("div", { className: "reports-tabs", children: [
                            { id: "status", label: "Status" },
                            { id: "risks", label: "Riscos" },
                            { id: "hours", label: "Horas" },
                            { id: "progress", label: "Progresso" }
                        ].map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.id ? "is-active" : "", onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) })] }), metricsError && _jsx("p", { className: "error-text", children: metricsError }), metricsLoading ? (_jsx("p", { className: "muted", children: "Carregando Relat\u00EF\u00BF\u00BDrios..." })) : (_jsxs("div", { className: "reports-grid", children: [activeTab === "status" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Status dos projetos" }), statusData.length ? (_jsx("ul", { className: "reports-list", children: statusData.map((item) => (_jsxs("li", { children: [_jsx("span", { children: item.status }), _jsx("strong", { children: item.value })] }, item.status))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Sem status consolidados", description: "Assim que os projetos forem sincronizados, mostraremos o panorama por status aqui." }))] })), activeTab === "risks" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Riscos" }), riskData.open || riskData.closed ? (_jsxs("div", { className: "reports-risk", children: [_jsxs("div", { children: [_jsx("span", { children: "Abertos" }), _jsx("strong", { children: riskData.open })] }), _jsxs("div", { children: [_jsx("span", { children: "Fechados" }), _jsx("strong", { children: riskData.closed })] })] })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Nenhum risco registrado", description: "Cadastre riscos nos projetos para acompanhar o volume por status." }))] })), activeTab === "hours" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Horas por projeto" }), hoursByProject.length ? (_jsx("ul", { className: "reports-list", children: hoursByProject.map((project) => (_jsxs("li", { children: [_jsx("span", { children: project.projectName }), _jsxs("strong", { children: [project.hours?.toFixed ? project.hours.toFixed(1) : project.hours, "h"] })] }, project.projectId))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Sem apontamentos de horas", description: "Registre horas nos projetos para comparar o esfor\u00EF\u00BF\u00BDo entre Equipes." }))] })), activeTab === "progress" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Progresso m\u00EF\u00BF\u00BDdio" }), progressSeries.length ? (_jsx("div", { className: "reports-sparkline", children: progressSeries.map((point) => (_jsx("span", { style: { height: `${Math.max(5, point.progress)}%` }, title: `${point.date} - ${point.progress}%` }, point.date))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Progresso indispoN\u00EF\u00BF\u00BDvel", description: "Atualize o status das tarefas para gerar a linha de tend\u00EF\u00BF\u00BDncia do portf\u00EF\u00BF\u00BDlio." }))] }))] }))] }));
};
const SettingsPanel = () => {
    const [activeSection, setActiveSection] = useState("profile");
    const sections = [
        { id: "profile", label: "Perfil" },
        { id: "notifications", label: "NotificAï¿½ï¿½es" },
        { id: "organization", label: "OrganizAï¿½ï¿½o" },
        { id: "permissions", label: "Permissï¿½es" },
        { id: "integrations", label: "IntegrAï¿½ï¿½es" },
        { id: "billing", label: "Faturamento" }
    ];
    return (_jsxs("section", { className: "settings-section", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "ConfigurA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes" }), _jsx("h2", { children: "Central de ajustes" }), _jsx("p", { className: "subtext", children: "Gerencie perfil, notificA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes, organizA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo e integrA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes." })] }) }), _jsxs("div", { className: "settings-layout", children: [_jsx("nav", { className: "settings-menu", children: sections.map((section) => (_jsx("button", { type: "button", className: activeSection === section.id ? "is-active" : "", onClick: () => setActiveSection(section.id), children: section.label }, section.id))) }), _jsxs("div", { className: "settings-content", children: [activeSection === "profile" && (_jsxs("form", { className: "settings-form", children: [_jsx("h3", { children: "Perfil" }), _jsxs("label", { children: ["Nome completo", _jsx("input", { type: "text", placeholder: "Seu nome" })] }), _jsxs("label", { children: ["E-mail", _jsx("input", { type: "email", placeholder: "voce@empresa.com" })] }), _jsxs("label", { children: ["Idioma", _jsxs("select", { children: [_jsx("option", { children: "Portugu\u00EF\u00BF\u00BDs (Brasil)" }), _jsx("option", { children: "Ingl\u00EF\u00BF\u00BDs" })] })] }), _jsx("button", { type: "button", className: "primary-button", children: "Atualizar perfil" })] })), activeSection === "notifications" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "NotificA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes" }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", defaultChecked: true }), _jsx("span", { children: "E-mails sobre tarefas atribu\u00EF\u00BF\u00BDdas" })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox" }), _jsx("span", { children: "Mensagens em canais do Slack" })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", defaultChecked: true }), _jsx("span", { children: "Alertas de riscos" })] })] })), activeSection === "organization" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "OrganizA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo" }), _jsxs("label", { children: ["Nome da organizA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo", _jsx("input", { type: "text", placeholder: "OrganizA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo Demo" })] }), _jsxs("label", { children: ["Dom\u00EF\u00BF\u00BDnio", _jsx("input", { type: "text", placeholder: "demo.local" })] }), _jsx("button", { type: "button", className: "secondary-button", children: "Salvar" })] })), activeSection === "permissions" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Permiss\u00EF\u00BF\u00BDes e pap\u00EF\u00BF\u00BDis" }), _jsx("p", { className: "muted", children: "Gerencie quem pode criar projetos, alterar WBS e exportar dados." }), _jsxs("table", { className: "settings-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Papel" }), _jsx("th", { children: "Criar projeto" }), _jsx("th", { children: "Editar WBS" }), _jsx("th", { children: "Ver Relat\u00EF\u00BF\u00BDrios" })] }) }), _jsx("tbody", { children: ["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((role) => (_jsxs("tr", { children: [_jsx("td", { children: role }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role !== "VIEWER" }) }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role === "OWNER" || role === "ADMIN" }) }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role !== "VIEWER" }) })] }, role))) })] })] })), activeSection === "integrations" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "IntegrA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDes" }), _jsx("div", { className: "integrations-grid", children: ["GitHub", "Google Drive", "Slack", "Google Calendar"].map((integration) => (_jsxs("article", { children: [_jsx("strong", { children: integration }), _jsx("p", { className: "muted", children: "Sincronize dados e automatize o fluxo." }), _jsx("button", { type: "button", className: "secondary-button", children: "Conectar" })] }, integration))) })] })), activeSection === "billing" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Faturamento / Plano" }), _jsxs("p", { className: "muted", children: ["Plano atual: ", _jsx("strong", { children: "Pro \u00E2\u20AC\u201C 20/50 projetos" })] }), _jsx("button", { type: "button", className: "secondary-button", children: "Gerenciar plano" })] }))] })] })] }));
};
export const DashboardLayout = ({ userEmail, organizations, selectedOrganizationId, onOrganizationChange, currentOrgRole, orgError, onSignOut, projects, selectedProjectId, onProjectChange, onSelectProject, projectsError, filters, onRangeChange, summary, summaryError, members, membersError, attachments, attachmentsError, attachmentsLoading, reportMetrics, reportMetricsError, reportMetricsLoading, boardColumns, kanbanColumns, boardError, onCreateTask, onReloadBoard, onDragTask, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange, newTaskStartDate, onTaskStartDateChange, newTaskEndDate, onTaskEndDateChange, newTaskAssignee, onTaskAssigneeChange, newTaskEstimateHours, onTaskEstimateHoursChange, wbsNodes, wbsError, onMoveNode, onUpdateWbsNode, onCreateWbsItem, selectedNodeId, onSelectNode, comments, commentsError, onSubmitComment, commentBody, onCommentBodyChange, timeEntryDate, timeEntryHours, timeEntryDescription, timeEntryError, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, ganttTasks, ganttMilestones, ganttError, portfolio, portfolioError, portfolioLoading, onExportPortfolio, onCreateProject, onUpdateProject, }) => {
    const flattenedTasks = kanbanColumns.flatMap((column) => column.tasks.map((task) => ({ ...task, column: column.title })));
    const myTasks = flattenedTasks.slice(0, 6);
    const projectMeta = portfolio.find((project) => project.projectId === selectedProjectId) ?? null;
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [projectForm, setProjectForm] = useState(createEmptyProjectForm());
    const [projectModalError, setProjectModalError] = useState(null);
    const [projectModalLoading, setProjectModalLoading] = useState(false);
    const [projectToast, setProjectToast] = useState(null);
    const [projectModalMode, setProjectModalMode] = useState("create");
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalLoading, setTaskModalLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined")
            return false;
        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    });
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? "true" : "false");
    }, [isSidebarCollapsed]);
    useEffect(() => {
        if (!newTaskColumn && boardColumns.length) {
            onTaskColumnChange(boardColumns[0].id);
        }
    }, [boardColumns, newTaskColumn, onTaskColumnChange]);
    useEffect(() => {
        if (!projectToast)
            return;
        const timeout = setTimeout(() => setProjectToast(null), 4000);
        return () => clearTimeout(timeout);
    }, [projectToast]);
    const currentView = (() => {
        const segment = location.pathname.split("/")[1] || "dashboard";
        return segment || "dashboard";
    })();
    const handleProjectFieldChange = (field, value) => setProjectForm((prev) => ({ ...prev, [field]: value }));
    const resetProjectForm = () => {
        setProjectForm(createEmptyProjectForm());
        setEditingProjectId(null);
        setProjectModalMode("create");
    };
    const handleToggleSidebar = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };
    const handleOpenProjectModal = () => {
        setProjectModalError(null);
        resetProjectForm();
        setProjectModalOpen(true);
    };
    const handleOpenEditProjectModal = () => {
        if (!projectMeta)
            return;
        setProjectModalError(null);
        setProjectModalMode("edit");
        setEditingProjectId(projectMeta.projectId);
        setProjectForm({
            name: projectMeta.projectName ?? "",
            clientName: projectMeta.clientName ?? "",
            budget: "",
            repositoryUrl: "",
            startDate: projectMeta.startDate ? projectMeta.startDate.slice(0, 10) : "",
            endDate: projectMeta.endDate ? projectMeta.endDate.slice(0, 10) : "",
            description: "",
            teamMembers: ""
        });
        setProjectModalOpen(true);
    };
    const handleCloseProjectModal = () => {
        setProjectModalOpen(false);
        setProjectModalMode("create");
        setEditingProjectId(null);
    };
    const handleOpenTaskModal = async () => {
        if (!boardColumns.length && onReloadBoard) {
            await onReloadBoard();
        }
        if (!newTaskColumn && boardColumns.length) {
            onTaskColumnChange(boardColumns[0].id);
        }
        setTaskModalOpen(true);
    };
    const handleCloseTaskModal = () => {
        setTaskModalOpen(false);
        setTaskModalLoading(false);
    };
    const handleProjectModalSubmit = async (event) => {
        event.preventDefault();
        setProjectModalError(null);
        if (!projectForm.name.trim()) {
            setProjectModalError("O nome do projeto ï¿½ obrigatï¿½rio.");
            return;
        }
        if (!projectForm.clientName.trim()) {
            setProjectModalError("Informe o cliente Responsï¿½vel.");
            return;
        }
        const payload = {
            name: projectForm.name.trim(),
            clientName: projectForm.clientName.trim(),
            budget: Number(projectForm.budget) || 0,
            repositoryUrl: projectForm.repositoryUrl.trim() || undefined,
            startDate: projectForm.startDate || undefined,
            endDate: projectForm.endDate || undefined,
            description: projectForm.description.trim() || undefined,
            teamMembers: projectForm.teamMembers
                .split(",")
                .map((member) => member.trim())
                .filter(Boolean)
        };
        setProjectModalLoading(true);
        try {
            if (projectModalMode === "edit" && editingProjectId) {
                await onUpdateProject(editingProjectId, payload);
                setProjectToast("Projeto atualizado com sucesso.");
            }
            else {
                await onCreateProject(payload);
                setProjectToast("Projeto criado com sucesso.");
            }
            resetProjectForm();
            setProjectModalOpen(false);
        }
        catch (error) {
            setProjectModalError(error instanceof Error ? error.message : "Erro ao salvar projeto");
        }
        finally {
            setProjectModalLoading(false);
        }
    };
    const handleTaskModalSubmit = async (event) => {
        event.preventDefault();
        setTaskModalLoading(true);
        const success = await onCreateTask(event);
        setTaskModalLoading(false);
        if (success) {
            setTaskModalOpen(false);
        }
    };
    const handleViewProjectDetails = useCallback((projectId) => {
        if (projectId && projectId !== selectedProjectId) {
            onProjectChange(projectId);
        }
        navigate(`/projects/${projectId}`);
    }, [onProjectChange, selectedProjectId, navigate]);
    const renderTeamContent = () => (_jsx(TeamPanel, { members: members, membersError: membersError, projectName: projectMeta?.projectName ?? null }));
    const renderReportsContent = () => (_jsx(ReportsPanel, { metrics: reportMetrics, metricsError: reportMetricsError, metricsLoading: reportMetricsLoading }));
    const outletContext = {
        organizations,
        selectedOrganizationId,
        onOrganizationChange,
        currentOrgRole,
        projects,
        selectedProjectId,
        onProjectChange,
        onSelectProject,
        selectedProject: projectMeta,
        projectMeta,
        onSignOut,
        handleOpenProjectModal,
        handleOpenEditProjectModal,
        handleOpenTaskModal,
        onCreateProject,
        onUpdateProject,
        portfolio,
        portfolioError,
        portfolioLoading,
        onExportPortfolio,
        handleViewProjectDetails,
        kanbanColumns,
        summary,
        summaryError,
        filters,
        onRangeChange,
        myTasks,
        members,
        membersError,
        attachments,
        attachmentsError,
        attachmentsLoading,
        reportMetrics,
        reportMetricsError,
        reportMetricsLoading,
        reportsData: reportMetrics,
        reportsError: reportMetricsError,
        reportsLoading: reportMetricsLoading,
        projectTimelineData: { tasks: ganttTasks, milestones: ganttMilestones },
        projectTimelineLoading: false,
        projectTimelineError: ganttError,
        onUpdateProjectTimelineItem: undefined,
        onChangeProjectTimelineDate: undefined,
        projectActivities: comments ?? [],
        projectActivitiesLoading: false,
        projectActivitiesError: commentsError,
        projectDocuments: attachments,
        projectDocumentsLoading: attachmentsLoading,
        projectDocumentsError: attachmentsError,
        onUploadProjectDocument: undefined,
        onDeleteProjectDocument: undefined,
        onDownloadProjectDocument: undefined,
        boardColumns,
        boardError,
        onCreateTask,
        projectBoardColumns: kanbanColumns,
        projectBoardError: boardError,
        onMoveProjectTask: onDragTask,
        onCreateProjectTask: onCreateTask,
        onReloadProjectBoard: onReloadBoard,
        newProjectTaskTitle: newTaskTitle,
        onProjectTaskTitleChange: onTaskTitleChange,
        newProjectTaskColumn: newTaskColumn,
        onProjectTaskColumnChange: onTaskColumnChange,
        projectToast,
        orgError,
        projectsError,
        projectLoading: portfolioLoading,
        projectError: null,
        newTaskTitle,
        onTaskTitleChange,
        newTaskColumn,
        onTaskColumnChange,
        newTaskStartDate,
        onTaskStartDateChange,
        newTaskEndDate,
        onTaskEndDateChange,
        newTaskAssignee,
        onTaskAssigneeChange,
        newTaskEstimateHours,
        onTaskEstimateHoursChange,
        wbsNodes,
        wbsError,
        wbsLoading: undefined,
        onCreateWbsItem,
        onDeleteWbsItem: undefined,
        onRestoreWbsItem: undefined,
        onUpdateDependency: undefined,
        dependencyOptions: [],
        projectWbsNodes: wbsNodes,
        projectWbsError: wbsError,
        projectWbsLoading: undefined,
        onCreateProjectWbsItem: undefined,
        onUpdateProjectWbsItem: onUpdateWbsNode,
        onDeleteProjectWbsItem: undefined,
        onRestoreProjectWbsItem: undefined,
        projectDependencyOptions: [],
        onUpdateProjectDependency: undefined,
        onMoveNode,
        onUpdateWbsNode,
        selectedNodeId,
        onSelectNode,
        comments,
        commentsError,
        onSubmitComment,
        commentBody,
        onCommentBodyChange,
        timeEntryDate,
        timeEntryHours,
        timeEntryDescription,
        timeEntryError,
        onTimeEntryDateChange,
        onTimeEntryHoursChange,
        onTimeEntryDescriptionChange,
        onLogTime,
        ganttTasks,
        ganttMilestones,
        ganttError,
        onReloadBoard,
        onDragTask
    };
    const appShellClassName = `app-shell ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`.trim();
    return (_jsxs("div", { className: appShellClassName, children: [_jsxs("aside", { className: "dashboard-sidebar sidebar", children: [_jsxs("div", { className: "sidebar-header", children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("span", { children: "G&P" }), _jsx("small", { children: "Gest\u00EF\u00BF\u00BDo de Projetos" })] }), _jsx("button", { type: "button", className: "sidebar-toggle", onClick: handleToggleSidebar, "aria-label": isSidebarCollapsed ? "Expandir menu" : "Recolher menu", title: isSidebarCollapsed ? "Expandir menu" : "Recolher menu", children: _jsx("span", { className: "sidebar-toggle__chevron", "aria-hidden": "true" }) })] }), _jsxs("nav", { className: "sidebar-nav", children: [_jsx("div", { className: "sidebar-title", children: "Trabalho diario" }), sidebarNavigation.map((item) => {
                                const Icon = item.icon;
                                const link = (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `sidebar-item ${isActive ? "sidebar-item--active" : ""}`, title: isSidebarCollapsed ? item.label : undefined, "aria-label": isSidebarCollapsed ? item.label : undefined, children: [_jsx("span", { className: "sidebar-item-icon", "aria-hidden": "true", children: _jsx(Icon, { width: 18, height: 18 }) }), _jsx("span", { children: item.label })] }, item.id));
                                return (_jsxs(Fragment, { children: [link, item.id === "atividades" ? _jsx("div", { className: "sidebar-divider" }) : null] }, item.id));
                            })] }), _jsx("div", { className: "sidebar-plan", children: _jsxs("p", { children: ["Plano Pro \u00C2\u00B7 ", _jsx("strong", { children: "20/50" }), " projetos"] }) })] }), _jsxs("div", { className: "dashboard-main", children: [_jsx("header", { className: "dashboard-topbar", children: _jsxs("div", { className: "gp-container gp-container--compact dashboard-topbar__inner", children: [_jsx("input", { type: "search", placeholder: "Buscar projetos, tarefas, pessoas..." }), _jsxs("div", { className: "header-project-selector", children: [_jsx("span", { className: "label", children: "Projeto atual" }), _jsxs("select", { value: selectedProjectId || "", onChange: (event) => {
                                                const newId = event.target.value;
                                                if (newId) {
                                                    onSelectProject(newId);
                                                }
                                            }, disabled: !projects?.length, children: [!selectedProjectId && _jsx("option", { value: "", children: "Selecione um projeto" }), (projects || []).map((project) => (_jsx("option", { value: project.id, children: project.name }, project.id)))] }), !projects?.length && _jsx("small", { className: "muted", children: "Nenhum projeto cadastrado" })] }), _jsxs("div", { className: "topbar-actions app-header-actions", children: [_jsx("button", { type: "button", children: "?" }), _jsx("button", { type: "button", className: "logout-button", onClick: () => {
                                                signOut();
                                                navigate("/", { replace: true });
                                            }, children: "Sair" }), _jsx("div", { className: "avatar", children: userEmail?.slice(0, 2).toUpperCase() })] })] }) }), _jsx("main", { className: "dashboard-main", children: _jsx(Outlet, { context: outletContext }) }), isProjectModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: projectModalMode === "edit" ? "Editar projeto" : "Novo projeto" }), _jsx("h3", { children: projectModalMode === "edit" ? "Atualize as informAï¿½ï¿½es principais" : "Planeje um novo trabalho" }), _jsx("p", { className: "subtext", children: projectModalMode === "edit"
                                                        ? "Ajuste cliente, datas ou links principais do projeto selecionado."
                                                        : "Informe dados bï¿½sicos para criarmos o projeto no portfï¿½lio." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseProjectModal, children: "Fechar" })] }), _jsxs("form", { className: "modal-form", onSubmit: handleProjectModalSubmit, children: [_jsxs("label", { children: ["Nome do projeto", _jsx("input", { type: "text", value: projectForm.name, onChange: (event) => handleProjectFieldChange("name", event.target.value), placeholder: "ImplementA\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo ERP 2025", required: true })] }), _jsxs("label", { children: ["Cliente / unidade", _jsx("input", { type: "text", value: projectForm.clientName, onChange: (event) => handleProjectFieldChange("clientName", event.target.value), placeholder: "Corp Holding", required: true })] }), _jsxs("label", { children: ["Or\u00EF\u00BF\u00BDamento aprovado (R$)", _jsx("input", { type: "number", min: "0", step: "1000", value: projectForm.budget, onChange: (event) => handleProjectFieldChange("budget", event.target.value), placeholder: "250000" })] }), _jsxs("label", { children: ["Reposit\u00EF\u00BF\u00BDrio GitHub", _jsx("input", { type: "url", value: projectForm.repositoryUrl, onChange: (event) => handleProjectFieldChange("repositoryUrl", event.target.value), placeholder: "https://github.com/org/projeto" })] }), _jsxs("div", { className: "modal-grid", children: [_jsxs("label", { children: ["In\u00EF\u00BF\u00BDcio planejado", _jsx("input", { type: "date", value: projectForm.startDate, onChange: (event) => handleProjectFieldChange("startDate", event.target.value) })] }), _jsxs("label", { children: ["Conclus\u00EF\u00BF\u00BDo prevista", _jsx("input", { type: "date", value: projectForm.endDate, onChange: (event) => handleProjectFieldChange("endDate", event.target.value) })] })] }), _jsxs("label", { children: ["Equipe (e-mails separados por v\u00EF\u00BF\u00BDrgula)", _jsx("textarea", { value: projectForm.teamMembers, onChange: (event) => handleProjectFieldChange("teamMembers", event.target.value), placeholder: "ana@empresa.com, joao@empresa.com" })] }), _jsxs("label", { children: ["descri\u00EF\u00BF\u00BD\u00EF\u00BF\u00BDo", _jsx("textarea", { value: projectForm.description, onChange: (event) => handleProjectFieldChange("description", event.target.value), placeholder: "Objetivos, entregas e premissas iniciais..." })] }), projectModalError && _jsx("p", { className: "error-text", children: projectModalError }), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseProjectModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: projectModalLoading, children: projectModalLoading
                                                        ? "Enviando..."
                                                        : projectModalMode === "edit"
                                                            ? "Salvar alterAï¿½ï¿½es"
                                                            : "Criar projeto" })] })] })] }) })), isTaskModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Nova tarefa" }), _jsx("h3", { children: "Adicionar item ao quadro" }), _jsx("p", { className: "subtext", children: "Informe o t\u00EF\u00BF\u00BDtulo e escolha a coluna inicial." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Fechar" })] }), boardColumns.length ? (_jsxs("form", { className: "modal-form", onSubmit: handleTaskModalSubmit, children: [_jsxs("label", { children: ["t\u00EF\u00BF\u00BDtulo da tarefa", _jsx("input", { type: "text", value: newTaskTitle, onChange: (event) => onTaskTitleChange(event.target.value), placeholder: "Configurar ambiente, revisar contrato...", required: true })] }), _jsxs("label", { children: ["Coluna inicial", _jsx("select", { value: newTaskColumn, onChange: (event) => onTaskColumnChange(event.target.value), children: boardColumns.map((column) => (_jsx("option", { value: column.id, children: column.label }, column.id))) })] }), _jsxs("div", { className: "modal-grid", children: [_jsxs("label", { children: ["In\u00EF\u00BF\u00BDcio planejado", _jsx("input", { type: "date", value: newTaskStartDate, onChange: (event) => onTaskStartDateChange(event.target.value) })] }), _jsxs("label", { children: ["Fim planejado", _jsx("input", { type: "date", value: newTaskEndDate, onChange: (event) => onTaskEndDateChange(event.target.value) })] })] }), _jsxs("label", { children: ["Respons\u00EF\u00BF\u00BDvel", _jsxs("select", { value: newTaskAssignee, onChange: (event) => onTaskAssigneeChange(event.target.value), children: [_jsx("option", { value: "", children: "Selecione..." }), members.map((member) => (_jsx("option", { value: member.userId ?? member.id, children: member.name ?? member.fullName ?? member.email }, member.id)))] })] }), _jsxs("label", { children: ["Horas estimadas", _jsx("input", { type: "number", min: "0", step: "0.5", value: newTaskEstimateHours, onChange: (event) => onTaskEstimateHoursChange(event.target.value), placeholder: "Ex.: 4" })] }), boardError && (_jsx("p", { className: "error-text", role: "status", children: boardError })), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: taskModalLoading || !newTaskTitle.trim(), children: taskModalLoading ? "Salvando..." : "Criar tarefa" })] })] })) : (_jsxs("div", { className: "modal-form", children: [_jsx("p", { className: "muted", children: "Este projeto ainda N\u00EF\u00BF\u00BDo possui colunas configuradas. Configure o quadro para criar tarefas." }), _jsx("footer", { className: "modal-actions", children: _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Fechar" }) })] }))] }) }))] })] }));
};
export const TemplatesPanel = ({ templates, isLoading, error, onSaveTemplate }) => {
    const defaultColumns = ["Backlog", "Planejamento", "Execucao", "Concluido"];
    const sampleTemplates = [
        {
            id: "temp-pmo",
            name: "Projeto PMO",
            type: "PMO / Governanca",
            clientName: "Corp PMO",
            repositoryUrl: "https://github.com/gp/templates-pmo",
            defaultBudget: 250000,
            phases: 5,
            tasks: 42,
            tags: ["PMO", "Governanca", "Compliance"],
            updatedAt: "2025-02-10",
            columns: ["Backlog", "Planejamento", "Execucao", "Aprovacao", "Concluido"],
            wbs: [
                {
                    id: "temp-pmo-1",
                    title: "Iniciacao",
                    children: [
                        { id: "temp-pmo-1-1", title: "Business case" },
                        { id: "temp-pmo-1-2", title: "Stakeholders" }
                    ]
                },
                {
                    id: "temp-pmo-2",
                    title: "Planejamento",
                    children: [
                        { id: "temp-pmo-2-1", title: "Plano do projeto" },
                        { id: "temp-pmo-2-2", title: "Estrategia de riscos" }
                    ]
                }
            ],
            customFields: [
                { id: "field-owner", label: "Patrocinador", type: "text", required: true },
                { id: "field-budget", label: "Orcamento aprovado", type: "number" }
            ]
        },
        {
            id: "temp-ti",
            name: "Implantacao de TI",
            type: "Tecnologia",
            clientName: "Squad Infra",
            repositoryUrl: "https://github.com/gp/templates-ti",
            defaultBudget: 180000,
            phases: 4,
            tasks: 30,
            tags: ["Infra", "Seguranca", "Deploy"],
            updatedAt: "2025-02-08",
            columns: ["Backlog", "Planejamento", "Em andamento", "QA", "Done"],
            wbs: [
                {
                    id: "temp-ti-1",
                    title: "Discovery",
                    children: [
                        { id: "temp-ti-1-1", title: "Mapear sistemas" },
                        { id: "temp-ti-1-2", title: "Inventario de acessos" }
                    ]
                },
                {
                    id: "temp-ti-2",
                    title: "Deploy",
                    children: [
                        { id: "temp-ti-2-1", title: "Ambiente de staging" },
                        { id: "temp-ti-2-2", title: "Go live" }
                    ]
                }
            ],
            customFields: [
                { id: "field-env", label: "Ambiente alvo", type: "select" },
                { id: "field-risk", label: "Nivel de risco", type: "select" }
            ]
        },
        {
            id: "temp-mkt",
            name: "Campanha de Marketing",
            type: "Marketing",
            clientName: "Equipe Growth",
            repositoryUrl: "https://github.com/gp/templates-mkt",
            defaultBudget: 120000,
            phases: 3,
            tasks: 24,
            tags: ["Growth", "Social", "Paid Media"],
            updatedAt: "2025-02-05",
            columns: ["Ideias", "Criacao", "Producao", "Publicacao", "Mensuracao"],
            wbs: [
                {
                    id: "temp-mkt-1",
                    title: "Briefing",
                    children: [
                        { id: "temp-mkt-1-1", title: "Mapear publico" },
                        { id: "temp-mkt-1-2", title: "Definir verba" }
                    ]
                },
                {
                    id: "temp-mkt-2",
                    title: "Execucao",
                    children: [
                        { id: "temp-mkt-2-1", title: "Pecas criativas" },
                        { id: "temp-mkt-2-2", title: "Veiculacao" }
                    ]
                }
            ],
            customFields: [
                { id: "field-channel", label: "Canal principal", type: "text" },
                { id: "field-kpi", label: "KPI alvo", type: "text", required: true }
            ]
        }
    ];
    const countWbsNodes = (nodes = []) => nodes.reduce((acc, node) => acc + 1 + countWbsNodes(node.children ?? []), 0);
    const mapTemplateNodes = (nodes, parentPath = "tpl") => (nodes ?? []).map((node, index) => {
        const path = `${parentPath}-${index}`;
        return {
            id: node.id ?? path,
            title: node.title ?? "Entrega",
            children: mapTemplateNodes(node.children, path)
        };
    });
    const normalizeFieldType = (value) => {
        if (value === "number" || value === "select" || value === "date") {
            return value;
        }
        return "text";
    };
    const normalizeTemplate = (template) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        clientName: template.clientName ?? undefined,
        repositoryUrl: template.repositoryUrl ?? undefined,
        defaultBudget: template.budget ?? undefined,
        phases: template.wbs?.length ?? 0,
        tasks: countWbsNodes(template.wbs ?? []),
        tags: (template.customFields ?? []).map((field) => field.label).filter(Boolean),
        updatedAt: template.updatedAt ?? new Date().toISOString(),
        columns: template.columns ?? defaultColumns,
        wbs: mapTemplateNodes(template.wbs),
        customFields: (template.customFields ?? []).map((field) => ({
            id: field.id ?? `field-${Date.now()}-${Math.round(Math.random() * 1000)}`,
            label: field.label ?? "Campo",
            type: normalizeFieldType(field.type),
            required: Boolean(field.required)
        }))
    });
    const templatesToUse = useMemo(() => {
        if (templates.length) {
            return templates.map(normalizeTemplate);
        }
        return sampleTemplates;
    }, [templates]);
    const initialTemplate = templatesToUse[0];
    useEffect(() => {
        if (!templates.length)
            return;
        setSelectedTemplateId((current) => {
            if (templates.some((template) => template.id === current)) {
                return current;
            }
            return templates[0].id;
        });
    }, [templates]);
    const cloneNodes = (nodes) => nodes.map((node) => ({
        ...node,
        children: node.children ? cloneNodes(node.children) : []
    }));
    const [selectedTemplateId, setSelectedTemplateId] = useState(() => templatesToUse[0]?.id ?? "");
    const selectedTemplate = templatesToUse.find((template) => template.id === selectedTemplateId) ?? null;
    const [wbsDraft, setWbsDraft] = useState(initialTemplate ? cloneNodes(initialTemplate.wbs) : []);
    const [boardColumnsDraft, setBoardColumnsDraft] = useState(initialTemplate ? [...initialTemplate.columns] : defaultColumns);
    const [customFieldsDraft, setCustomFieldsDraft] = useState(initialTemplate ? initialTemplate.customFields.map((field) => ({ ...field })) : []);
    const [templateMeta, setTemplateMeta] = useState({
        name: initialTemplate?.name ?? "Novo template",
        type: initialTemplate?.type ?? "Custom",
        clientName: initialTemplate?.clientName ?? "",
        repositoryUrl: initialTemplate?.repositoryUrl ?? "",
        budget: initialTemplate?.defaultBudget?.toString() ?? ""
    });
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateModalError, setTemplateModalError] = useState(null);
    const [templateModalLoading, setTemplateModalLoading] = useState(false);
    const [templateToast, setTemplateToast] = useState(null);
    const [isDraftTemplate, setIsDraftTemplate] = useState(false);
    useEffect(() => {
        if (!selectedTemplate || isDraftTemplate)
            return;
        setWbsDraft(cloneNodes(selectedTemplate.wbs));
        setBoardColumnsDraft([...selectedTemplate.columns]);
        setCustomFieldsDraft(selectedTemplate.customFields.map((field) => ({ ...field })));
        setTemplateMeta({
            name: selectedTemplate.name,
            type: selectedTemplate.type,
            clientName: selectedTemplate.clientName ?? "",
            repositoryUrl: selectedTemplate.repositoryUrl ?? "",
            budget: selectedTemplate.defaultBudget?.toString() ?? ""
        });
    }, [selectedTemplate, isDraftTemplate]);
    useEffect(() => {
        if (!templateToast)
            return;
        const timeout = setTimeout(() => setTemplateToast(null), 4000);
        return () => clearTimeout(timeout);
    }, [templateToast]);
    const createTreeNode = (title = "Nova etapa") => ({
        id: `node-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        title,
        children: []
    });
    const updateNodeTitle = (nodes, nodeId, value) => nodes.map((node) => {
        if (node.id === nodeId) {
            return { ...node, title: value };
        }
        return {
            ...node,
            children: node.children ? updateNodeTitle(node.children, nodeId, value) : []
        };
    });
    const addChildToTree = (nodes, nodeId, child) => nodes.map((node) => {
        if (node.id === nodeId) {
            return { ...node, children: [...(node.children ?? []), child] };
        }
        return {
            ...node,
            children: node.children ? addChildToTree(node.children, nodeId, child) : []
        };
    });
    const removeNodeFromTree = (nodes, nodeId) => nodes
        .filter((node) => node.id !== nodeId)
        .map((node) => ({
        ...node,
        children: node.children ? removeNodeFromTree(node.children, nodeId) : []
    }));
    const handleNodeTitleChange = (nodeId, value) => setWbsDraft((prev) => updateNodeTitle(prev, nodeId, value));
    const handleAddChild = (nodeId) => setWbsDraft((prev) => addChildToTree(prev, nodeId, createTreeNode("Nova entrega")));
    const handleRemoveNode = (nodeId) => setWbsDraft((prev) => removeNodeFromTree(prev, nodeId));
    const handleAddStage = () => setWbsDraft((prev) => [...prev, createTreeNode()]);
    const handleColumnChange = (index, value) => setBoardColumnsDraft((prev) => {
        const clone = [...prev];
        clone[index] = value;
        return clone;
    });
    const handleAddColumn = () => setBoardColumnsDraft((prev) => [...prev, `Etapa ${prev.length + 1}`]);
    const handleRemoveColumn = (index) => setBoardColumnsDraft((prev) => prev.filter((_, columnIndex) => columnIndex !== index));
    const handleFieldChange = (fieldId, key, value) => setCustomFieldsDraft((prev) => prev.map((field) => field.id === fieldId
        ? {
            ...field,
            [key]: key === "type"
                ? value
                : key === "required"
                    ? Boolean(value)
                    : value
        }
        : field));
    const handleAddField = () => setCustomFieldsDraft((prev) => [
        ...prev,
        { id: `field-${Date.now()}`, label: "Novo campo", type: "text", required: false }
    ]);
    const handleRemoveField = (fieldId) => setCustomFieldsDraft((prev) => prev.filter((field) => field.id !== fieldId));
    const handleTemplateMetaChange = (field, value) => setTemplateMeta((prev) => ({ ...prev, [field]: value }));
    const handleStartTemplate = () => {
        setIsDraftTemplate(true);
        const draftId = `draft-${Date.now()}`;
        setSelectedTemplateId(draftId);
        setTemplateMeta({
            name: "Novo template",
            type: "Custom",
            clientName: "",
            repositoryUrl: "",
            budget: ""
        });
        setBoardColumnsDraft([...defaultColumns]);
        setWbsDraft([createTreeNode("IniciAï¿½ï¿½o")]);
        setCustomFieldsDraft([]);
        setTemplateModalError(null);
        setTemplateModalOpen(true);
    };
    const openTemplateModal = (templateId) => {
        if (templateId !== selectedTemplateId) {
            setSelectedTemplateId(templateId);
        }
        setIsDraftTemplate(false);
        setTemplateModalError(null);
        setTemplateModalOpen(true);
    };
    const closeTemplateModal = () => setTemplateModalOpen(false);
    const renderWbsNodes = (nodes) => (_jsx("ul", { children: nodes.map((node) => (_jsxs("li", { children: [_jsxs("div", { className: "wbs-node", children: [_jsx("input", { value: node.title, onChange: (event) => handleNodeTitleChange(node.id, event.target.value) }), _jsxs("div", { className: "wbs-node__actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: () => handleAddChild(node.id), children: "+ Subtarefa" }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => handleRemoveNode(node.id), children: "Remover" })] })] }), node.children && node.children.length > 0 && renderWbsNodes(node.children)] }, node.id))) }));
    const mapNodesToPayload = (nodes) => nodes.map((node) => ({
        title: node.title.trim(),
        children: node.children && node.children.length ? mapNodesToPayload(node.children) : undefined
    }));
    const handleTemplateSubmit = async (event) => {
        event.preventDefault();
        if (!templateMeta.name.trim()) {
            setTemplateModalError("O nome do template ï¿½ obrigatï¿½rio.");
            return;
        }
        setTemplateModalLoading(true);
        try {
            const templateId = selectedTemplateId || `template-${Date.now()}`;
            await onSaveTemplate(templateId, {
                name: templateMeta.name.trim(),
                type: templateMeta.type.trim(),
                clientName: templateMeta.clientName.trim() || undefined,
                repositoryUrl: templateMeta.repositoryUrl.trim() || undefined,
                budget: templateMeta.budget ? Number(templateMeta.budget) : undefined,
                columns: boardColumnsDraft,
                wbs: mapNodesToPayload(wbsDraft),
                customFields: customFieldsDraft.map((field) => ({
                    id: field.id,
                    label: field.label.trim(),
                    type: field.type,
                    required: field.required
                }))
            });
            setTemplateToast("Template atualizado com sucesso.");
            setSelectedTemplateId(templateId);
            setIsDraftTemplate(false);
            setTemplateModalOpen(false);
        }
        catch (error) {
            setTemplateModalError(error instanceof Error ? error.message : "Erro ao salvar template");
        }
        finally {
            setTemplateModalLoading(false);
        }
    };
    return (_jsxs("div", { className: "templates-panel", children: [_jsxs("div", { className: "templates-actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: handleStartTemplate, children: "+ Criar template" }), _jsx("button", { type: "button", className: "secondary-button", children: "Importar modelo" })] }), templateToast && _jsx("p", { className: "success-text", children: templateToast }), _jsxs("div", { className: "templates-layout", children: [_jsxs("div", { className: "templates-grid", children: [isLoading && _jsx("p", { className: "muted", children: "Carregando templates..." }), !isLoading &&
                                templatesToUse.map((template) => (_jsxs("article", { className: `template-card ${selectedTemplateId === template.id ? "is-active" : ""}`, onClick: () => {
                                        setIsDraftTemplate(false);
                                        setSelectedTemplateId(template.id);
                                    }, role: "button", tabIndex: 0, children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: template.type }), _jsx("h4", { children: template.name })] }), _jsxs("span", { className: "pill pill-neutral", children: [template.phases, " fases"] })] }), _jsxs("p", { className: "muted", children: [template.tasks, " tarefas - Atualizado em ", new Date(template.updatedAt).toLocaleDateString("pt-BR")] }), _jsx("div", { className: "template-tags", children: template.tags.map((tag) => (_jsx("span", { children: tag }, `${template.id}-${tag}`))) }), _jsx("div", { className: "template-columns", children: template.columns.map((column) => (_jsx("small", { children: column }, `${template.id}-${column}`))) }), _jsxs("div", { className: "template-actions", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: (event) => {
                                                        event.stopPropagation();
                                                        openTemplateModal(template.id);
                                                    }, children: "Editar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Duplicar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Excluir" })] })] }, template.id)))] }), _jsxs("aside", { className: "templates-editor", children: [_jsxs("header", { children: [_jsx("p", { className: "eyebrow", children: "Editor do template" }), _jsx("h3", { children: templateMeta.name }), _jsx("p", { className: "subtext", children: "Pre-visualize a EDT padrao, ajuste colunas do board e defina campos customizados para novos projetos." })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Previa da EDT" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddStage, children: "+ Adicionar etapa" })] }), _jsx("div", { className: "wbs-preview", children: renderWbsNodes(wbsDraft) })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Colunas do board" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddColumn, children: "+ Nova coluna" })] }), _jsx("ul", { className: "board-columns-editor", children: boardColumnsDraft.map((column, index) => (_jsxs("li", { children: [_jsx("input", { value: column, onChange: (event) => handleColumnChange(index, event.target.value) }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => handleRemoveColumn(index), children: "Remover" })] }, `${selectedTemplateId}-column-${column}-${index}`))) })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Campos customizados" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddField, children: "+ Novo campo" })] }), _jsx("div", { className: "custom-fields-editor", children: customFieldsDraft.map((field) => (_jsxs("div", { className: "custom-field-card", children: [_jsxs("label", { children: ["Nome", _jsx("input", { value: field.label, onChange: (event) => handleFieldChange(field.id, "label", event.target.value) })] }), _jsxs("label", { children: ["Tipo", _jsxs("select", { value: field.type, onChange: (event) => handleFieldChange(field.id, "type", event.target.value), children: [_jsx("option", { value: "text", children: "Texto" }), _jsx("option", { value: "number", children: "Numero" }), _jsx("option", { value: "date", children: "Data" }), _jsx("option", { value: "select", children: "Lista" })] })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", checked: Boolean(field.required), onChange: (event) => handleFieldChange(field.id, "required", event.target.checked) }), _jsx("span", { children: "Obrigatorio" })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => handleRemoveField(field.id), children: "Remover" })] }, field.id))) })] })] })] }), templateModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Editar template" }), _jsx("h3", { children: templateMeta.name }), _jsx("p", { className: "subtext", children: "Ajuste os metadados do template e sincronize com o backend para novos projetos." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: closeTemplateModal, children: "Fechar" })] }), _jsxs("form", { className: "modal-form", onSubmit: handleTemplateSubmit, children: [_jsxs("label", { children: ["Nome", _jsx("input", { type: "text", value: templateMeta.name, onChange: (event) => handleTemplateMetaChange("name", event.target.value), required: true })] }), _jsxs("label", { children: ["Categoria", _jsx("input", { type: "text", value: templateMeta.type, onChange: (event) => handleTemplateMetaChange("type", event.target.value), required: true })] }), _jsxs("label", { children: ["Cliente/\u00EF\u00BF\u00BDrea padr\u00EF\u00BF\u00BDo", _jsx("input", { type: "text", value: templateMeta.clientName, onChange: (event) => handleTemplateMetaChange("clientName", event.target.value), placeholder: "Ex.: Corp PMO" })] }), _jsxs("label", { children: ["Reposit\u00EF\u00BF\u00BDrio GitHub", _jsx("input", { type: "url", value: templateMeta.repositoryUrl, onChange: (event) => handleTemplateMetaChange("repositoryUrl", event.target.value), placeholder: "https://github.com/org/template" })] }), _jsxs("label", { children: ["Or\u00EF\u00BF\u00BDamento base (R$)", _jsx("input", { type: "number", min: "0", step: "1000", value: templateMeta.budget, onChange: (event) => handleTemplateMetaChange("budget", event.target.value), placeholder: "150000" })] }), _jsx("p", { className: "subtext", children: "Este envio inclui a estrutura da EDT, colunas do board e campos customizados configurados nesta tela." }), templateModalError && _jsx("p", { className: "error-text", children: templateModalError }), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: closeTemplateModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: templateModalLoading, children: templateModalLoading ? "Salvando..." : "Salvar template" })] })] })] }) }))] }));
};
