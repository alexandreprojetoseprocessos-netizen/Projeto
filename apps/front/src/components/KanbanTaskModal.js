import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_ORDER, normalizeStatus } from "../utils/status";
const PRIORITY_OPTIONS = [
    { value: "LOW", label: "Baixa" },
    { value: "MEDIUM", label: "Média" },
    { value: "HIGH", label: "Alta" },
];
const KanbanTaskModal = ({ task, members = [], onSave, onClose, selectedNodeId = null, comments = [], commentsError = null, onSubmitComment, commentBody = "", onCommentBodyChange, timeEntryDate = "", timeEntryHours = "", timeEntryDescription = "", timeEntryError = null, onTimeEntryDateChange, onTimeEntryHoursChange, onTimeEntryDescriptionChange, onLogTime, }) => {
    const [activeTab, setActiveTab] = useState("details");
    const normalizedStatus = normalizeStatus(task?.status);
    const resolveStatus = (label) => {
        const n = normalizeStatus(label);
        switch (n) {
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
    };
    const resolveDescription = (value) => value?.description ?? value?.descricao ?? value?.details ?? value?.notes ?? "";
    const resolveResponsibleId = (value) => value?.ownerId ?? value?.responsibleMembershipId ?? value?.responsibleId ?? "";
    const sliceDate = (value) => typeof value === "string" ? value.slice(0, 10) : "";
    const resolveStartDate = (value) => sliceDate(value?.startDate ?? value?.startAt ?? value?.start ?? "");
    const resolveEndDate = (value) => sliceDate(value?.endDate ?? value?.dueDate ?? value?.endAt ?? value?.end ?? "");
    const initialDescription = resolveDescription(task);
    const initialStatus = resolveStatus(normalizedStatus);
    const initialResponsibleId = resolveResponsibleId(task);
    const initialStartDate = resolveStartDate(task);
    const initialEndDate = resolveEndDate(task);
    const [title, setTitle] = useState(task?.title ?? "");
    const [status, setStatus] = useState(initialStatus);
    const [description, setDescription] = useState(initialDescription);
    const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
    const [responsibleId, setResponsibleId] = useState(initialResponsibleId);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const titleRef = useRef(null);
    useEffect(() => {
        if (activeTab === "details") {
            titleRef.current?.focus();
        }
    }, [activeTab, task?.id]);
    useEffect(() => {
        setActiveTab("details");
        setTitle(task?.title ?? "");
        setStatus(resolveStatus(normalizeStatus(task?.status)));
        setDescription(resolveDescription(task));
        setPriority(task?.priority ?? "MEDIUM");
        setResponsibleId(resolveResponsibleId(task));
        setStartDate(resolveStartDate(task));
        setEndDate(resolveEndDate(task));
        setIsSaving(false);
        setErrorMsg(null);
    }, [task?.id]);
    const code = useMemo(() => task?.wbsCode ?? task?.code ?? task?.id ?? "", [task]);
    const initialSnapshot = useMemo(() => ({
        title: task?.title ?? "",
        status: resolveStatus(normalizedStatus),
        description: resolveDescription(task),
        priority: task?.priority ?? "MEDIUM",
        responsibleId: resolveResponsibleId(task),
        startDate: resolveStartDate(task),
        endDate: resolveEndDate(task),
    }), [task, normalizedStatus, resolveStatus]);
    const isDirty = title !== initialSnapshot.title ||
        status !== initialSnapshot.status ||
        description !== initialSnapshot.description ||
        priority !== initialSnapshot.priority ||
        responsibleId !== initialSnapshot.responsibleId ||
        startDate !== initialSnapshot.startDate ||
        endDate !== initialSnapshot.endDate;
    const activeNodeId = selectedNodeId ?? task?.id ?? null;
    const commentItems = useMemo(() => {
        if (Array.isArray(comments))
            return comments;
        const nested = comments?.comments;
        return Array.isArray(nested) ? nested : [];
    }, [comments]);
    const formatCommentDate = (value) => {
        if (!value)
            return "";
        try {
            return new Date(value).toLocaleString("pt-BR");
        }
        catch {
            return "";
        }
    };
    const resolveCommentAuthor = (comment) => comment?.author?.name ??
        comment?.authorName ??
        comment?.author?.email ??
        "Colaborador";
    const resolveCommentBody = (comment) => comment?.body ?? comment?.message ?? "";
    const handleSubmitComment = (event) => {
        event.preventDefault();
        onSubmitComment?.(event);
    };
    const handleLogTime = (event) => {
        event.preventDefault();
        onLogTime?.(event);
    };
    const canSubmitComment = Boolean(activeNodeId) &&
        Boolean(onSubmitComment) &&
        commentBody.trim().length > 0;
    const canLogTime = Boolean(activeNodeId) &&
        Boolean(onLogTime) &&
        Boolean(timeEntryDate) &&
        Boolean(timeEntryHours);
    const handleCloseRequest = () => {
        if (isSaving)
            return;
        if (!isDirty || window.confirm("Descartar alterações?")) {
            onClose();
        }
    };
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                handleCloseRequest();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isDirty, isSaving]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving)
            return;
        setIsSaving(true);
        setErrorMsg(null);
        const payload = {
            title,
            description,
            descricao: description,
            status,
        };
        if (priority)
            payload.priority = priority;
        if (startDate)
            payload.startDate = startDate;
        if (endDate)
            payload.endDate = endDate;
        if (responsibleId) {
            payload.responsibleMembershipId = responsibleId;
            payload.ownerId = responsibleId;
        }
        const ok = await onSave(payload);
        if (ok) {
            setIsSaving(false);
            onClose();
        }
        else {
            setIsSaving(false);
            setErrorMsg("Não foi possível salvar. Tente novamente.");
        }
    };
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: handleCloseRequest, children: _jsxs("div", { className: "kanban-task-modal", role: "dialog", "aria-modal": "true", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "kanban-task-modal__header", children: [_jsx("div", { className: "kanban-task-modal__header-left", children: _jsx("div", { className: "kanban-task-modal__header-title", children: "Detalhes da tarefa" }) }), _jsxs("div", { className: "kanban-task-modal__header-right", children: [_jsx("span", { className: "kanban-task-modal__code", children: code }), _jsx("button", { type: "button", className: "kanban-task-modal__close", onClick: handleCloseRequest, "aria-label": "Fechar", disabled: isSaving, children: "x" })] })] }), _jsxs("div", { className: "kanban-task-modal__tabs", children: [_jsx("button", { className: activeTab === "details" ? "is-active" : "", onClick: () => setActiveTab("details"), disabled: isSaving, children: "Detalhes" }), _jsx("button", { className: activeTab === "comments" ? "is-active" : "", onClick: () => setActiveTab("comments"), disabled: isSaving, children: "Coment\u00E1rios" }), _jsx("button", { className: activeTab === "history" ? "is-active" : "", onClick: () => setActiveTab("history"), disabled: isSaving, children: "Hist\u00F3rico" })] }), activeTab === "details" && (_jsxs("form", { className: "kanban-task-modal__body", onSubmit: handleSubmit, children: [_jsxs("div", { className: "kanban-task-modal__columns", children: [_jsxs("div", { className: "kanban-task-modal__main", children: [_jsxs("label", { className: "kanban-task-modal__full", children: [_jsx("span", { children: "Nome da tarefa" }), _jsx("input", { type: "text", className: "kanban-task-modal__title-input", ref: titleRef, value: title, onChange: (e) => setTitle(e.target.value), required: true, autoFocus: true, disabled: isSaving })] }), _jsxs("label", { className: "kanban-task-modal__full", children: [_jsx("span", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { rows: 6, value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Detalhe a tarefa...", disabled: isSaving })] }), errorMsg && (_jsx("div", { className: "kanban-task-modal__error", children: errorMsg }))] }), _jsxs("div", { className: "kanban-task-modal__sidebar", children: [_jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "C\u00F3digo EAP" }), _jsx("input", { type: "text", value: code, readOnly: true })] }), _jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "Status" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), disabled: isSaving, children: STATUS_ORDER.map((label) => (_jsx("option", { value: resolveStatus(label), children: label }, label))) })] }), _jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "Respons\u00E1vel" }), _jsx("select", { value: responsibleId, onChange: (e) => setResponsibleId(e.target.value), disabled: isSaving || members.length === 0, children: members.length === 0 ? (_jsx("option", { value: "", children: "Sem respons\u00E1veis dispon\u00EDveis" })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "", children: "Sem respons\u00E1vel" }), members.map((m) => (_jsx("option", { value: m.id, children: m.name ?? m.email ?? "Membro" }, m.id)))] })) })] }), ("priority" in task || task?.priority !== undefined) && (_jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "Prioridade" }), _jsx("select", { value: priority, onChange: (e) => setPriority(e.target.value), disabled: isSaving, children: PRIORITY_OPTIONS.map((p) => (_jsx("option", { value: p.value, children: p.label }, p.value))) })] })), ("startDate" in task || task?.startDate !== undefined) && (_jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "In\u00EDcio" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), disabled: isSaving })] })), ("endDate" in task ||
                                            "dueDate" in task ||
                                            task?.endDate !== undefined ||
                                            task?.dueDate !== undefined) && (_jsxs("div", { className: "kanban-task-modal__section", children: [_jsx("span", { className: "kanban-task-modal__label", children: "T\u00E9rmino" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), disabled: isSaving })] }))] })] }), _jsxs("div", { className: "kanban-task-modal__footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleCloseRequest, disabled: isSaving, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: isSaving, children: isSaving ? "Salvando..." : "Salvar alterações" })] })] })), activeTab === "comments" && (_jsx("div", { className: "kanban-task-modal__body", children: _jsxs("div", { className: "wbs-chat-body", children: [_jsxs("div", { className: "wbs-chat-messages", children: [commentItems.length > 0 ? (commentItems.map((comment, index) => (_jsxs("div", { className: "wbs-chat-message", children: [_jsxs("div", { className: "wbs-chat-message__meta", children: [_jsx("strong", { children: resolveCommentAuthor(comment) }), _jsx("span", { children: formatCommentDate(comment?.createdAt ?? comment?.created_at) })] }), _jsx("p", { children: resolveCommentBody(comment) })] }, comment?.id ?? `${comment?.createdAt ?? "comment"}-${index}`)))) : (_jsx("p", { className: "muted", children: "Nenhum coment\u00E1rio ainda." })), commentsError && _jsx("p", { className: "error-text", children: commentsError })] }), _jsxs("form", { className: "wbs-chat-composer", onSubmit: handleSubmitComment, children: [!activeNodeId && (_jsx("p", { className: "muted", children: "Selecione uma tarefa para comentar." })), _jsx("textarea", { value: commentBody, onChange: (event) => onCommentBodyChange?.(event.target.value), placeholder: "Escreva um coment\u00E1rio...", rows: 3, disabled: isSaving || !onSubmitComment }), _jsxs("div", { className: "wbs-chat-actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleCloseRequest, disabled: isSaving, children: "Fechar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: !canSubmitComment || isSaving, children: "Enviar" })] })] })] }) })), activeTab === "history" && (_jsx("div", { className: "kanban-task-modal__body", children: _jsxs("form", { className: "kanban-task-modal__history-form", onSubmit: handleLogTime, children: [!activeNodeId && (_jsx("p", { className: "muted", children: "Selecione uma tarefa antes de registrar." })), _jsxs("div", { className: "kanban-task-modal__history-grid", children: [_jsxs("label", { className: "kanban-task-modal__history-field", children: [_jsx("span", { children: "Data" }), _jsx("input", { type: "date", value: timeEntryDate, onChange: (event) => onTimeEntryDateChange?.(event.target.value), disabled: isSaving || !onLogTime })] }), _jsxs("label", { className: "kanban-task-modal__history-field", children: [_jsx("span", { children: "Horas" }), _jsx("input", { type: "number", min: "0.25", step: "0.25", value: timeEntryHours, onChange: (event) => onTimeEntryHoursChange?.(event.target.value), disabled: isSaving || !onLogTime })] })] }), _jsxs("label", { className: "kanban-task-modal__history-field", children: [_jsx("span", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { value: timeEntryDescription, onChange: (event) => onTimeEntryDescriptionChange?.(event.target.value), disabled: isSaving || !onLogTime })] }), timeEntryError && (_jsx("div", { className: "kanban-task-modal__error", role: "status", children: timeEntryError })), _jsxs("div", { className: "kanban-task-modal__footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: handleCloseRequest, disabled: isSaving, children: "Cancelar" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: !canLogTime || isSaving, children: "Registrar horas" })] })] }) }))] }) }));
};
export default KanbanTaskModal;
