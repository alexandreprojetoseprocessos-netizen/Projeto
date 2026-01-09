import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { WbsTreeView } from "../components/DashboardLayout";
import { DependenciesDropdown, type DependencyOption } from "../components/DependenciesDropdown";
import { normalizeStatus, STATUS_ORDER } from "../utils/status";

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const WORKDAY_HOURS = 8;

const formatDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

const isoFromDateInput = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

type DetailsDraft = {
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  dependencies: string[];
  responsibleId: string;
};

export const ProjectEDTPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedProject,
    selectedProjectId,
    onProjectChange,
    projectWbsNodes,
    projectWbsError,
    projectWbsLoading,
    onCreateProjectWbsItem,
    onUpdateProjectWbsItem,
    onDeleteProjectWbsItem,
    onRestoreProjectWbsItem,
    projectDependencyOptions,
    onUpdateProjectDependency,
    members,
    onUpdateWbsResponsible
  } = useOutletContext<DashboardOutletContext>();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailsEditing, setDetailsEditing] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft | null>(null);

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

  const getResponsibleId = (node: any) => {
    const raw = node?.responsibleMembershipId ?? node?.responsible?.membershipId ?? node?.ownerId ?? "";
    return raw ? String(raw) : "";
  };

  const buildDetailsDraft = (node: any): DetailsDraft => ({
    title: node?.title ?? node?.name ?? "",
    description: node?.description ?? node?.descricao ?? "",
    status: normalizeStatus(node?.status),
    startDate: formatDateInputValue(node?.startDate ?? null),
    endDate: formatDateInputValue(node?.endDate ?? null),
    dependencies: Array.isArray(node?.dependencies) ? node.dependencies.map((dep: any) => String(dep)) : [],
    responsibleId: getResponsibleId(node),
  });

  const handleOpenDetails = (node: any) => {
    if (!node) return;
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
    if (!selectedTask) return;
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

    const updates: Record<string, any> = {};
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

    const normalizeDeps = (deps: any[]) =>
      deps
        .map((dep) => String(dep))
        .filter(Boolean)
        .sort();
    const previousDeps = normalizeDeps(Array.isArray(selectedTask.dependencies) ? selectedTask.dependencies : []);
    const nextDeps = normalizeDeps(detailsDraft.dependencies ?? []);
    if (previousDeps.join(",") !== nextDeps.join(",")) {
      updates.dependencies = detailsDraft.dependencies ?? [];
    }

    const normalizeDescription = (value: any) => {
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
    if (updates.title !== undefined) nextTask.title = updates.title;
    if (updates.status !== undefined) nextTask.status = updates.status;
    if ("startDate" in updates) nextTask.startDate = updates.startDate ?? null;
    if ("endDate" in updates) nextTask.endDate = updates.endDate ?? null;
    if ("dependencies" in updates) nextTask.dependencies = updates.dependencies ?? [];
    if ("description" in updates) nextTask.description = updates.description ?? null;
    if (responsibleChanged) {
      const member = (members ?? []).find((item: any) => String(item.id) === detailsDraft.responsibleId);
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

  const resolveDisplayCode = (node: any) =>
    node?.code ?? node?.wbsCode ?? node?.idNumber ?? node?.codeValue ?? node?.id;

  const flattenNodes = (nodes: any[] = []): any[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flattenNodes(n.children) : [])]);

  const flattenedNodes = useMemo(() => flattenNodes(projectWbsNodes ?? []), [projectWbsNodes]);

  const dependencyOptionsList = useMemo<DependencyOption[]>(() => {
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

  const formatDependenciesLabel = (selectedIds: string[]) => {
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

  const formatDetailsDate = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("pt-BR");
  };
  const detailsDurationLabel = (() => {
    if (!selectedTask) return "-";
    if (typeof selectedTask.durationInDays === "number" && selectedTask.durationInDays > 0) {
      return `${selectedTask.durationInDays}d`;
    }
    const start = selectedTask.startDate ? new Date(selectedTask.startDate) : null;
    const end = selectedTask.endDate ? new Date(selectedTask.endDate) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diff = Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;
      if (diff > 0) return `${diff}d`;
    }
    const hours = Number(selectedTask.estimateHours ?? 0);
    if (Number.isFinite(hours) && hours > 0) {
      return `${Math.max(1, Math.round(hours / WORKDAY_HOURS))}d`;
    }
    return "-";
  })();
  const detailsOwnerLabel =
    selectedTask?.owner?.name ??
    selectedTask?.owner?.email ??
    selectedTask?.responsible?.name ??
    selectedTask?.responsible?.email ??
    "Sem responsavel";
  const detailsStatusLabel = selectedTask?.status ? normalizeStatus(selectedTask.status) : "Nao informado";
  const selectedDependencyIds = Array.isArray(selectedTask?.dependencies)
    ? selectedTask.dependencies.map((dep: any) => String(dep))
    : [];
  const detailsDependenciesLabel = formatDependenciesLabel(selectedDependencyIds);

  return (
    <section className="project-edt-page">
      <header className="page-header">
        <div>
          <h1>EDT do Projeto</h1>
          <p>{selectedProject?.projectName ?? selectedProject?.name ?? "Projeto"}</p>
        </div>
        <div className="edt-actions">
          <button type="button" className="secondary-button">
            Exportar
          </button>
          <button type="button" className="secondary-button">
            Importar
          </button>
          <button type="button" className="ghost-button">
            Lixeira
          </button>
        </div>
      </header>

      <div className="edt-card">
        <div className="edt-scroll-wrapper">
          <WbsTreeView
            nodes={projectWbsNodes ?? []}
            loading={projectWbsLoading}
            error={projectWbsError ?? null}
            onCreate={onCreateProjectWbsItem ?? (() => {})}
            onUpdate={onUpdateProjectWbsItem ?? (() => {})}
            onDelete={onDeleteProjectWbsItem ?? (() => {})}
            onRestore={onRestoreProjectWbsItem}
            dependencyOptions={projectDependencyOptions}
            onUpdateDependency={onUpdateProjectDependency}
            onMove={() => {}}
            members={members ?? []}
            onChangeResponsible={onUpdateWbsResponsible}
            selectedNodeId={null}
            onSelect={() => {}}
            onOpenDetails={handleOpenDetails}
          />
        </div>
      </div>
      {detailsOpen && selectedTask && (
        <div className="gp-modal-backdrop" onClick={handleCloseDetails}>
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wbs-task-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gp-modal-header">
              <h2 id="wbs-task-details-title">Detalhes da tarefa</h2>
              <button type="button" className="gp-modal-close" onClick={handleCloseDetails} aria-label="Fechar">
                x
              </button>
            </div>
            <div className="gp-modal-body wbs-details-grid">
              <div>
                <p className="detail-label">Nome</p>
                {detailsEditing ? (
                  <input
                    className="gp-input"
                    value={detailsDraft?.title ?? ""}
                    onChange={(event) =>
                      setDetailsDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                    }
                  />
                ) : (
                  <p className="detail-value">{selectedTask.title ?? selectedTask.name ?? "Tarefa sem nome"}</p>
                )}
              </div>
              <div>
                <p className="detail-label">ID / Nivel</p>
                <p className="detail-value">
                  {(selectedTask.wbsCode ?? selectedTask.displayId ?? selectedTask.id ?? "-") + " - N"}
                  {selectedTask.level ?? "-"}
                </p>
              </div>
              <div>
                <p className="detail-label">Situacao</p>
                {detailsEditing ? (
                  <select
                    className="gp-input"
                    value={detailsDraft?.status ?? ""}
                    onChange={(event) =>
                      setDetailsDraft((prev) => (prev ? { ...prev, status: event.target.value } : prev))
                    }
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="detail-value">{detailsStatusLabel}</p>
                )}
              </div>
              <div>
                <p className="detail-label">Responsavel</p>
                {detailsEditing ? (
                  <select
                    className="gp-input"
                    value={detailsDraft?.responsibleId ?? ""}
                    onChange={(event) =>
                      setDetailsDraft((prev) => (prev ? { ...prev, responsibleId: event.target.value } : prev))
                    }
                  >
                    <option value="">Sem responsavel</option>
                    {(members ?? []).map((member: any) => (
                      <option key={member.id} value={member.id}>
                        {member.name ?? member.email ?? member.userId ?? "Responsavel"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="detail-value">{detailsOwnerLabel}</p>
                )}
              </div>
              <div>
                <p className="detail-label">Duracao</p>
                <p className="detail-value">{detailsDurationLabel}</p>
              </div>
              <div>
                <p className="detail-label">Inicio / Termino</p>
                {detailsEditing ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      type="date"
                      className="gp-input"
                      value={detailsDraft?.startDate ?? ""}
                      onChange={(event) =>
                        setDetailsDraft((prev) => (prev ? { ...prev, startDate: event.target.value } : prev))
                      }
                    />
                    <input
                      type="date"
                      className="gp-input"
                      value={detailsDraft?.endDate ?? ""}
                      onChange={(event) =>
                        setDetailsDraft((prev) => (prev ? { ...prev, endDate: event.target.value } : prev))
                      }
                    />
                  </div>
                ) : (
                  <p className="detail-value">
                    {formatDetailsDate(selectedTask.startDate)} - {formatDetailsDate(selectedTask.endDate)}
                  </p>
                )}
              </div>
              <div>
                <p className="detail-label">Dependencias</p>
                {detailsEditing ? (
                  <DependenciesDropdown
                    options={dependencyOptionsList}
                    selectedIds={detailsDraft?.dependencies ?? []}
                    onChange={(newSelected) =>
                      setDetailsDraft((prev) => (prev ? { ...prev, dependencies: newSelected } : prev))
                    }
                  />
                ) : (
                  <p className="detail-value">{detailsDependenciesLabel}</p>
                )}
              </div>
              <div className="detail-span-2">
                <p className="detail-label">Descricao</p>
                {detailsEditing ? (
                  <textarea
                    className="gp-input"
                    rows={4}
                    value={detailsDraft?.description ?? ""}
                    onChange={(event) =>
                      setDetailsDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                    }
                  />
                ) : (
                  <p className="detail-value">{selectedTask.description ?? "Sem descricao"}</p>
                )}
              </div>
            </div>
            <div className="gp-modal-footer">
              {detailsEditing ? (
                <>
                  <button type="button" className="btn-secondary" onClick={handleDetailsCancel}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleDetailsSave}
                    disabled={!detailsDraft?.title?.trim()}
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={handleCloseDetails}>
                    Fechar
                  </button>
                  <button type="button" className="btn-primary" onClick={handleDetailsEdit}>
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
