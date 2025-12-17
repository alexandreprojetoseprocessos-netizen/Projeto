import React, { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_MAP, KANBAN_STATUS_ORDER, type TaskStatus } from "./KanbanBoard";
import { STATUS_ORDER, normalizeStatus } from "../utils/status";

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type TaskModalProps = {
  task: any;
  members?: Member[];
  onSave: (payload: Record<string, any>) => Promise<boolean>;
  onClose: () => void;
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
];

const KanbanTaskModal: React.FC<TaskModalProps> = ({
  task,
  members = [],
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "history">(
    "details"
  );
  const normalizedStatus = normalizeStatus(task?.status);
  const resolveStatus = (label: string): TaskStatus => {
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

  const [title, setTitle] = useState(task?.title ?? "");
  const [status, setStatus] = useState<TaskStatus>(resolveStatus(normalizedStatus));
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [responsibleId, setResponsibleId] = useState(
    task?.ownerId ??
      task?.responsibleMembershipId ??
      task?.responsibleId ??
      ""
  );
  const [startDate, setStartDate] = useState(
    task?.startDate ? task.startDate.slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    task?.endDate ? task.endDate.slice(0, 10) : task?.dueDate ? task.dueDate.slice(0, 10) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const code = useMemo(
    () => task?.wbsCode ?? task?.code ?? task?.id ?? "",
    [task]
  );

  const initialSnapshot = useMemo(
    () => ({
      title: task?.title ?? "",
      status: resolveStatus(normalizedStatus),
      description: task?.description ?? "",
      priority: task?.priority ?? "MEDIUM",
      responsibleId:
        task?.ownerId ??
        task?.responsibleMembershipId ??
        task?.responsibleId ??
        "",
      startDate: task?.startDate ? task.startDate.slice(0, 10) : "",
      endDate: task?.endDate
        ? task.endDate.slice(0, 10)
        : task?.dueDate
        ? task.dueDate.slice(0, 10)
        : "",
    }),
    [task, normalizedStatus, resolveStatus]
  );

  const isDirty =
    title !== initialSnapshot.title ||
    status !== initialSnapshot.status ||
    description !== initialSnapshot.description ||
    priority !== initialSnapshot.priority ||
    responsibleId !== initialSnapshot.responsibleId ||
    startDate !== initialSnapshot.startDate ||
    endDate !== initialSnapshot.endDate;

  const handleCloseRequest = () => {
    if (isSaving) return;
    if (!isDirty || window.confirm("Descartar alterações?")) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseRequest();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isDirty, isSaving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);
    const payload: Record<string, any> = {
      title,
      description,
      status,
    };
    if (priority) payload.priority = priority;
    if (startDate) payload.startDate = startDate;
    if (endDate) payload.endDate = endDate;
    if (responsibleId) {
      payload.responsibleMembershipId = responsibleId;
      payload.ownerId = responsibleId;
    }

    const ok = await onSave(payload);
    if (ok) {
      setIsSaving(false);
      onClose();
    } else {
      setIsSaving(false);
      setErrorMsg("Não foi possível salvar. Tente novamente.");
    }
  };

  return (
    <div className="gp-modal-backdrop" onClick={handleCloseRequest}>
      <div
        className="kanban-task-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="kanban-task-modal__header">
          <input
            className="kanban-task-modal__title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da tarefa"
            disabled={isSaving}
          />
          <div className="kanban-task-modal__header-right">
            <span className="kanban-task-modal__code">{code}</span>
            <button
              type="button"
              className="kanban-task-modal__close"
              onClick={handleCloseRequest}
              aria-label="Fechar"
              disabled={isSaving}
            >
              ×
            </button>
          </div>
        </div>

        <div className="kanban-task-modal__tabs">
          <button
            className={activeTab === "details" ? "is-active" : ""}
            onClick={() => setActiveTab("details")}
            disabled={isSaving}
          >
            Detalhes
          </button>
          <button
            className={activeTab === "comments" ? "is-active" : ""}
            onClick={() => setActiveTab("comments")}
            disabled={isSaving}
          >
            Comentários
          </button>
          <button
            className={activeTab === "history" ? "is-active" : ""}
            onClick={() => setActiveTab("history")}
            disabled={isSaving}
          >
            Histórico
          </button>
        </div>

        {activeTab === "details" && (
          <form className="kanban-task-modal__body" onSubmit={handleSubmit}>
            <div className="kanban-task-modal__columns">
              <div className="kanban-task-modal__main">
                <label className="kanban-task-modal__full">
                  <span>Nome da tarefa</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isSaving}
                  />
                </label>

                <label className="kanban-task-modal__full">
                  <span>Descrição</span>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhe a tarefa..."
                    disabled={isSaving}
                  />
                </label>

                {errorMsg && (
                  <div className="kanban-task-modal__error">{errorMsg}</div>
                )}
              </div>

              <div className="kanban-task-modal__sidebar">
                <div className="kanban-task-modal__section">
                  <span className="kanban-task-modal__label">Código EAP</span>
                  <input type="text" value={code} readOnly />
                </div>
                <div className="kanban-task-modal__section">
                  <span className="kanban-task-modal__label">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    disabled={isSaving}
                  >
                    {STATUS_ORDER.map((label) => (
                      <option key={label} value={resolveStatus(label)}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="kanban-task-modal__section">
                  <span className="kanban-task-modal__label">Responsável</span>
                  <select
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    disabled={isSaving || members.length === 0}
                  >
                    {members.length === 0 ? (
                      <option value="">Sem responsáveis disponíveis</option>
                    ) : (
                      <>
                        <option value="">Sem responsável</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name ?? m.email ?? "Membro"}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                {("priority" in task || task?.priority !== undefined) && (
                  <div className="kanban-task-modal__section">
                    <span className="kanban-task-modal__label">Prioridade</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      disabled={isSaving}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {("startDate" in task || task?.startDate !== undefined) && (
                  <div className="kanban-task-modal__section">
                    <span className="kanban-task-modal__label">Início</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                )}
                {(
                  "endDate" in task ||
                  "dueDate" in task ||
                  task?.endDate !== undefined ||
                  task?.dueDate !== undefined
                ) && (
                  <div className="kanban-task-modal__section">
                    <span className="kanban-task-modal__label">Término</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="kanban-task-modal__footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseRequest}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "comments" && (
          <div className="kanban-task-modal__body placeholder">
            <p>Comentários em breve.</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="kanban-task-modal__body placeholder">
            <p>Histórico em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanTaskModal;
