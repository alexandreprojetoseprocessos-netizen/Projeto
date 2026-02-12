import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { WbsTreeView } from "../components/DashboardLayout";
import { DependenciesDropdown } from "../components/DependenciesDropdown";
import { normalizeStatus, STATUS_ORDER } from "../utils/status";
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const WORKDAY_HOURS = 8;
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
export const ProjectEDTPage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectWbsNodes, projectWbsError, projectWbsLoading, onCreateProjectWbsItem, onUpdateProjectWbsItem, onDeleteProjectWbsItem, onRestoreProjectWbsItem, projectDependencyOptions, onUpdateProjectDependency, members, onUpdateWbsResponsible } = useOutletContext();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailsEditing, setDetailsEditing] = useState(false);
    const [detailsDraft, setDetailsDraft] = useState(null);
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    const getResponsibleId = (node) => {
        const raw = node?.responsibleMembershipId ?? node?.responsible?.membershipId ?? node?.ownerId ?? "";
        return raw ? String(raw) : "";
    };
    const buildDetailsDraft = (node) => ({
        title: node?.title ?? node?.name ?? "",
        description: node?.description ?? node?.descricao ?? "",
        status: normalizeStatus(node?.status),
        startDate: formatDateInputValue(node?.startDate ?? null),
        endDate: formatDateInputValue(node?.endDate ?? null),
        dependencies: Array.isArray(node?.dependencies) ? node.dependencies.map((dep) => String(dep)) : [],
        responsibleId: getResponsibleId(node),
    });
    const handleOpenDetails = (node) => {
        if (!node)
            return;
        setSelectedTask(node);
        setDetailsDraft(buildDetailsDraft(node));
        setDetailsEditing(false);
        setDetailsOpen(true);
    };
    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedTask(null);
        setDetailsEditing(false);
        setDetailsDraft(null);
    };
    const handleDetailsEdit = () => {
        if (!selectedTask)
            return;
        setDetailsDraft(buildDetailsDraft(selectedTask));
        setDetailsEditing(true);
    };
    const handleDetailsCancel = () => {
        if (selectedTask) {
            setDetailsDraft(buildDetailsDraft(selectedTask));
        }
        setDetailsEditing(false);
    };
    const handleDetailsSave = async () => {
        if (!selectedTask || !detailsDraft) {
            setDetailsEditing(false);
            return;
        }
        const updates = {};
        const trimmedTitle = detailsDraft.title.trim();
        const previousTitle = selectedTask.title ?? selectedTask.name ?? "";
        if (trimmedTitle && trimmedTitle !== previousTitle) {
            updates.title = trimmedTitle;
        }
        const previousStatus = normalizeStatus(selectedTask.status);
        if (detailsDraft.status && detailsDraft.status !== previousStatus) {
            updates.status = detailsDraft.status;
        }
        const previousStart = formatDateInputValue(selectedTask.startDate);
        const previousEnd = formatDateInputValue(selectedTask.endDate);
        if (detailsDraft.startDate !== previousStart) {
            updates.startDate = isoFromDateInput(detailsDraft.startDate);
        }
        if (detailsDraft.endDate !== previousEnd) {
            updates.endDate = isoFromDateInput(detailsDraft.endDate);
        }
        const normalizeDeps = (deps) => deps
            .map((dep) => String(dep))
            .filter(Boolean)
            .sort();
        const previousDeps = normalizeDeps(Array.isArray(selectedTask.dependencies) ? selectedTask.dependencies : []);
        const nextDeps = normalizeDeps(detailsDraft.dependencies ?? []);
        if (previousDeps.join(",") !== nextDeps.join(",")) {
            updates.dependencies = detailsDraft.dependencies ?? [];
        }
        const normalizeDescription = (value) => {
            const trimmed = String(value ?? "").trim();
            return trimmed ? trimmed : null;
        };
        const previousDescription = normalizeDescription(selectedTask.description ?? selectedTask.descricao ?? "");
        const nextDescription = normalizeDescription(detailsDraft.description);
        if (previousDescription !== nextDescription) {
            updates.description = nextDescription;
        }
        const previousResponsibleId = getResponsibleId(selectedTask);
        const responsibleChanged = detailsDraft.responsibleId !== previousResponsibleId;
        if (Object.keys(updates).length > 0) {
            await onUpdateProjectWbsItem?.(selectedTask.id, updates);
        }
        if (responsibleChanged) {
            await onUpdateWbsResponsible?.(selectedTask.id, detailsDraft.responsibleId || null);
        }
        const nextTask = { ...selectedTask };
        if (updates.title !== undefined)
            nextTask.title = updates.title;
        if (updates.status !== undefined)
            nextTask.status = updates.status;
        if ("startDate" in updates)
            nextTask.startDate = updates.startDate ?? null;
        if ("endDate" in updates)
            nextTask.endDate = updates.endDate ?? null;
        if ("dependencies" in updates)
            nextTask.dependencies = updates.dependencies ?? [];
        if ("description" in updates)
            nextTask.description = updates.description ?? null;
        if (responsibleChanged) {
            const member = (members ?? []).find((item) => String(item.id) === detailsDraft.responsibleId);
            nextTask.responsibleMembershipId = detailsDraft.responsibleId || null;
            nextTask.responsible = member
                ? {
                    membershipId: member.id,
                    userId: member.userId,
                    name: member.name ?? member.email ?? "Responsavel",
                }
                : null;
        }
        setSelectedTask(nextTask);
        setDetailsDraft(buildDetailsDraft(nextTask));
        setDetailsEditing(false);
    };
    const resolveDisplayCode = (node) => node?.code ?? node?.wbsCode ?? node?.idNumber ?? node?.codeValue ?? node?.id;
    const flattenNodes = (nodes = []) => nodes.flatMap((n) => [n, ...(n.children ? flattenNodes(n.children) : [])]);
    const flattenedNodes = useMemo(() => flattenNodes(projectWbsNodes ?? []), [projectWbsNodes]);
    const dependencyOptionsList = useMemo(() => {
        return flattenedNodes
            .filter((node) => node?.id && node.id !== selectedTask?.id)
            .map((node) => {
            const displayCode = resolveDisplayCode(node);
            return {
                id: String(node.id),
                name: node.title ?? node.name ?? "Tarefa sem nome",
                displayCode: displayCode ? String(displayCode) : String(node.id),
                wbsCode: node.wbsCode ?? node.code
            };
        });
    }, [flattenedNodes, selectedTask?.id]);
    const formatDependenciesLabel = (selectedIds) => {
        const selectedCodes = selectedIds
            .map((id) => dependencyOptionsList.find((opt) => opt.id === id)?.displayCode ?? id)
            .filter(Boolean);
        if (selectedCodes.length === 0) {
            return "Sem dependencias";
        }
        if (selectedCodes.length === 1) {
            return `Dep: ${selectedCodes[0]}`;
        }
        const firstTwo = selectedCodes.slice(0, 2).join(", ");
        const rest = selectedCodes.length - 2;
        return rest > 0 ? `Dep: ${firstTwo} +${rest}` : `Dep: ${firstTwo}`;
    };
    const formatDetailsDate = (value) => {
        if (!value)
            return "-";
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("pt-BR");
    };
    const detailsDurationLabel = (() => {
        if (!selectedTask)
            return "-";
        if (typeof selectedTask.durationInDays === "number" && selectedTask.durationInDays > 0) {
            return `${selectedTask.durationInDays}d`;
        }
        const start = selectedTask.startDate ? new Date(selectedTask.startDate) : null;
        const end = selectedTask.endDate ? new Date(selectedTask.endDate) : null;
        if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const diff = Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;
            if (diff > 0)
                return `${diff}d`;
        }
        const hours = Number(selectedTask.estimateHours ?? 0);
        if (Number.isFinite(hours) && hours > 0) {
            return `${Math.max(1, Math.round(hours / WORKDAY_HOURS))}d`;
        }
        return "-";
    })();
    const detailsOwnerLabel = selectedTask?.owner?.name ??
        selectedTask?.owner?.email ??
        selectedTask?.responsible?.name ??
        selectedTask?.responsible?.email ??
        "Sem responsavel";
    const detailsStatusLabel = selectedTask?.status ? normalizeStatus(selectedTask.status) : "Nao informado";
    const selectedDependencyIds = Array.isArray(selectedTask?.dependencies)
        ? selectedTask.dependencies.map((dep) => String(dep))
        : [];
    const detailsDependenciesLabel = formatDependenciesLabel(selectedDependencyIds);
    const currentDetailsTaskName = selectedTask?.title ?? selectedTask?.name ?? "";
    const currentDetailsTaskCode = selectedTask ? String(resolveDisplayCode(selectedTask) ?? selectedTask.id ?? "") : "";
    return (_jsxs("section", { className: "project-edt-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "EDT do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? "Projeto" })] }), _jsxs("div", { className: "edt-actions", children: [_jsx("button", { type: "button", className: "secondary-button", children: "Exportar" }), _jsx("button", { type: "button", className: "secondary-button", children: "Importar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Lixeira" })] })] }), _jsx("div", { className: "edt-card", children: _jsx("div", { className: "edt-scroll-wrapper", children: _jsx(WbsTreeView, { nodes: projectWbsNodes ?? [], loading: projectWbsLoading, error: projectWbsError ?? null, onCreate: onCreateProjectWbsItem ?? (() => { }), onUpdate: onUpdateProjectWbsItem ?? (() => { }), onDelete: onDeleteProjectWbsItem ?? (() => { }), onRestore: onRestoreProjectWbsItem, dependencyOptions: projectDependencyOptions, onUpdateDependency: onUpdateProjectDependency, onMove: () => { }, members: members ?? [], onChangeResponsible: onUpdateWbsResponsible, selectedNodeId: null, onSelect: () => { }, onOpenDetails: handleOpenDetails }) }) }), detailsOpen && selectedTask && (_jsx("div", { className: "gp-modal-backdrop", onClick: handleCloseDetails, children: _jsxs("div", { className: "gp-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "wbs-task-details-title", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header", children: [_jsx("h2", { id: "wbs-task-details-title", children: "Detalhes da tarefa" }), _jsx("button", { type: "button", className: "gp-modal-close", onClick: handleCloseDetails, "aria-label": "Fechar", children: "x" })] }), _jsxs("div", { className: "gp-modal-body wbs-details-grid", children: [_jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Nome" }), detailsEditing ? (_jsx("input", { className: "gp-input", value: detailsDraft?.title ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev)) })) : (_jsx("p", { className: "detail-value", children: selectedTask.title ?? selectedTask.name ?? "Tarefa sem nome" }))] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "ID / Nivel" }), _jsxs("p", { className: "detail-value", children: [(selectedTask.wbsCode ?? selectedTask.displayId ?? selectedTask.id ?? "-") + " - N", selectedTask.level ?? "-"] })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Situacao" }), detailsEditing ? (_jsx("select", { className: "gp-input", value: detailsDraft?.status ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, status: event.target.value } : prev)), children: STATUS_ORDER.map((status) => (_jsx("option", { value: status, children: status }, status))) })) : (_jsx("p", { className: "detail-value", children: detailsStatusLabel }))] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Responsavel" }), detailsEditing ? (_jsxs("select", { className: "gp-input", value: detailsDraft?.responsibleId ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, responsibleId: event.target.value } : prev)), children: [_jsx("option", { value: "", children: "Sem responsavel" }), (members ?? []).map((member) => (_jsx("option", { value: member.id, children: member.name ?? member.email ?? member.userId ?? "Responsavel" }, member.id)))] })) : (_jsx("p", { className: "detail-value", children: detailsOwnerLabel }))] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Duracao" }), _jsx("p", { className: "detail-value", children: detailsDurationLabel })] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Inicio / Termino" }), detailsEditing ? (_jsxs("div", { style: { display: "grid", gap: 8 }, children: [_jsx("input", { type: "date", className: "gp-input", value: detailsDraft?.startDate ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, startDate: event.target.value } : prev)) }), _jsx("input", { type: "date", className: "gp-input", value: detailsDraft?.endDate ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, endDate: event.target.value } : prev)) })] })) : (_jsxs("p", { className: "detail-value", children: [formatDetailsDate(selectedTask.startDate), " - ", formatDetailsDate(selectedTask.endDate)] }))] }), _jsxs("div", { children: [_jsx("p", { className: "detail-label", children: "Dependencias" }), detailsEditing ? (_jsx(DependenciesDropdown, { options: dependencyOptionsList, selectedIds: detailsDraft?.dependencies ?? [], onChange: (newSelected) => setDetailsDraft((prev) => (prev ? { ...prev, dependencies: newSelected } : prev)), currentTaskName: currentDetailsTaskName, currentTaskCode: currentDetailsTaskCode })) : (_jsx("p", { className: "detail-value", children: detailsDependenciesLabel }))] }), _jsxs("div", { className: "detail-span-2", children: [_jsx("p", { className: "detail-label", children: "Descricao" }), detailsEditing ? (_jsx("textarea", { className: "gp-input", rows: 4, value: detailsDraft?.description ?? "", onChange: (event) => setDetailsDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev)) })) : (_jsx("p", { className: "detail-value", children: selectedTask.description ?? "Sem descricao" }))] })] }), _jsx("div", { className: "gp-modal-footer", children: detailsEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleDetailsCancel, children: "Cancelar" }), _jsx("button", { type: "button", className: "btn-primary", onClick: handleDetailsSave, disabled: !detailsDraft?.title?.trim(), children: "Salvar" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleCloseDetails, children: "Fechar" }), _jsx("button", { type: "button", className: "btn-primary", onClick: handleDetailsEdit, children: "Editar" })] })) })] }) }))] }));
};
