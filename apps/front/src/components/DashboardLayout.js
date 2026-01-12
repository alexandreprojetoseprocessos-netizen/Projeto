import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Fragment, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { normalizeStatus, STATUS_ORDER } from "../utils/status";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { DependenciesDropdown } from "./DependenciesDropdown";
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
function SortableRow({ id, children, dragDisabled, className, ...rest }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: !!dragDisabled
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };
    return (_jsx("tr", { ref: setNodeRef, style: style, className: clsx(className, isDragging ? "wbs-row-dragging" : ""), ...rest, children: children({ attributes: attributes ?? {}, listeners: listeners ?? {}, isDragging }) }));
}
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
    { id: "edt", label: "EAP", icon: UsersIcon, path: "/EAP" },
    { id: "board", label: "Kanban", icon: ListChecksIcon, path: "/kanban" },
    { id: "cronograma", label: "Cronograma", icon: ClockIcon, path: "/cronograma" },
    { id: "atividades", label: "Timeline", icon: CommentIcon, path: "/atividades" },
    { id: "documentos", label: "Documentos", icon: FileIcon, path: "/documentos" },
    { id: "Relatórios", label: "Relatórios", icon: BarChartIcon, path: "/Relatórios" },
    { id: "equipe", label: "Equipes", icon: UsersIcon, path: "/equipe" },
    { id: "plano", label: "Meu plano", icon: BriefcaseIcon, path: "/plano" }
];
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
const ChatIcon = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11.5Z", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }) }));
const STATUS_TONE = {
    "Não iniciado": "neutral",
    "Em andamento": "info",
    "Em atraso": "danger",
    "Em risco": "warning",
    "Homologação": "info",
    "Finalizado": "success",
};
const STATUS_CLASS = {
    "Não iniciado": "bg-slate-50 text-slate-700 border-slate-300",
    "Em andamento": "bg-blue-50 text-blue-700 border-blue-300",
    "Em atraso": "bg-red-50 text-red-700 border-red-300",
    "Em risco": "bg-amber-50 text-amber-800 border-amber-300",
    "Homologação": "bg-indigo-50 text-indigo-800 border-indigo-300",
    "Finalizado": "bg-emerald-50 text-emerald-700 border-emerald-300",
    default: "bg-slate-50 text-slate-700 border-slate-300",
};
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
const parseDate = (value) => {
    if (!value)
        return null;
    if (value.includes("/")) {
        const [d, m, y] = value.split("/");
        if (!d || !m || !y)
            return null;
        const parsed = new Date(Number(y), Number(m) - 1, Number(d));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const calcDurationInDays = (start, end) => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e)
        return 0;
    const diff = Math.floor((e.getTime() - s.getTime()) / MS_IN_DAY) + 1;
    return diff > 0 ? diff : 0;
};
const computeDurationDays = (start, end) => {
    const duration = calcDurationInDays(start, end);
    return duration === 0 && (!start || !end) ? null : duration;
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
export const WbsTreeView = ({ nodes, loading, error, onCreate, onUpdate, onDelete, onRestore, onMove, members = [], onChangeResponsible, selectedNodeId, onSelect, dependencyOptions, onUpdateDependency, onOpenDetails, serviceCatalog = [], onSelectionChange, clearSelectionKey, filterText, filterStatus, filterService, filterOwner, filterOverdue }) => {
    const { selectedOrganizationId: currentOrganizationId, selectedProjectId, onReloadWbs } = useOutletContext();
    const { token: authToken, user: currentUser } = useAuth();
    const [treeNodes, setTreeNodes] = useState(nodes);
    useEffect(() => {
        setTreeNodes(nodes);
    }, [nodes]);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [activeMenuNode, setActiveMenuNode] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [statusPickerId, setStatusPickerId] = useState(null);
    const [editingDependenciesId, setEditingDependenciesId] = useState(null);
    const [pendingDependencies, setPendingDependencies] = useState([]);
    const dependencyEditorRef = useRef(null);
    const menuRef = useRef(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const selectAllRef = useRef(null);
    const [openChatTaskId, setOpenChatTaskId] = useState(null);
    const [chatDraft, setChatDraft] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [chatCounts, setChatCounts] = useState({});
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const lastClearKeyRef = useRef(undefined);
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
        return buildRows(treeNodes);
    }, [treeNodes]);
    const rowMap = useMemo(() => {
        const map = new Map();
        allRows.forEach((row) => map.set(row.node.id, row));
        return map;
    }, [allRows]);
    const updateSiblingsInTree = useCallback((list, parentId, updatedSiblings) => {
        if (parentId === null) {
            return updatedSiblings.map((child) => ({
                ...child,
                children: Array.isArray(child.children) ? child.children : child.children
            }));
        }
        return list.map((node) => {
            if (node.id === parentId) {
                return {
                    ...node,
                    children: updatedSiblings
                };
            }
            if (Array.isArray(node.children) && node.children.length) {
                return {
                    ...node,
                    children: updateSiblingsInTree(node.children, parentId, updatedSiblings)
                };
            }
            return node;
        });
    }, []);
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
        setStatusPickerId(nodeId);
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
        const duration = calcDurationInDays(nextStart, nextEnd);
        updates.durationInDays = duration;
        if (duration > 0) {
            updates.estimateHours = duration * WORKDAY_HOURS;
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
        const DurationDays = Math.max(1, Math.round(parsed));
        const row = rowMap.get(nodeId);
        if (!row)
            return;
        const updates = {
            estimateHours: DurationDays * WORKDAY_HOURS
        };
        if (row.node.startDate) {
            const startDate = new Date(row.node.startDate);
            if (!Number.isNaN(startDate.getTime())) {
                const newEnd = new Date(startDate.getTime());
                newEnd.setDate(startDate.getDate() + (DurationDays - 1));
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
        treeNodes.forEach((node) => compute(node));
        return cache;
    }, [treeNodes]);
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
    useEffect(() => {
        if (!openMenuId)
            return;
        const handleDocumentMouseDown = (event) => {
            const target = event.target;
            const clickedTrigger = target.closest(".wbs-actions-trigger");
            if (clickedTrigger)
                return;
            if (menuRef.current && !menuRef.current.contains(target)) {
                setOpenMenuId(null);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleDocumentMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        const handleScroll = () => setOpenMenuId(null);
        window.addEventListener("scroll", handleScroll, true);
        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [openMenuId]);
    useEffect(() => {
        if (!openMenuId) {
            setMenuPosition(null);
            setActiveMenuNode(null);
        }
    }, [openMenuId]);
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
    const resolveDisplayCode = (node, fallback) => node?.code ?? node?.wbsCode ?? node?.idNumber ?? node?.codeValue ?? fallback ?? node?.id;
    const isOverdue = (node) => {
        if (!node?.endDate)
            return false;
        const statusValue = String(node.status ?? "").toUpperCase();
        const isDone = statusValue === "DONE" ||
            statusValue === "FINISHED" ||
            statusValue === "COMPLETED" ||
            statusValue === "FINALIZADO";
        if (isDone)
            return false;
        const end = new Date(node.endDate);
        if (Number.isNaN(end.getTime()))
            return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return end < now;
    };
    const filteredRows = useMemo(() => {
        const q = filterText?.trim().toLowerCase();
        const normalizedFilter = filterStatus && filterStatus !== "ALL" ? normalizeStatus(filterStatus) : null;
        return visibleRows.filter((row) => {
            const node = row.node || {};
            // status filter
            if (normalizedFilter && normalizeStatus(node.status) !== normalizedFilter)
                return false;
            // service filter
            if (filterService && filterService !== "ALL" && String(node.serviceCatalogId ?? "") !== filterService) {
                return false;
            }
            // owner/responsible filter (using responsibleMembershipId as priority)
            const ownerValue = String(node.responsibleMembershipId ?? node.ownerId ?? "");
            if (filterOwner && filterOwner !== "ALL" && ownerValue !== filterOwner)
                return false;
            // overdue filter
            if (filterOverdue === "OVERDUE" && !isOverdue(node))
                return false;
            if (!q)
                return true;
            const code = String(resolveDisplayCode(node, row.displayId) ?? "").toLowerCase();
            const title = String(node.title ?? node.name ?? "").toLowerCase();
            const status = normalizeStatus(node.status).toLowerCase();
            const owner = String(node.owner?.fullName ??
                node.owner?.email ??
                node.responsible?.name ??
                node.responsible?.email ??
                node.responsible?.user?.fullName ??
                node.responsible?.user?.email ??
                "").toLowerCase();
            const service = String(node.serviceCatalog?.name ?? "").toLowerCase();
            return (code.includes(q) ||
                title.includes(q) ||
                status.includes(q) ||
                owner.includes(q) ||
                service.includes(q));
        });
    }, [filterText, filterOverdue, filterOwner, filterService, filterStatus, resolveDisplayCode, visibleRows]);
    const visibleIds = useMemo(() => filteredRows.map((row) => row.node.id), [filteredRows]);
    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        const activeId = String(active.id);
        const overId = String(over.id);
        const activeRow = rowMap.get(activeId);
        const overRow = rowMap.get(overId);
        if (!activeRow || !overRow)
            return;
        const activeParentId = activeRow.parentId ?? null;
        if (activeParentId !== (overRow.parentId ?? null))
            return;
        const parentRow = activeParentId ? rowMap.get(activeParentId) : null;
        const siblings = parentRow ? parentRow.node.children ?? [] : treeNodes;
        const activeIndex = siblings.findIndex((child) => child.id === activeId);
        const overIndex = siblings.findIndex((child) => child.id === overId);
        if (activeIndex < 0 || overIndex < 0)
            return;
        // arrayMove pode retornar tipos genericos/unknown dependendo da lib
        const moved = arrayMove(siblings, activeIndex, overIndex);
        // FORCA o tipo para manter id e demais props
        const reorderedSiblings = moved.map((sibling, index) => ({
            ...sibling,
            sortOrder: index
        }));
        // usa o moved (ou reorderedSiblings) mas com tipo garantido
        const orderedIds = moved.map((item) => String(item.id));
        setTreeNodes((prev) => updateSiblingsInTree(prev, activeParentId, reorderedSiblings));
        if (!authToken || !selectedProjectId)
            return;
        try {
            await fetch(apiUrl("/wbs/reorder"), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                    "X-Organization-Id": currentOrganizationId
                },
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    parentId: activeParentId,
                    orderedIds
                })
            });
        }
        catch (error) {
            console.error("Failed to reorder WBS", error);
            setTreeNodes(nodes);
            onReloadWbs?.();
        }
    }, [authToken, currentOrganizationId, nodes, onReloadWbs, rowMap, selectedProjectId, treeNodes, updateSiblingsInTree]);
    const handleSelectAllVisible = (checked) => {
        const ids = filteredRows.map((row) => row.node.id);
        if (checked) {
            const merged = Array.from(new Set([...selectedTaskIds, ...ids]));
            setSelectedTaskIds(merged);
        }
        else {
            setSelectedTaskIds((prev) => prev.filter((id) => !ids.includes(id)));
        }
    };
    const handleSelectRow = (checked, nodeId) => {
        if (checked) {
            setSelectedTaskIds((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
        }
        else {
            setSelectedTaskIds((prev) => prev.filter((id) => id !== nodeId));
        }
    };
    const isAllVisibleSelected = useMemo(() => {
        if (!filteredRows.length)
            return false;
        return filteredRows.every((row) => selectedTaskIds.includes(row.node.id));
    }, [filteredRows, selectedTaskIds]);
    useEffect(() => {
        if (!selectAllRef.current)
            return;
        const someSelected = selectedTaskIds.length > 0 && !isAllVisibleSelected;
        selectAllRef.current.indeterminate = someSelected;
    }, [isAllVisibleSelected, selectedTaskIds]);
    useEffect(() => {
        setSelectedTaskIds([]);
    }, [nodes]);
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedTaskIds);
        }
    }, [selectedTaskIds, onSelectionChange]);
    useEffect(() => {
        if (clearSelectionKey !== undefined && clearSelectionKey !== lastClearKeyRef.current) {
            lastClearKeyRef.current = clearSelectionKey;
            setSelectedTaskIds([]);
        }
    }, [clearSelectionKey]);
    useEffect(() => {
        if (!filteredRows.length)
            return;
        if (!authToken || !currentOrganizationId)
            return;
        const nodesWithoutCount = filteredRows.filter((row) => chatCounts[row.node.id] == null);
        if (nodesWithoutCount.length === 0)
            return;
        const controller = new AbortController();
        const loadAllCounts = async () => {
            const newCounts = {};
            await Promise.all(nodesWithoutCount.map(async (row) => {
                try {
                    const res = await fetch(apiUrl(`/wbs/${row.node.id}/comments`), {
                        headers: {
                            Authorization: `Bearer ${authToken ?? ""}`,
                            "X-Organization-Id": currentOrganizationId
                        },
                        signal: controller.signal
                    });
                    if (!res.ok)
                        return;
                    const comments = await res.json();
                    newCounts[row.node.id] = Array.isArray(comments) ? comments.length : 0;
                }
                catch (error) {
                    if (controller.signal.aborted)
                        return;
                    console.error("Erro ao carregar contador de Comentários", error);
                }
            }));
            if (Object.keys(newCounts).length > 0) {
                setChatCounts((prev) => ({ ...prev, ...newCounts }));
            }
        };
        loadAllCounts();
        return () => controller.abort();
    }, [visibleRows, authToken, currentOrganizationId, chatCounts]);
    const openChatRow = openChatTaskId ? rowMap.get(openChatTaskId) ?? null : null;
    useEffect(() => {
        if (!openChatTaskId) {
            setChatMessages([]);
            setChatError(null);
            return;
        }
        let active = true;
        setIsChatLoading(true);
        setChatError(null);
        const loadComments = async () => {
            try {
                const response = await fetch(apiUrl(`/wbs/${openChatTaskId}/comments`), {
                    headers: {
                        Authorization: `Bearer ${authToken ?? ""}`,
                        "X-Organization-Id": currentOrganizationId
                    }
                });
                if (!response.ok) {
                    console.error("Erro na API de Comentários (GET)", response.status, await response.text());
                    if (active)
                        setChatError("Erro ao listar Comentários");
                    return;
                }
                const data = (await response.json());
                if (!active)
                    return;
                setChatMessages(data);
                setChatCounts((prev) => ({ ...prev, [openChatTaskId]: data.length }));
                setChatError(null);
            }
            catch (error) {
                console.error("Erro na API de Comentários (GET)", error);
                if (active)
                    setChatError("Erro ao listar Comentários");
            }
            finally {
                if (active)
                    setIsChatLoading(false);
            }
        };
        loadComments();
        return () => {
            active = false;
        };
    }, [openChatTaskId]);
    const chatMessagesForModal = openChatTaskId ? chatMessages : [];
    const handleSendChat = async () => {
        const trimmed = chatDraft.trim();
        if (!trimmed || !openChatTaskId)
            return;
        setIsChatLoading(true);
        setChatError(null);
        try {
            const response = await fetch(apiUrl(`/wbs/${openChatTaskId}/comments`), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${authToken ?? ""}`,
                    "Content-Type": "application/json",
                    "X-Organization-Id": currentOrganizationId
                },
                body: JSON.stringify({ message: trimmed, authorName: currentUser?.name ?? null })
            });
            if (!response.ok) {
                console.error("Erro na API de Comentários (POST)", response.status, await response.text());
                setChatError("Erro ao criar comentário");
                return;
            }
            const created = (await response.json());
            setChatMessages((prev) => [...prev, created]);
            setChatCounts((prev) => ({ ...prev, [openChatTaskId]: (prev[openChatTaskId] ?? 0) + 1 }));
            setChatDraft("");
            setChatError(null);
        }
        catch (error) {
            console.error("Erro na API de Comentários (POST)", error);
            setChatError("Erro ao enviar comentário");
        }
        finally {
            setIsChatLoading(false);
        }
    };
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
            const siblings = newParentRow ? newParentRow.node.children ?? [] : treeNodes;
            const parentIndex = siblings.findIndex((child) => child.id === parentRow.node.id);
            const position = parentIndex >= 0 ? parentIndex + 1 : siblings.length;
            onMove(nodeId, newParentId, position);
            return;
        }
        const parentRow = currentRow.parentId ? rowMap.get(currentRow.parentId) : null;
        const siblings = parentRow ? parentRow.node.children ?? [] : treeNodes;
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
        const label = normalizeStatus(status);
        return { label, tone: STATUS_TONE[label] ?? "neutral" };
    };
    const formatDuracao = (start, end) => {
        if (!start || !end)
            return "N/A";
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
    const handleMenuToggle = (event, node) => {
        event.stopPropagation();
        cancelTitleEdit();
        setStatusPickerId(null);
        closeDependencyEditor();
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 4,
            left: rect.left - 120,
            width: 160
        });
        setActiveMenuNode(node);
        setOpenMenuId((current) => {
            const next = current === node.id ? null : node.id;
            if (next === null) {
                setMenuPosition(null);
                setActiveMenuNode(null);
            }
            return next;
        });
    };
    const moveRow = useCallback(async (nodeId, direction) => {
        if (!selectedProjectId || !authToken || !currentOrganizationId)
            return;
        const row = rowMap.get(nodeId);
        if (!row)
            return;
        const parentId = row.parentId ?? null;
        const siblings = (parentId ? rowMap.get(parentId)?.node.children : treeNodes) ?? [];
        const activeSiblings = siblings.filter((s) => !s.deletedAt);
        const currentIndex = activeSiblings.findIndex((s) => s.id === nodeId);
        if (currentIndex < 0)
            return;
        const targetIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= activeSiblings.length)
            return;
        const reordered = [...activeSiblings];
        const [moved] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        const orderedIds = reordered.map((s) => s.id);
        try {
            await fetch(apiUrl("/wbs/reorder"), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                    "X-Organization-Id": currentOrganizationId
                },
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    parentId,
                    orderedIds
                })
            });
            if (typeof onReloadWbs === "function") {
                await onReloadWbs();
            }
        }
        catch (error) {
            console.error("Failed to reorder", error);
        }
    }, [authToken, currentOrganizationId, onReloadWbs, rowMap, selectedProjectId, treeNodes]);
    const handleMenuAction = async (event, action, node) => {
        event.stopPropagation();
        if (!selectedProjectId || !authToken || !currentOrganizationId) {
            setOpenMenuId(null);
            return;
        }
        const parentId = node.parentId ?? null;
        try {
            if (action === "MOVE_UP") {
                await moveRow(node.id, "UP");
            }
            else if (action === "MOVE_DOWN") {
                await moveRow(node.id, "DOWN");
            }
            else if (action === "ADD_CHILD") {
                await onCreate?.(node.id, {
                    title: "Nova subtarefa",
                    status: "BACKLOG",
                    parentId: node.id
                });
                await onReloadWbs();
            }
            else if (action === "DUPLICATE") {
                const payload = {
                    title: `(Copia) ${node.title ?? node.name ?? "Tarefa"}`,
                    status: node.status ?? "BACKLOG",
                    parentId,
                    startDate: node.startDate ?? null,
                    endDate: node.endDate ?? null,
                    estimateHours: node.estimateHours ?? null,
                    ownerId: node.ownerId ?? null,
                    responsibleMembershipId: node.responsibleMembershipId ?? null,
                    serviceCatalogId: node.serviceCatalogId ?? null,
                    serviceMultiplier: node.serviceMultiplier ?? null,
                    serviceHours: node.serviceHours ?? null,
                    dependencies: node.dependencies ?? []
                };
                let newId = null;
                try {
                    const createRes = await fetch(apiUrl("/wbs"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authToken}`,
                            "X-Organization-Id": currentOrganizationId
                        },
                        body: JSON.stringify({ projectId: selectedProjectId, ...payload })
                    });
                    const created = await createRes.json();
                    newId = created?.id ?? created?.node?.id ?? null;
                }
                catch (error) {
                    console.error("Failed to duplicate node", error);
                }
                if (newId) {
                    const siblings = (parentId ? rowMap.get(parentId)?.node.children : treeNodes) ?? [];
                    const activeSiblings = siblings.filter((s) => !s.deletedAt);
                    const ordered = activeSiblings.reduce((arr, s) => {
                        arr.push(s.id);
                        if (s.id === node.id)
                            arr.push(newId);
                        return arr;
                    }, []);
                    await fetch(apiUrl("/wbs/reorder"), {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${authToken}`,
                            "X-Organization-Id": currentOrganizationId
                        },
                        body: JSON.stringify({
                            projectId: selectedProjectId,
                            parentId,
                            orderedIds: ordered
                        })
                    });
                }
                await onReloadWbs();
            }
            else if (action === "TRASH") {
                const targetIds = selectedTaskIds.length > 0 && selectedTaskIds.includes(node.id) ? selectedTaskIds : [node.id];
                const confirmMove = targetIds.length > 1
                    ? window.confirm(`Enviar ${targetIds.length} tarefas para a lixeira?`)
                    : window.confirm("Enviar esta tarefa para a lixeira?");
                if (!confirmMove) {
                    setOpenMenuId(null);
                    return;
                }
                await fetch(apiUrl("/wbs/bulk-delete"), {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                        "X-Organization-Id": currentOrganizationId
                    },
                    body: JSON.stringify({ ids: targetIds })
                });
                console.log("[trash] soft delete", targetIds);
                await onReloadWbs();
            }
        }
        catch (error) {
            console.error("Menu action error", error);
        }
        setOpenMenuId(null);
    };
    const handleBulkTrash = async () => {
        if (!selectedProjectId || !authToken || !currentOrganizationId)
            return;
        if (selectedTaskIds.length === 0)
            return;
        const confirmMove = window.confirm(`Enviar ${selectedTaskIds.length} tarefas para a lixeira?`);
        if (!confirmMove)
            return;
        try {
            await fetch(apiUrl("/wbs/bulk-delete"), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                    "X-Organization-Id": currentOrganizationId
                },
                body: JSON.stringify({ ids: selectedTaskIds })
            });
            console.log("[trash] soft delete", selectedTaskIds);
            setSelectedTaskIds([]);
            if (typeof onReloadWbs === "function") {
                await onReloadWbs();
            }
        }
        catch (error) {
            console.error("Bulk trash error", error);
        }
    };
    const handleCloseDetails = (event) => {
        event.stopPropagation();
        onSelect(null);
        setOpenMenuId(null);
    };
    const handleDetailsButton = (event, nodeId) => {
        event.stopPropagation();
        const row = rowMap.get(nodeId);
        if (row && typeof onOpenDetails === "function") {
            onOpenDetails(row.node);
            return;
        }
        handleRowSelect(nodeId);
    };
    if (!treeNodes.length) {
        return _jsx("p", { className: "muted", children: "Nenhum item cadastrado." });
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "wbs-table-card", "data-has-selection": selectedTaskIds.length > 0, children: [_jsx(DndContext, { collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx("div", { className: "edt-horizontal-scroll", children: _jsxs("table", { className: "wbs-table w-full border-collapse table-fixed", style: { borderSpacing: 0 }, children: [_jsxs("colgroup", { children: [_jsx("col", { style: { width: "28px" } }), _jsx("col", { style: { width: "32px" } }), _jsx("col", { style: { width: "50px" } }), _jsx("col", { style: { width: "70px" } }), _jsx("col", { style: { width: "90px" } }), _jsx("col", { style: { width: "320px" } }), _jsx("col", { style: { width: "170px" } }), _jsx("col", { style: { width: "85px" } }), _jsx("col", { style: { width: "180px" } }), _jsx("col", { style: { width: "180px" } }), _jsx("col", { style: { width: "180px" } }), _jsx("col", { style: { width: "200px" } }), _jsx("col", { style: { width: "110px" } }), _jsx("col", { style: { width: "90px" } }), _jsx("col", { style: { width: "150px" } }), _jsx("col", { style: { width: "150px" } })] }), _jsx("thead", { children: _jsxs("tr", { className: "bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase", children: [_jsx("th", { className: "px-1 py-2 text-center align-middle", "aria-hidden": "true" }), _jsx("th", { className: "px-1 py-2 text-center align-middle", children: _jsx("input", { type: "checkbox", "aria-label": "Selecionar todas as tarefas", ref: selectAllRef, checked: isAllVisibleSelected, onChange: (event) => handleSelectAllVisible(event.target.checked) }) }), _jsx("th", { className: "px-1 py-2 text-center align-middle", children: "ID" }), _jsx("th", { className: "px-1 py-2 text-center align-middle", title: "Coment\u00E1rios da tarefa", children: "Chat" }), _jsx("th", { className: "px-1 py-2 text-center align-middle", children: "Nvel" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-500", children: "Nome da tarefa" }), _jsx("th", { className: "w-[150px] px-3 py-2 text-left align-middle", children: "Situa\u00E7\u00E3o" }), _jsx("th", { className: "w-[140px] px-3 py-2 text-left align-middle", children: "Durao" }), _jsx("th", { className: "w-[220px] px-4 py-2 text-left text-xs font-semibold text-slate-500", children: "Incio" }), _jsx("th", { className: "w-[220px] px-4 py-2 text-left text-xs font-semibold text-slate-500", children: "Trmino" }), _jsx("th", { className: "px-4 py-2 text-left text-xs font-semibold text-slate-500", children: "Respons\u00E1vel" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-500", children: "Cat\u00E1logo de Servi\u00E7os" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-500", children: "Multiplicador" }), _jsx("th", { className: "px-3 py-2 text-left text-xs font-semibold text-slate-500", children: "HR" }), _jsx("th", { className: "w-[150px] px-3 py-2 text-left align-middle", children: "Dependncias" }), _jsx("th", { className: "w-[150px] px-3 py-2 text-center align-middle", children: "Detalhes" })] }) }), _jsx(SortableContext, { items: visibleIds, strategy: verticalListSortingStrategy, children: _jsx("tbody", { children: filteredRows.map((row) => {
                                                const displayId = resolveDisplayCode(row.node, row.displayId);
                                                const visualLevel = typeof row.node.level === "number" ? row.node.level : row.level;
                                                const status = resolveStatus(row.node.status);
                                                const isExpanded = row.hasChildren
                                                    ? (expandedNodes[row.node.id] ?? visualLevel < 1)
                                                    : false;
                                                const isActive = selectedNodeId === row.node.id;
                                                const responsibleMembershipId = row.node.responsible?.membershipId ?? "";
                                                const dependencyBadges = Array.isArray(row.node.dependencies) ? row.node.dependencies : [];
                                                const dependencyOptionsList = allRows
                                                    .filter((optionRow) => optionRow.node.id !== row.node.id)
                                                    .map((optionRow) => {
                                                    const optionDisplayCode = resolveDisplayCode(optionRow.node, optionRow.displayId);
                                                    return {
                                                        id: optionRow.node.id,
                                                        name: optionRow.node.title ?? optionRow.node.name ?? "Tarefa sem nome",
                                                        displayCode: optionDisplayCode,
                                                        wbsCode: optionRow.node.wbsCode ?? optionRow.displayId
                                                    };
                                                });
                                                const dependencyInfos = dependencyBadges.map((dependencyId) => {
                                                    const dependencyRow = rowMap.get(dependencyId);
                                                    if (!dependencyRow) {
                                                        return {
                                                            id: dependencyId,
                                                            label: dependencyId,
                                                            tooltip: "Tarefa não encontrada",
                                                            row: null
                                                        };
                                                    }
                                                    const label = resolveDisplayCode(dependencyRow.node, dependencyRow.displayId);
                                                    return {
                                                        id: dependencyId,
                                                        label,
                                                        tooltip: `${label} - ${dependencyRow.node.title ?? ""}`,
                                                        row: dependencyRow
                                                    };
                                                });
                                                const selectedService = serviceCatalog.find((service) => service.id === row.node.serviceCatalogId) ?? null;
                                                const serviceMultiplierValue = Number(row.node.serviceMultiplier ?? 1) || 1;
                                                const serviceBaseHours = selectedService && selectedService.hoursBase !== undefined
                                                    ? Number(selectedService.hoursBase ?? 0)
                                                    : selectedService && selectedService.hours !== undefined
                                                        ? Number(selectedService.hours ?? 0)
                                                        : null;
                                                const computedServiceHours = typeof row.node.serviceHours === "number"
                                                    ? row.node.serviceHours
                                                    : serviceBaseHours !== null
                                                        ? serviceBaseHours * serviceMultiplierValue
                                                        : null;
                                                const parentRow = row.parentId ? rowMap.get(row.parentId) : null;
                                                const siblingsAtLevel = parentRow ? parentRow.node.children ?? [] : treeNodes;
                                                const currentLevelIndex = siblingsAtLevel.findIndex((child) => child.id === row.node.id);
                                                const canLevelUp = Boolean(parentRow);
                                                const canLevelDown = currentLevelIndex > 0;
                                                const limitedLevel = Math.max(0, Math.min(visualLevel, 4));
                                                const levelClass = `level-${limitedLevel}`;
                                                const isEditingTitle = editingNodeId === row.node.id;
                                                const normalizedStatus = normalizeStatus(row.node.status);
                                                const statusClass = STATUS_CLASS[normalizedStatus] ?? STATUS_CLASS.default;
                                                const durationInDays = calcDurationInDays(row.node.startDate, row.node.endDate);
                                                const isStatusPickerOpen = statusPickerId === row.node.id;
                                                const progressValue = progressMap.get(row.node.id) ?? 0;
                                                const isRootLevel = visualLevel === 0;
                                                const formattedLevel = `${visualLevel}`;
                                                return (_jsx(SortableRow, { id: row.node.id, className: `wbs-row level-${limitedLevel} ${isActive ? "is-active" : ""}`, "data-progress": progressValue, "data-node-id": row.node.id, children: ({ attributes, listeners, isDragging }) => (_jsxs(_Fragment, { children: [_jsx("td", { className: "px-1 py-2 text-center align-middle", children: _jsx("button", { type: "button", className: "wbs-drag-handle", onClick: (event) => event.stopPropagation(), ...attributes, ...listeners, "data-dragging": isDragging || undefined, "aria-label": "Arrastar para reordenar", children: "::" }) }), _jsx("td", { className: "px-1 py-2 text-center align-middle", children: _jsx("input", { type: "checkbox", "aria-label": `Selecionar tarefa ${displayId}`, checked: selectedTaskIds.includes(row.node.id), onChange: (event) => {
                                                                        event.stopPropagation();
                                                                        handleSelectRow(event.target.checked, row.node.id);
                                                                    }, onClick: (event) => event.stopPropagation() }) }), _jsx("td", { className: "px-1 py-2 text-center align-middle text-[11px] text-slate-700", children: displayId }), _jsx("td", { className: "px-1 py-2 text-center align-middle", children: _jsxs("button", { type: "button", className: "wbs-chat-button relative inline-flex h-7 min-w-[40px] items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-50 transition", "aria-label": `Comentários da tarefa ${displayId}`, onClick: (event) => {
                                                                        event.stopPropagation();
                                                                        setOpenChatTaskId(row.node.id);
                                                                    }, children: [_jsx(ChatIcon, {}), _jsx("span", { className: "text-xs font-medium text-slate-600", children: chatCounts[row.node.id] ?? row.node.comments?.length ?? 0 }), (chatCounts[row.node.id] ?? row.node.comments?.length ?? 0) > 0 && (_jsx("span", { className: "absolute -top-[3px] -right-[3px] h-2.5 w-2.5 rounded-full bg-red-500 border border-white shadow-sm" }))] }) }), _jsx("td", { className: "px-2 py-2 text-center align-middle w-[80px]", children: _jsxs("div", { style: {
                                                                        display: "inline-flex",
                                                                        flexDirection: "row",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        gap: "6px",
                                                                        lineHeight: 1
                                                                    }, children: [_jsx("button", { type: "button", onClick: (event) => handleLevelAdjust(event, row.node.id, "up"), style: {
                                                                                border: "none",
                                                                                background: "transparent",
                                                                                padding: 0,
                                                                                margin: 0,
                                                                                cursor: "pointer",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                fontSize: "14px"
                                                                            }, children: "<" }), _jsx("span", { style: {
                                                                                minWidth: "12px",
                                                                                textAlign: "center",
                                                                                fontSize: "14px",
                                                                                fontWeight: 600
                                                                            }, children: row.node.level }), _jsx("button", { type: "button", onClick: (event) => handleLevelAdjust(event, row.node.id, "down"), style: {
                                                                                border: "none",
                                                                                background: "transparent",
                                                                                padding: 0,
                                                                                margin: 0,
                                                                                cursor: "pointer",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                fontSize: "14px"
                                                                            }, children: ">" })] }) }), _jsx("td", { className: "px-3 py-2 align-middle", children: _jsxs("div", { className: `flex w-full items-center gap-2 flex-1 min-w-[380px] max-w-none wbs-task-name ${visualLevel <= 1 ? "is-phase" : ""} ${levelClass}`, children: [row.hasChildren ? (_jsx("button", { type: "button", className: `wbs-toggle ${isExpanded ? "is-open" : ""}`, onClick: (event) => handleToggle(event, row.node.id, visualLevel), "aria-label": isExpanded ? "Recolher subtarefas" : "Expandir subtarefas", "aria-expanded": isExpanded, children: isExpanded ? "v" : ">" })) : (_jsx("span", { className: "wbs-toggle placeholder" })), _jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-[380px] max-w-none", children: [_jsx("span", { className: `wbs-node-icon ${row.hasChildren ? "is-folder" : "is-task"}`, children: row.hasChildren ? _jsx(FolderIcon, {}) : _jsx(TaskIcon, {}) }), _jsx("div", { className: "wbs-task-text", title: row.node.title ?? "Tarefa sem nome", onDoubleClick: (event) => handleBeginTitleEdit(event, row.node), children: isEditingTitle ? (_jsx("input", { className: "wbs-title-input", value: editingTitle, onChange: (event) => setEditingTitle(event.target.value), onBlur: commitTitleEdit, onKeyDown: handleTitleKeyDown, onClick: (event) => event.stopPropagation(), autoFocus: true, placeholder: "Nome da tarefa" })) : (_jsx(_Fragment, { children: _jsx("span", { className: clsx("wbs-task-text", row.node.level === 0 ? "font-semibold" : "font-normal"), children: row.node.title ?? row.node.name ?? "Tarefa sem nome" }) })) })] })] }) }), _jsx("td", { className: "px-3 py-2 align-middle", children: _jsx("select", { value: normalizeStatus(row.node.status), onClick: (event) => event.stopPropagation(), onChange: (event) => {
                                                                        event.stopPropagation();
                                                                        onUpdate(row.node.id, { status: event.target.value });
                                                                    }, "aria-label": "Alterar situa\u00E7\u00E3o da tarefa", className: clsx("wbs-status-select", STATUS_CLASS[normalizeStatus(row.node.status)] ?? STATUS_CLASS.default), children: STATUS_ORDER.map((statusOption) => (_jsx("option", { value: statusOption, children: statusOption }, statusOption))) }) }), _jsx("td", { className: "w-[140px] px-3 py-2 align-middle", children: _jsxs("span", { className: "inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700", children: [durationInDays, " ", durationInDays === 1 ? "dia" : "dias"] }) }), _jsx("td", { className: "px-4 py-2 align-middle w-[220px]", children: _jsx("div", { className: "wbs-date-input-wrapper", children: _jsx("input", { type: "date", value: formatDateInputValue(row.node.startDate), onChange: (event) => handleDateFieldChange(row.node.id, "startDate", event.target.value), onClick: (event) => event.stopPropagation(), placeholder: "dd/mm/aaaa", className: "wbs-date-input" }) }) }), _jsx("td", { className: "px-4 py-2 align-middle w-[220px]", children: _jsx("div", { className: "wbs-date-input-wrapper", children: _jsx("input", { type: "date", value: formatDateInputValue(row.node.endDate), onChange: (event) => handleDateFieldChange(row.node.id, "endDate", event.target.value), onClick: (event) => event.stopPropagation(), placeholder: "dd/mm/aaaa", className: "wbs-date-input" }) }) }), _jsx("td", { className: "px-4 py-2 align-middle min-w-[180px]", children: _jsxs("select", { className: "wbs-responsible-select", value: responsibleMembershipId, onClick: (event) => event.stopPropagation(), onChange: (event) => onChangeResponsible?.(row.node.id, event.target.value || null), children: [_jsx("option", { value: "", children: "Sem Respons\u00E1vel" }), members.map((member) => (_jsx("option", { value: member.id, children: member.name ?? member.email ?? member.userId }, member.id)))] }) }), _jsx("td", { className: "px-3 py-2 align-middle min-w-[200px]", children: _jsxs("select", { className: "wbs-service-select", value: row.node.serviceCatalogId ?? "", disabled: !serviceCatalog?.length, title: serviceCatalog?.length
                                                                        ? "Selecione um serviço"
                                                                        : "Use 'Importar serviços' para carregar o catálogo", onClick: (event) => event.stopPropagation(), onChange: (event) => {
                                                                        event.stopPropagation();
                                                                        const newServiceId = event.target.value || null;
                                                                        const catalogItem = serviceCatalog.find((service) => service.id === newServiceId);
                                                                        const baseHours = catalogItem
                                                                            ? Number(catalogItem.hoursBase ?? catalogItem.hours ?? 0)
                                                                            : null;
                                                                        const hours = baseHours !== null && baseHours !== undefined
                                                                            ? baseHours * (Number(serviceMultiplierValue) || 1)
                                                                            : null;
                                                                        onUpdate(row.node.id, {
                                                                            serviceCatalogId: newServiceId,
                                                                            serviceMultiplier: serviceMultiplierValue,
                                                                            serviceHours: hours ?? undefined
                                                                        });
                                                                    }, children: [_jsx("option", { value: "", children: "Sem servi\u00E7o" }), serviceCatalog?.length === 0 ? (_jsx("option", { value: "", disabled: true, children: "Cat\u00E1logo n\u00E3o configurado" })) : (serviceCatalog.map((service) => {
                                                                            const base = service.hoursBase ?? service.hours ?? null;
                                                                            const label = base !== null && base !== undefined ? `${service.name} (${base}h)` : service.name;
                                                                            return (_jsx("option", { value: service.id, title: label, children: label }, service.id));
                                                                        }))] }) }), _jsx("td", { className: "px-3 py-2 align-middle w-[110px]", children: _jsx("input", { type: "number", min: 1, step: 1, className: "wbs-multiplier-input", value: serviceMultiplierValue, onClick: (event) => event.stopPropagation(), onChange: (event) => {
                                                                        event.stopPropagation();
                                                                        const value = Math.max(1, Number(event.target.value) || 1);
                                                                        const catalogItem = row.node.serviceCatalogId
                                                                            ? serviceCatalog.find((service) => service.id === row.node.serviceCatalogId)
                                                                            : null;
                                                                        const baseHours = catalogItem
                                                                            ? Number(catalogItem.hoursBase ?? catalogItem.hours ?? 0)
                                                                            : null;
                                                                        const hours = baseHours !== null && baseHours !== undefined ? baseHours * value : null;
                                                                        onUpdate(row.node.id, {
                                                                            serviceCatalogId: row.node.serviceCatalogId ?? null,
                                                                            serviceMultiplier: value,
                                                                            serviceHours: hours ?? undefined,
                                                                        });
                                                                    } }) }), _jsx("td", { className: "px-3 py-2 align-middle text-center", children: _jsx("span", { className: "wbs-hr-badge", children: computedServiceHours !== null && computedServiceHours !== undefined
                                                                        ? `${Math.max(0, Math.round(computedServiceHours * 100) / 100)}h`
                                                                        : "-" }) }), _jsx("td", { className: "wbs-dependencies-cell w-[150px] px-3 py-2 align-middle", children: _jsx(DependenciesDropdown, { options: dependencyOptionsList, selectedIds: dependencyBadges, onChange: (newSelected) => onUpdate(row.node.id, { dependencies: newSelected }) }) }), _jsx("td", { className: "wbs-details-cell w-[150px] px-3 py-2 align-middle text-center", children: _jsx("div", { className: "wbs-details-actions", children: _jsxs("button", { type: "button", className: `wbs-details-button ${isActive ? "is-active" : ""}`, onClick: (event) => handleDetailsButton(event, row.node.id), "aria-label": "Ver detalhes da tarefa", children: [_jsx(DetailsIcon, {}), _jsx("span", { className: "details-label", children: "Detalhes" })] }) }) })] })) }, row.node.id));
                                            }) }) })] }) }) }), selectedTaskIds.length > 0 && (_jsxs("div", { className: "wbs-bulk-bar", children: [_jsxs("span", { className: "wbs-bulk-info", children: [selectedTaskIds.length, " selecionada(s)"] }), _jsxs("div", { className: "wbs-bulk-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setSelectedTaskIds([]), children: "Limpar sele\u00E7\u00E3o" }), _jsx("button", { type: "button", className: "btn-danger-ghost", onClick: handleBulkTrash, children: "Enviar para lixeira" })] })] })), openMenuId && menuPosition && activeMenuNode &&
                        createPortal(_jsx("div", { className: "wbs-actions-menu-overlay", style: {
                                position: "fixed",
                                top: menuPosition.top,
                                left: menuPosition.left,
                                zIndex: 9999,
                                width: menuPosition.width
                            }, ref: menuRef, children: _jsx("div", { className: "wbs-actions-menu", children: [
                                    { label: "Subir tarefa", action: "MOVE_UP" },
                                    { label: "Descer tarefa", action: "MOVE_DOWN" },
                                    { label: "Adicionar subtarefa", action: "ADD_CHILD" },
                                    { label: "Duplicar", action: "DUPLICATE" },
                                    { label: "Enviar para lixeira", action: "TRASH" }
                                ].map((item) => (_jsx("button", { type: "button", className: "wbs-actions-item", onClick: (event) => handleMenuAction(event, item.action, activeMenuNode), children: item.label }, item.action))) }) }), document.body)] }), openChatRow && (_jsx("div", { className: "gp-modal-backdrop", onClick: () => setOpenChatTaskId(null), children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "wbs-chat-title", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsxs("h2", { id: "wbs-chat-title", children: ["Chat da tarefa ", openChatRow.node.wbsCode ?? openChatRow.displayId, " - ", openChatRow.node.title ?? "Tarefa"] }), _jsx("button", { type: "button", className: "gp-modal-close", "aria-label": "Fechar", onClick: () => setOpenChatTaskId(null), children: "X" })] }), _jsxs("div", { className: "gp-modal-body wbs-chat-body", children: [_jsxs("div", { className: "wbs-chat-messages", children: [isChatLoading && _jsx("p", { className: "muted", children: "Carregando Coment\u00E1rios..." }), !isChatLoading &&
                                            chatMessagesForModal.map((message) => (_jsxs("div", { className: "wbs-chat-message", children: [_jsxs("div", { className: "wbs-chat-message__meta", children: [_jsx("strong", { children: message.authorName ?? "Autor" }), _jsx("span", { children: message.createdAt ? new Date(message.createdAt).toLocaleString("pt-BR") : "" })] }), _jsx("p", { children: message.message })] }, message.id))), !isChatLoading && chatMessagesForModal.length === 0 && _jsx("p", { className: "muted", children: "Nenhum coment\u00E1rio ainda." }), chatError && _jsx("p", { className: "error-text", children: chatError })] }), _jsxs("div", { className: "wbs-chat-composer", children: [_jsx("textarea", { value: chatDraft, onChange: (event) => setChatDraft(event.target.value), placeholder: "Escreva um coment\u00E1rio\u2026 use @ para mencionar algu\u00E9m", rows: 3 }), _jsxs("div", { className: "wbs-chat-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: () => setOpenChatTaskId(null), children: "Fechar" }), _jsx("button", { type: "button", className: "btn-primary", onClick: handleSendChat, disabled: !chatDraft.trim() || isChatLoading, children: "Enviar" })] })] })] })] }) }))] }));
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
export const ProjectDetailsTabs = ({ projectMeta, projectLoading, onEditProject, onAddTask, summary, summaryError, filters, onRangeChange, myTasks, members, membersError, attachments, attachmentsError, attachmentsLoading, reportMetrics, reportMetricsError, reportMetricsLoading, boardColumns, kanbanColumns, boardError, onCreateTask, onReloadBoard, onDragTask, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange, newTaskStartDate, onTaskStartDateChange, newTaskEndDate, onTaskEndDateChange, newTaskAssignee, onTaskAssigneeChange, newTaskEstimateHours, onTaskEstimateHoursChange, wbsNodes, wbsError, serviceCatalog, serviceCatalogError, onImportServiceCatalog, onCreateServiceCatalog, onUpdateServiceCatalog, onDeleteServiceCatalog, onReloadWbs, onMoveNode, onUpdateNode, selectedNodeId, onSelectNode, comments, commentsError, onSubmitComment, commentBody, onCommentBodyChange, timeEntryDate, timeEntryHours, timeEntryDescription, timeEntryError, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, ganttTasks, ganttMilestones, ganttError, onKanbanTaskClick }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const tabs = [
        { id: "overview", label: "Viso geral" },
        { id: "edt", label: "EDT" },
        { id: "board", label: "Board" },
        { id: "gantt", label: "Cronograma" },
        { id: "calendar", label: "Calendrio" },
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
        body: comment.body ?? comment.message,
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
            window.alert("Integração de upload em breve.");
        }
    };
    const formatShortDate = (value) => {
        if (!value)
            return "-";
        try {
            return new Date(value).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short"
            });
        }
        catch {
            return "-";
        }
    };
    const formatFileSize = (value) => {
        if (!value)
            return "-";
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
            DONE: "Concludo",
            COMPLETED: "Concludo",
            IN_PROGRESS: "Em andamento",
            PLANNED: "Planejado",
            AT_RISK: "Em risco",
            BLOCKED: "Bloqueado"
        };
        return _jsx("span", { className: `pill ${toneMap[normalized] ?? "pill-neutral"}`, children: labelMap[normalized] ?? status });
    };
    if (!projectMeta) {
        return (_jsx("section", { className: "project-details", children: _jsxs("article", { className: "card", children: [_jsx("h2", { children: projectLoading ? "Carregando dados do projeto..." : "Selecione um projeto" }), _jsx("p", { className: "muted", children: projectLoading ? "Buscando cards do portfólio para montar o cabeçalho." : "Escolha um projeto no topo para ver os detalhes completos." })] }) }));
    }
    const overviewHeader = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "project-details__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Detalhes do projeto" }), _jsx("h2", { children: projectMeta.projectName }), _jsxs("p", { className: "subtext", children: ["C\u00F3digo ", projectMeta.code ?? "N/A", " \u00B7 Cliente ", projectMeta.clientName ?? "Não informado"] }), _jsxs("div", { className: "project-header__meta", children: [renderStatusBadge(projectMeta.status), _jsxs("span", { children: ["Respons\u00E1vel: ", projectMeta.responsibleName ?? "Não informado"] }), _jsxs("span", { children: ["Per\u00EDodo: ", formatShortDate(projectMeta.startDate), " \u2014 ", formatShortDate(projectMeta.endDate)] })] })] }), _jsxs("div", { className: "project-header__actions", children: [_jsx("button", { type: "button", className: "secondary-button project-action project-action--secondary", onClick: onEditProject, disabled: !onEditProject, children: "Editar projeto" }), _jsx("button", { type: "button", className: "primary-button project-action project-action--primary", onClick: onAddTask, children: "Adicionar tarefa" }), _jsx("button", { type: "button", className: "ghost-button project-action project-action--link", children: "Compartilhar" })] })] }), _jsx("div", { className: "tabs", children: tabs.map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.id ? "is-active" : "", onClick: () => {
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
    const overviewContent = (_jsxs("div", { className: "tab-panel", children: [_jsxs("div", { className: "status-grid", children: [_jsxs("article", { className: "card status-card", children: [_jsx("h3", { children: "Progresso geral" }), _jsxs("div", { className: "progress-ring", children: [_jsxs("svg", { width: "140", height: "140", children: [_jsx("circle", { cx: "70", cy: "70", r: "54", strokeWidth: "12", className: "progress-ring__bg" }), _jsx("circle", { cx: "70", cy: "70", r: "54", strokeWidth: "12", className: "progress-ring__value", strokeDasharray: `${strokeValue} ${circumference}` })] }), _jsxs("div", { className: "progress-ring__label", children: [_jsxs("strong", { children: [progressPercent, "%"] }), _jsx("span", { children: "Concludo" })] })] }), _jsxs("ul", { className: "progress-legend", children: [_jsxs("li", { children: [_jsx("span", { className: "dot dot-done" }), summary?.totals?.done ?? 0, " Concludas"] }), _jsxs("li", { children: [_jsx("span", { className: "dot dot-inprogress" }), summary?.totals?.inProgress ?? 0, " em andamento"] }), _jsxs("li", { children: [_jsx("span", { className: "dot dot-backlog" }), summary?.totals?.backlog ?? 0, " backlog"] })] })] }), _jsxs("article", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("h3", { children: "Burn-down / Horas" }), _jsxs("p", { className: "subtext", children: ["Vis\u00E3o dos \u00FAltimos ", filters.rangeDays, " dias"] })] }), _jsxs("label", { className: "inline-select", children: ["Intervalo", _jsxs("select", { value: filters.rangeDays, onChange: (event) => onRangeChange(Number(event.target.value)), children: [_jsx("option", { value: 7, children: "7" }), _jsx("option", { value: 14, children: "14" }), _jsx("option", { value: 30, children: "30" })] })] })] }), summaryError && _jsx("p", { className: "error-text", children: summaryError }), summary ? (_jsxs("div", { className: "chart-grid", children: [_jsx("div", { className: "chart-card", children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(LineChart, { data: summary.burnDown, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate, stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }, labelStyle: { fontWeight: 600, color: "#0c2748" } }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "done", stroke: "#34d399", strokeWidth: 3, dot: { r: 4 } }), _jsx(Line, { type: "monotone", dataKey: "remaining", stroke: "#f87171", strokeWidth: 3, dot: { r: 4 } })] }) }) }), _jsx("div", { className: "chart-card", children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: summary.timeEntries, children: [_jsx(XAxis, { dataKey: "date", tickFormatter: formatDate, stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { borderRadius: 12, borderColor: "rgba(12,23,42,0.1)" }, labelStyle: { fontWeight: 600, color: "#0c2748" } }), _jsx(Bar, { dataKey: "hours", fill: "#6b4eff", radius: [8, 8, 0, 0] })] }) }) })] })) : (_jsx("p", { className: "muted", children: "Selecione um projeto para ver o resumo." }))] })] }), summary && (_jsxs("div", { className: "summary-stats", children: [_jsxs("div", { children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: summary.totals.total })] }), _jsxs("div", { children: [_jsx("span", { children: "Concludas" }), _jsx("strong", { children: summary.totals.done })] }), _jsxs("div", { children: [_jsx("span", { children: "Em andamento" }), _jsx("strong", { children: summary.totals.inProgress })] }), _jsxs("div", { children: [_jsx("span", { children: "Backlog" }), _jsx("strong", { children: summary.totals.backlog })] }), _jsxs("div", { children: [_jsx("span", { children: "Bloqueadas" }), _jsx("strong", { children: summary.totals.blocked })] }), _jsxs("div", { children: [_jsx("span", { children: "Atrasadas" }), _jsx("strong", { children: summary.overdueTasks })] })] })), _jsxs("div", { className: "overview-grid", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Marcos" }) }), ganttMilestones?.length ? (_jsx("ul", { className: "milestone-list", children: ganttMilestones.slice(0, 4).map((milestone) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: milestone.name }), _jsx("span", { children: formatShortDate(milestone.dueDate) })] }), _jsx("span", { className: "pill pill-neutral", children: milestone.status ?? "Previsto" })] }, milestone.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum marco cadastrado." }))] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Riscos e impedimentos" }) }), _jsx("p", { className: "highlight-number", children: projectMeta.risksOpen ?? 0 }), _jsx("p", { className: "subtext", children: "Riscos abertos" }), _jsx("p", { className: "muted", children: "Acompanhe o plano de mitiga\u00E7\u00E3o e distribua respons\u00E1veis para cada item cr\u00EDtico." })] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Horas registradas" }) }), _jsxs("p", { className: "highlight-number", children: [Number(projectMeta.hoursTracked ?? summary?.hoursTracked ?? 0).toFixed(1), "h"] }), _jsx("p", { className: "subtext", children: "Somat\u00F3rio das \u00FAltimas entregas" })] })] }), _jsxs("div", { className: "split-grid", children: [_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h3", { children: "Minhas tarefas" }), _jsx("button", { type: "button", className: "ghost-button", children: "Ver todas" })] }), myTasks.length ? (_jsx("ul", { className: "task-list", children: myTasks.map((task) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: task.title }), _jsx("span", { children: task.column })] }), _jsx("span", { className: `pill ${task.status.toLowerCase()}`, children: task.status })] }, task.id))) })) : (_jsx("p", { className: "muted", children: "Nenhuma tarefa atribu\u00EDda." }))] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Equipe" }) }), membersError && _jsx("p", { className: "error-text", children: membersError }), members.length ? (_jsx("ul", { className: "team-list", children: members.map((member) => (_jsxs("li", { children: [_jsx("div", { className: "avatar", children: member.name?.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.role })] }), _jsxs("span", { children: [member.capacityWeekly ?? 0, "h"] })] }, member.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum membro vinculado." }))] })] })] }));
    const boardContent = (_jsxs("div", { className: "tab-panel", children: [boardError && _jsx("p", { className: "error-text", children: boardError }), _jsx(CustomKanbanBoard, { columns: kanbanColumns, onDragEnd: onDragTask, onCreate: onCreateTask, onTaskClick: onKanbanTaskClick, newTaskTitle: newTaskTitle, onTaskTitleChange: onTaskTitleChange, newTaskColumn: newTaskColumn, onTaskColumnChange: onTaskColumnChange })] }));
    const ganttContent = (_jsxs("div", { className: "tab-panel", children: [ganttError && _jsx("p", { className: "error-text", children: ganttError }), _jsx(GanttTimeline, { tasks: ganttTasks, milestones: ganttMilestones })] }));
    const calendarContent = (_jsx("div", { className: "tab-panel", children: calendarEvents.length ? (_jsx("ul", { className: "calendar-list", children: calendarEvents.map((event) => (_jsxs("li", { children: [_jsxs("div", { className: "calendar-date", children: [_jsx("span", { children: formatShortDate(event.date) }), _jsx("small", { children: event.type })] }), _jsx("strong", { children: event.title })] }, event.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum evento agendado." })) }));
    const docsContent = (_jsxs("div", { className: "tab-panel", children: [attachmentsError && _jsx("p", { className: "error-text", children: attachmentsError }), attachmentsLoading ? (_jsx("div", { className: "docs-grid", children: [0, 1, 2].map((index) => (_jsxs("article", { className: "doc-card skeleton-card", children: [_jsx("div", { className: "skeleton skeleton-title" }), _jsx("div", { className: "skeleton skeleton-text" }), _jsx("div", { className: "skeleton skeleton-text", style: { width: "40%" } })] }, index))) })) : attachments.length ? (_jsx("div", { className: "docs-grid", children: attachments.map((doc) => (_jsxs("article", { className: "doc-card", children: [_jsxs("div", { children: [_jsx("h4", { children: doc.fileName }), _jsx("p", { className: "subtext", children: doc.category ?? "Documento" })] }), _jsxs("small", { children: [doc.uploadedBy?.fullName ?? doc.uploadedBy?.email ?? "Equipe", " \u00B7 ", formatShortDate(doc.createdAt)] }), _jsxs("small", { children: [formatFileSize(doc.fileSize), " \u00B7 ", doc.targetType === "WBS_NODE" ? "Vinculado à WBS" : "Projeto"] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => window.alert("Integração de download em breve."), children: "Baixar" })] }, doc.id))) })) : (_jsx(EmptyStateCard, { icon: FileIcon, title: "Nenhum documento enviado", description: "Centralize atas, contratos e anexos importantes para facilitar o acompanhamento.", actionLabel: "Adicionar documento", onAction: handleAddDocument }))] }));
    const activityContent = (_jsxs("div", { className: "tab-panel activity-panel", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Timeline de atividades" }) }), commentsError && _jsx("p", { className: "error-text", children: commentsError }), activityItems.length ? (_jsx("ul", { className: "activity-timeline", children: activityItems.map((activity) => (_jsxs("li", { children: [_jsx("div", { className: "activity-avatar", children: activity.author?.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: activity.author }), _jsx("span", { children: activity.role }), _jsx("p", { children: activity.body }), _jsx("small", { children: formatShortDate(activity.createdAt) })] })] }, activity.id))) })) : (_jsx(EmptyStateCard, { icon: CommentIcon, title: "Nenhuma atividade registrada", description: "Compartilhe atualiza\u00E7\u00F5es ou registre horas para construir o hist\u00F3rico colaborativo do projeto.", actionLabel: "Registrar atualizAo", onAction: focusCommentComposer }))] }), _jsxs("div", { className: "split-grid", children: [_jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Novo coment\u00E1rio" }) }), _jsxs("form", { onSubmit: onSubmitComment, className: "feedback-form", children: [_jsx("p", { className: "muted", children: "Selecione um item na EDT para vincular o coment\u00E1rio." }), _jsx("textarea", { ref: commentTextareaRef, placeholder: "Anote atualiza\u00E7\u00F5es ou decis\u00F5es...", value: commentBody, onChange: (event) => onCommentBodyChange(event.target.value) }), _jsx("button", { type: "submit", className: "primary-button", disabled: !selectedNodeId || !commentBody.trim(), children: "Registrar coment\u00E1rio" })] })] }), _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Registro r\u00E1pido de horas" }) }), _jsxs("form", { onSubmit: onLogTime, className: "time-form", children: [_jsx("p", { className: "muted", children: "Selecione uma tarefa na EDT antes de registrar." }), _jsxs("label", { children: ["Data", _jsx("input", { type: "date", value: timeEntryDate, onChange: (event) => onTimeEntryDateChange(event.target.value) })] }), _jsxs("label", { children: ["Horas", _jsx("input", { type: "number", min: "0.25", step: "0.25", value: timeEntryHours, onChange: (event) => onTimeEntryHoursChange(event.target.value) })] }), _jsxs("label", { children: ["descri\u00E7\u00E3o", _jsx("textarea", { value: timeEntryDescription, onChange: (event) => onTimeEntryDescriptionChange(event.target.value) })] }), timeEntryError && (_jsx("p", { className: "error-text", role: "status", children: timeEntryError })), _jsx("button", { type: "submit", className: "primary-button", disabled: !selectedNodeId, children: "Registrar horas" })] })] })] })] }));
    const boardTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "O board deste projeto est\u00E1 em uma p\u00E1gina dedicada." }) }));
    const ganttTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "O cronograma deste projeto est\u00E1 em uma p\u00E1gina dedicada." }) }));
    const docsTabPlaceholder = (_jsx("div", { className: "tab-panel", children: _jsx("p", { className: "muted", children: "Os documentos deste projeto est\u00E3o em uma p\u00E1gina dedicada." }) }));
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
            const status = allocation >= 90 ? "Alta carga" : allocation <= 40 ? "disponível" : "Balanceado";
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
    return (_jsxs("section", { className: "team-section", children: [_jsxs("div", { className: "team-section__header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Equipe" }), _jsx("h2", { children: "Vis\u00E3o da Equipe do projeto" }), _jsx("p", { className: "subtext", children: "Filtre por papel, status ou busque pessoas para abrir o painel detalhado." })] }), _jsxs("div", { className: "team-summary", children: [_jsx("strong", { children: members.length }), _jsxs("span", { children: ["Colaboradores no projeto ", projectName ?? "atual"] })] })] }), _jsxs("div", { className: "team-filters", children: [_jsxs("label", { children: ["Papel", _jsxs("select", { value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), roleOptions.map((role) => (_jsx("option", { value: role, children: role }, role)))] })] }), _jsxs("label", { children: ["Status", _jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "dispon\u00EDvel", children: "dispon\u00EDvel" }), _jsx("option", { value: "Alocado", children: "Alocado" }), _jsx("option", { value: "Em f\u00E9rias / folga", children: "Em f\u00E9rias / folga" })] })] }), _jsxs("label", { className: "search-field", children: ["Busca", _jsx("input", { type: "search", placeholder: "Nome ou e-mail...", value: search, onChange: (event) => setSearch(event.target.value) })] })] }), membersError && _jsx("p", { className: "error-text", children: membersError }), filteredMembers.length ? (_jsx("div", { className: "team-grid", children: filteredMembers.map((member) => (_jsxs("article", { className: "team-card", onClick: () => setSelectedMember(member), children: [_jsxs("div", { className: "team-card__header", children: [_jsx("div", { className: "avatar", children: member.avatar }), _jsxs("div", { children: [_jsx("strong", { children: member.name }), _jsx("span", { children: member.role })] }), _jsx("span", { className: "pill pill-neutral", children: member.status })] }), _jsxs("div", { className: "team-card__body", children: [_jsx("p", { children: member.email }), _jsx("div", { className: "progress-bar team-card__allocation", children: _jsx("span", { style: { width: `${member.allocation}%` } }) }), _jsxs("small", { children: ["AlocAo: ", member.allocation, "%"] }), _jsx("div", { className: "team-card__skills", children: member.skills.map((skill) => (_jsx("span", { children: skill }, `${member.id}-${skill}`))) })] }), _jsx("button", { type: "button", className: "ghost-button", children: "Ver detalhes" })] }, member.id))) })) : (_jsx("p", { className: "muted", children: "Nenhum membro corresponde aos filtros selecionados." })), selectedMember && (_jsx("div", { className: "team-drawer", onClick: () => setSelectedMember(null), children: _jsxs("div", { className: "team-drawer__content", onClick: (event) => event.stopPropagation(), children: [_jsxs("header", { children: [_jsx("div", { className: "avatar is-large", children: selectedMember.avatar }), _jsxs("div", { children: [_jsx("h3", { children: selectedMember.name }), _jsx("p", { children: selectedMember.email }), _jsx("span", { className: "pill pill-neutral", children: selectedMember.status })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => setSelectedMember(null), children: "Fechar" })] }), _jsxs("div", { className: "team-drawer__details", children: [_jsxs("div", { children: [_jsx("strong", { children: "Papel" }), _jsx("p", { children: selectedMember.role })] }), _jsxs("div", { children: [_jsx("strong", { children: "Capacidade semanal" }), _jsxs("p", { children: [selectedMember.capacityWeekly ?? 0, "h"] })] }), _jsxs("div", { children: [_jsx("strong", { children: "AlocAo" }), _jsxs("p", { children: [selectedMember.allocation, "%"] })] })] }), _jsxs("div", { children: [_jsx("strong", { children: "Skills" }), _jsx("div", { className: "team-card__skills", children: selectedMember.skills.map((skill) => (_jsx("span", { children: skill }, `${selectedMember.id}-${skill}`))) })] })] }) }))] }));
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
    return (_jsxs("section", { className: "reports-section", children: [_jsxs("header", { className: "reports-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Relat\u00F3rios" }), _jsx("h2", { children: "Vis\u00E3o anal\u00EDtica" }), _jsx("p", { className: "subtext", children: "Escolha o foco para comparar resultados do portf\u00F3lio." })] }), _jsx("div", { className: "reports-tabs", children: [
                            { id: "status", label: "Status" },
                            { id: "risks", label: "Riscos" },
                            { id: "hours", label: "Horas" },
                            { id: "progress", label: "Progresso" }
                        ].map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.id ? "is-active" : "", onClick: () => setActiveTab(tab.id), children: tab.label }, tab.id))) })] }), metricsError && _jsx("p", { className: "error-text", children: metricsError }), metricsLoading ? (_jsx("p", { className: "muted", children: "Carregando Relat\u00F3rios..." })) : (_jsxs("div", { className: "reports-grid", children: [activeTab === "status" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Status dos projetos" }), statusData.length ? (_jsx("ul", { className: "reports-list", children: statusData.map((item) => (_jsxs("li", { children: [_jsx("span", { children: item.status }), _jsx("strong", { children: item.value })] }, item.status))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Sem status consolidados", description: "Assim que os projetos forem sincronizados, mostraremos o panorama por status aqui." }))] })), activeTab === "risks" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Riscos" }), riskData.open || riskData.closed ? (_jsxs("div", { className: "reports-risk", children: [_jsxs("div", { children: [_jsx("span", { children: "Abertos" }), _jsx("strong", { children: riskData.open })] }), _jsxs("div", { children: [_jsx("span", { children: "Fechados" }), _jsx("strong", { children: riskData.closed })] })] })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Nenhum risco registrado", description: "Cadastre riscos nos projetos para acompanhar o volume por status." }))] })), activeTab === "hours" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Horas por projeto" }), hoursByProject.length ? (_jsx("ul", { className: "reports-list", children: hoursByProject.map((project) => (_jsxs("li", { children: [_jsx("span", { children: project.projectName }), _jsxs("strong", { children: [project.hours?.toFixed ? project.hours.toFixed(1) : project.hours, "h"] })] }, project.projectId))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Sem apontamentos de horas", description: "Registre horas nos projetos para comparar o esfor\u00E7o entre Equipes." }))] })), activeTab === "progress" && (_jsxs("article", { className: "reports-card", children: [_jsx("h3", { children: "Progresso m\u00E9dio" }), progressSeries.length ? (_jsx("div", { className: "reports-sparkline", children: progressSeries.map((point) => (_jsx("span", { style: { height: `${Math.max(5, point.progress)}%` }, title: `${point.date} - ${point.progress}%` }, point.date))) })) : (_jsx(EmptyStateCard, { icon: InsightIcon, title: "Progresso indispon\u00EDvel", description: "Atualize o status das tarefas para gerar a linha de tend\u00EAncia do portf\u00F3lio." }))] }))] }))] }));
};
const SettingsPanel = () => {
    const [activeSection, setActiveSection] = useState("profile");
    const sections = [
        { id: "profile", label: "Perfil" },
        { id: "notifications", label: "Notificações" },
        { id: "organization", label: "Organização" },
        { id: "permissions", label: "Permissões" },
        { id: "integrations", label: "Integrações" },
        { id: "billing", label: "Faturamento" }
    ];
    return (_jsxs("section", { className: "settings-section", children: [_jsx("header", { children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Configura\u00E7\u00F5es" }), _jsx("h2", { children: "Central de ajustes" }), _jsx("p", { className: "subtext", children: "Gerencie perfil, notifica\u00E7\u00F5es, Organiza\u00E7\u00E3o e integra\u00E7\u00F5es." })] }) }), _jsxs("div", { className: "settings-layout", children: [_jsx("nav", { className: "settings-menu", children: sections.map((section) => (_jsx("button", { type: "button", className: activeSection === section.id ? "is-active" : "", onClick: () => setActiveSection(section.id), children: section.label }, section.id))) }), _jsxs("div", { className: "settings-content", children: [activeSection === "profile" && (_jsxs("form", { className: "settings-form", children: [_jsx("h3", { children: "Perfil" }), _jsxs("label", { children: ["Nome completo", _jsx("input", { type: "text", placeholder: "Seu nome" })] }), _jsxs("label", { children: ["E-mail", _jsx("input", { type: "email", placeholder: "voce@empresa.com" })] }), _jsxs("label", { children: ["Idioma", _jsxs("select", { children: [_jsx("option", { children: "Portugu\u00EAs (Brasil)" }), _jsx("option", { children: "Ingl\u00EAs" })] })] }), _jsx("button", { type: "button", className: "primary-button", children: "Atualizar perfil" })] })), activeSection === "notifications" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Notifica\u00E7\u00F5es" }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", defaultChecked: true }), _jsx("span", { children: "E-mails sobre tarefas atribu\u00EDdas" })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox" }), _jsx("span", { children: "Mensagens em canais do Slack" })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", defaultChecked: true }), _jsx("span", { children: "Alertas de riscos" })] })] })), activeSection === "organization" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Organiza\u00E7\u00E3o" }), _jsxs("label", { children: ["Nome da Organiza\u00E7\u00E3o", _jsx("input", { type: "text", placeholder: "Organiza\u00E7\u00E3o Demo" })] }), _jsxs("label", { children: ["Dom\u00EDnio", _jsx("input", { type: "text", placeholder: "demo.local" })] }), _jsx("button", { type: "button", className: "secondary-button", children: "Salvar" })] })), activeSection === "permissions" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Permiss\u00F5es e pap\u00E9is" }), _jsx("p", { className: "muted", children: "Gerencie quem pode criar projetos, alterar WBS e exportar dados." }), _jsxs("table", { className: "settings-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Papel" }), _jsx("th", { children: "Criar projeto" }), _jsx("th", { children: "Editar WBS" }), _jsx("th", { children: "Ver Relat\u00F3rios" })] }) }), _jsx("tbody", { children: ["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((role) => (_jsxs("tr", { children: [_jsx("td", { children: role }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role !== "VIEWER" }) }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role === "OWNER" || role === "ADMIN" }) }), _jsx("td", { children: _jsx("input", { type: "checkbox", defaultChecked: role !== "VIEWER" }) })] }, role))) })] })] })), activeSection === "integrations" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Integra\u00E7\u00F5es" }), _jsx("div", { className: "integrations-grid", children: ["GitHub", "Google Drive", "Slack", "Google Calendar"].map((integration) => (_jsxs("article", { children: [_jsx("strong", { children: integration }), _jsx("p", { className: "muted", children: "Sincronize dados e automatize o fluxo." }), _jsx("button", { type: "button", className: "secondary-button", children: "Conectar" })] }, integration))) })] })), activeSection === "billing" && (_jsxs("div", { className: "settings-form", children: [_jsx("h3", { children: "Faturamento / Plano" }), _jsxs("p", { className: "muted", children: ["Plano atual: ", _jsx("strong", { children: "Pro \u00B7 20/50 projetos" })] }), _jsx("button", { type: "button", className: "secondary-button", children: "Gerenciar plano" })] }))] })] })] }));
};
export const DashboardLayout = ({ userEmail, organizations, selectedOrganizationId, onOrganizationChange, currentOrgRole, orgError, onSignOut, projects, selectedProjectId, onProjectChange, onSelectProject, projectLimits, projectsError, filters, onRangeChange, summary, summaryError, members, membersError, attachments, attachmentsError, attachmentsLoading, reportMetrics, reportMetricsError, reportMetricsLoading, boardColumns, kanbanColumns, boardError, onCreateTask, onReloadBoard, onDragTask, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange, newTaskStartDate, onTaskStartDateChange, newTaskEndDate, onTaskEndDateChange, newTaskAssignee, onTaskAssigneeChange, newTaskEstimateHours, onTaskEstimateHoursChange, wbsNodes, wbsError, serviceCatalog, serviceCatalogError, onImportServiceCatalog, onCreateServiceCatalog, onUpdateServiceCatalog, onDeleteServiceCatalog, onReloadWbs, onMoveNode, onUpdateWbsNode, onUpdateWbsResponsible, onCreateWbsItem, selectedNodeId, onSelectNode, comments, commentsError, onSubmitComment, commentBody, onCommentBodyChange, timeEntryDate, timeEntryHours, timeEntryDescription, timeEntryError, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, ganttTasks, ganttMilestones, ganttError, portfolio, portfolioError, portfolioLoading, onExportPortfolio, onCreateProject, onUpdateProject, }) => {
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
    const [isCollapsed, setIsCollapsed] = useState(false);
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
            setProjectModalError("O nome do projeto é obrigatório.");
            return;
        }
        if (!projectForm.clientName.trim()) {
            setProjectModalError("Informe o cliente Responsável.");
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
        projectLimits,
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
        serviceCatalog,
        serviceCatalogError,
        onImportServiceCatalog,
        onCreateServiceCatalog,
        onUpdateServiceCatalog,
        onDeleteServiceCatalog,
        onReloadWbs,
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
        onUpdateWbsResponsible,
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
    const appShellClassName = `app-shell ${isCollapsed ? "app-shell--collapsed" : ""}`.trim();
    const currentOrganization = organizations.find((org) => org.id === selectedOrganizationId) ?? null;
    return (_jsxs("div", { className: appShellClassName, children: [_jsxs("aside", { className: "dashboard-sidebar sidebar", children: [_jsx("div", { className: "sidebar-header", children: _jsxs("button", { type: "button", className: "sidebar-brand", onClick: () => setIsCollapsed((prev) => !prev), "aria-label": isCollapsed ? "Expandir menu" : "Recolher menu", children: [_jsx("img", { src: "/logo.png", alt: "G&P Gesto de Projetos", className: "sidebar-logo-img" }), !isCollapsed && (_jsxs("div", { className: "sidebar-brand-text", children: [_jsx("span", { className: "brand-sigla", children: "G&P" }), _jsx("span", { className: "brand-subtitle", children: "Gesto de Projetos" })] })), _jsx("span", { className: "sidebar-toggle-icon", children: isCollapsed ? "" : "" })] }) }), _jsxs("nav", { className: "sidebar-nav", children: [_jsx("div", { className: "sidebar-title" }), sidebarNavigation.map((item) => {
                                const Icon = item.icon;
                                const computedPath = item.id === "edt" && selectedOrganizationId && selectedProjectId
                                    ? `/EAP/organizacao/${selectedOrganizationId}/projeto/${selectedProjectId}`
                                    : item.path;
                                const link = (_jsxs(NavLink, { to: computedPath, className: ({ isActive }) => `sidebar-item ${isActive ? "sidebar-item--active" : ""}`, title: isCollapsed ? item.label : undefined, "aria-label": isCollapsed ? item.label : undefined, children: [_jsx("span", { className: "sidebar-item-icon", "aria-hidden": "true", children: _jsx(Icon, { width: 18, height: 18 }) }), _jsx("span", { className: "sidebar-item-label", children: item.label })] }, item.id));
                                return (_jsxs(Fragment, { children: [link, item.id === "atividades" ? _jsx("div", { className: "sidebar-divider" }) : null] }, item.id));
                            })] }), _jsx("div", { className: "sidebar-plan", children: _jsxs("p", { children: ["Plano Pro \u00B7 ", _jsx("strong", { children: "20/50" }), " projetos"] }) })] }), _jsxs("div", { className: "app-main", children: [_jsx("header", { className: "dashboard-topbar topbar", children: _jsxs("div", { className: "topbar-inner", children: [_jsx("div", { className: "topbar-left", children: _jsx("div", { className: "header-search-wrapper", children: _jsx("input", { className: "header-search-input", type: "search", placeholder: "Buscar projetos, tarefas, pessoas..." }) }) }), _jsx("div", { className: "topbar-center", children: _jsxs("div", { className: "header-context", children: [_jsxs("div", { className: "context-item", children: [_jsx("span", { className: "context-label", children: "Organiza\u00E7\u00E3o" }), _jsx("span", { className: "context-value", children: currentOrganization?.name ?? "Nenhuma selecionada" })] }), _jsxs("div", { className: "context-item", children: [_jsx("span", { className: "context-label", children: "Projeto atual" }), _jsxs("select", { className: "context-select", value: selectedProjectId || "", onChange: (event) => {
                                                            const newId = event.target.value;
                                                            if (newId) {
                                                                onSelectProject(newId);
                                                            }
                                                        }, disabled: !projects?.length, children: [!selectedProjectId && _jsx("option", { value: "", children: "Selecione um projeto" }), (projects || []).map((project) => (_jsx("option", { value: project.id, children: project.name }, project.id)))] }), !projects?.length && _jsx("small", { className: "muted", children: "Nenhum projeto cadastrado" })] })] }) }), _jsx("div", { className: "topbar-right", children: _jsxs("div", { className: "header-user", children: [_jsx("div", { className: "avatar", children: userEmail?.slice(0, 2).toUpperCase() }), _jsx("button", { type: "button", className: "logout-button", onClick: () => {
                                                    signOut();
                                                    navigate("/", { replace: true });
                                                }, children: "Sair" })] }) })] }) }), _jsx("main", { className: "app-content", children: _jsx("div", { className: "page-container", children: _jsx(Outlet, { context: outletContext }) }) }), isProjectModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: projectModalMode === "edit" ? "Editar projeto" : "Novo projeto" }), _jsx("h3", { children: projectModalMode === "edit" ? "Atualize as informções principais" : "Planeje um novo trabalho" }), _jsx("p", { className: "subtext", children: projectModalMode === "edit"
                                                        ? "Ajuste cliente, datas ou links principais do projeto selecionado."
                                                        : "Informe dados básicos para criarmos o projeto no portfólio." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseProjectModal, children: "Fechar" })] }), _jsxs("form", { className: "modal-form", onSubmit: handleProjectModalSubmit, children: [_jsxs("label", { children: ["Nome do projeto", _jsx("input", { type: "text", value: projectForm.name, onChange: (event) => handleProjectFieldChange("name", event.target.value), placeholder: "ImplementAo ERP 2025", required: true })] }), _jsxs("label", { children: ["Cliente / unidade", _jsx("input", { type: "text", value: projectForm.clientName, onChange: (event) => handleProjectFieldChange("clientName", event.target.value), placeholder: "Corp Holding", required: true })] }), _jsxs("label", { children: ["Or\u00E7amento aprovado (R$)", _jsx("input", { type: "number", min: "0", step: "1000", value: projectForm.budget, onChange: (event) => handleProjectFieldChange("budget", event.target.value), placeholder: "250000" })] }), _jsxs("label", { children: ["Reposit\u00F3rio GitHub", _jsx("input", { type: "url", value: projectForm.repositoryUrl, onChange: (event) => handleProjectFieldChange("repositoryUrl", event.target.value), placeholder: "https://github.com/org/projeto" })] }), _jsxs("div", { className: "modal-grid", children: [_jsxs("label", { children: ["Incio planejado", _jsx("input", { type: "date", value: projectForm.startDate, onChange: (event) => handleProjectFieldChange("startDate", event.target.value) })] }), _jsxs("label", { children: ["Conclus\u00E3o prevista", _jsx("input", { type: "date", value: projectForm.endDate, onChange: (event) => handleProjectFieldChange("endDate", event.target.value) })] })] }), _jsxs("label", { children: ["Equipe (e-mails separados por v\u00EDrgula)", _jsx("textarea", { value: projectForm.teamMembers, onChange: (event) => handleProjectFieldChange("teamMembers", event.target.value), placeholder: "ana@empresa.com, joao@empresa.com" })] }), _jsxs("label", { children: ["descri\u00E7\u00E3o", _jsx("textarea", { value: projectForm.description, onChange: (event) => handleProjectFieldChange("description", event.target.value), placeholder: "Objetivos, entregas e premissas iniciais..." })] }), projectModalError && _jsx("p", { className: "error-text", children: projectModalError }), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseProjectModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: projectModalLoading, children: projectModalLoading
                                                        ? "Enviando..."
                                                        : projectModalMode === "edit"
                                                            ? "Salvar alterações"
                                                            : "Criar projeto" })] })] })] }) })), isTaskModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Nova tarefa" }), _jsx("h3", { children: "Adicionar item ao quadro" }), _jsx("p", { className: "subtext", children: "Informe o t\u00EDtulo e escolha a coluna inicial." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Fechar" })] }), boardColumns.length ? (_jsxs("form", { className: "modal-form", onSubmit: handleTaskModalSubmit, children: [_jsxs("label", { children: ["t\u00EDtulo da tarefa", _jsx("input", { type: "text", value: newTaskTitle, onChange: (event) => onTaskTitleChange(event.target.value), placeholder: "Configurar ambiente, revisar contrato...", required: true })] }), _jsxs("label", { children: ["Coluna inicial", _jsx("select", { value: newTaskColumn, onChange: (event) => onTaskColumnChange(event.target.value), children: boardColumns.map((column) => (_jsx("option", { value: column.id, children: column.label }, column.id))) })] }), _jsxs("div", { className: "modal-grid", children: [_jsxs("label", { children: ["Incio planejado", _jsx("input", { type: "date", value: newTaskStartDate, onChange: (event) => onTaskStartDateChange(event.target.value) })] }), _jsxs("label", { children: ["Fim planejado", _jsx("input", { type: "date", value: newTaskEndDate, onChange: (event) => onTaskEndDateChange(event.target.value) })] })] }), _jsxs("label", { children: ["Respons\u00E1vel", _jsxs("select", { value: newTaskAssignee, onChange: (event) => onTaskAssigneeChange(event.target.value), children: [_jsx("option", { value: "", children: "Selecione..." }), members.map((member) => (_jsx("option", { value: member.userId ?? member.id, children: member.name ?? member.fullName ?? member.email }, member.id)))] })] }), _jsxs("label", { children: ["Horas estimadas", _jsx("input", { type: "number", min: "0", step: "0.5", value: newTaskEstimateHours, onChange: (event) => onTaskEstimateHoursChange(event.target.value), placeholder: "Ex.: 4" })] }), boardError && (_jsx("p", { className: "error-text", role: "status", children: boardError })), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: taskModalLoading || !newTaskTitle.trim(), children: taskModalLoading ? "Salvando..." : "Criar tarefa" })] })] })) : (_jsxs("div", { className: "modal-form", children: [_jsx("p", { className: "muted", children: "Este projeto ainda No possui colunas configuradas. Configure o quadro para criar tarefas." }), _jsx("footer", { className: "modal-actions", children: _jsx("button", { type: "button", className: "ghost-button", onClick: handleCloseTaskModal, children: "Fechar" }) })] }))] }) }))] })] }));
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
                { id: "field-risk", label: "Nvel de risco", type: "select" }
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
        setWbsDraft([createTreeNode("IniciAo")]);
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
            setTemplateModalError("O nome do template é obrigatório.");
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
                                                    }, children: "Editar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Duplicar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Excluir" })] })] }, template.id)))] }), _jsxs("aside", { className: "templates-editor", children: [_jsxs("header", { children: [_jsx("p", { className: "eyebrow", children: "Editor do template" }), _jsx("h3", { children: templateMeta.name }), _jsx("p", { className: "subtext", children: "Pre-visualize a EDT padrao, ajuste colunas do board e defina campos customizados para novos projetos." })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Previa da EDT" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddStage, children: "+ Adicionar etapa" })] }), _jsx("div", { className: "wbs-preview", children: renderWbsNodes(wbsDraft) })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Colunas do board" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddColumn, children: "+ Nova coluna" })] }), _jsx("ul", { className: "board-columns-editor", children: boardColumnsDraft.map((column, index) => (_jsxs("li", { children: [_jsx("input", { value: column, onChange: (event) => handleColumnChange(index, event.target.value) }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => handleRemoveColumn(index), children: "Remover" })] }, `${selectedTemplateId}-column-${column}-${index}`))) })] }), _jsxs("article", { className: "editor-card", children: [_jsxs("div", { className: "editor-card__header", children: [_jsx("h4", { children: "Campos customizados" }), _jsx("button", { type: "button", className: "ghost-button", onClick: handleAddField, children: "+ Novo campo" })] }), _jsx("div", { className: "custom-fields-editor", children: customFieldsDraft.map((field) => (_jsxs("div", { className: "custom-field-card", children: [_jsxs("label", { children: ["Nome", _jsx("input", { value: field.label, onChange: (event) => handleFieldChange(field.id, "label", event.target.value) })] }), _jsxs("label", { children: ["Tipo", _jsxs("select", { value: field.type, onChange: (event) => handleFieldChange(field.id, "type", event.target.value), children: [_jsx("option", { value: "text", children: "Texto" }), _jsx("option", { value: "number", children: "Numero" }), _jsx("option", { value: "date", children: "Data" }), _jsx("option", { value: "select", children: "Lista" })] })] }), _jsxs("label", { className: "settings-toggle", children: [_jsx("input", { type: "checkbox", checked: Boolean(field.required), onChange: (event) => handleFieldChange(field.id, "required", event.target.checked) }), _jsx("span", { children: "Obrigatorio" })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: () => handleRemoveField(field.id), children: "Remover" })] }, field.id))) })] })] })] }), templateModalOpen && (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal", children: [_jsxs("header", { className: "modal-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Editar template" }), _jsx("h3", { children: templateMeta.name }), _jsx("p", { className: "subtext", children: "Ajuste os metadados do template e sincronize com o backend para novos projetos." })] }), _jsx("button", { type: "button", className: "ghost-button", onClick: closeTemplateModal, children: "Fechar" })] }), _jsxs("form", { className: "modal-form", onSubmit: handleTemplateSubmit, children: [_jsxs("label", { children: ["Nome", _jsx("input", { type: "text", value: templateMeta.name, onChange: (event) => handleTemplateMetaChange("name", event.target.value), required: true })] }), _jsxs("label", { children: ["Categoria", _jsx("input", { type: "text", value: templateMeta.type, onChange: (event) => handleTemplateMetaChange("type", event.target.value), required: true })] }), _jsxs("label", { children: ["Cliente/\u00E1rea padr\u00E3o", _jsx("input", { type: "text", value: templateMeta.clientName, onChange: (event) => handleTemplateMetaChange("clientName", event.target.value), placeholder: "Ex.: Corp PMO" })] }), _jsxs("label", { children: ["Reposit\u00F3rio GitHub", _jsx("input", { type: "url", value: templateMeta.repositoryUrl, onChange: (event) => handleTemplateMetaChange("repositoryUrl", event.target.value), placeholder: "https://github.com/org/template" })] }), _jsxs("label", { children: ["Or\u00E7amento base (R$)", _jsx("input", { type: "number", min: "0", step: "1000", value: templateMeta.budget, onChange: (event) => handleTemplateMetaChange("budget", event.target.value), placeholder: "150000" })] }), _jsx("p", { className: "subtext", children: "Este envio inclui a estrutura da EDT, colunas do board e campos customizados configurados nesta tela." }), templateModalError && _jsx("p", { className: "error-text", children: templateModalError }), _jsxs("footer", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost-button", onClick: closeTemplateModal, children: "Cancelar" }), _jsx("button", { type: "submit", className: "primary-button", disabled: templateModalLoading, children: templateModalLoading ? "Salvando..." : "Salvar template" })] })] })] }) }))] }));
};
