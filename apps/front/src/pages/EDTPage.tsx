import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";
import ServiceCatalogModal from "../components/ServiceCatalogModal";
import { StatusSelect } from "../components/StatusSelect";
import { normalizeStatus, STATUS_ORDER, type Status } from "../utils/status";

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const WORKDAY_HOURS = 8;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  if (value.includes("/")) {
    const [d, m, y] = value.split("/");
    if (!d || !m || !y) return null;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const calcDurationInDays = (start?: string | null, end?: string | null): number => {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  const diff = Math.floor((e.getTime() - s.getTime()) / MS_IN_DAY) + 1;
  return diff > 0 ? diff : 0;
};

type WbsUpdate = {
  title?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  estimateHours?: number | null;
  dependencies?: string[];
  serviceCatalogId?: string | null;
  serviceMultiplier?: number | null;
  serviceHours?: number | null;
  durationInDays?: number | null;
};

console.log("[EAP] page mounted:", "EDTPage.tsx", new Date().toISOString());

const EDTPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    wbsNodes,
    wbsError,
    wbsLoading,
    onMoveNode,
    onUpdateWbsNode,
    onUpdateWbsResponsible,
    members,
    selectedNodeId,
    onSelectNode,
    onCreateWbsItem,
    projects,
    selectedProjectId,
    selectedOrganizationId,
    onReloadWbs,
    serviceCatalog,
    serviceCatalogError,
    onImportServiceCatalog,
    onCreateServiceCatalog,
    onUpdateServiceCatalog,
    onDeleteServiceCatalog,
  } = useOutletContext<DashboardOutletContext>();

  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [filterService, setFilterService] = useState<string>("ALL");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [filterOverdue, setFilterOverdue] = useState<"ALL" | "OVERDUE">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createStatus, setCreateStatus] = useState<Status>(STATUS_ORDER[0]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);

  const currentProject =
    projects?.find((project: any) => project.id === selectedProjectId) ?? null;

  const apiBaseUrl =
    (import.meta as any).env?.VITE_API_BASE_URL ??
    (import.meta as any).env?.VITE_API_URL ??
    "http://localhost:4000";

  const serviceCatalogOptions = useMemo(() => {
    const list = Array.isArray(serviceCatalog) ? serviceCatalog : [];
    return list;
  }, [serviceCatalog]);

  const flattenNodes = (nodes: any[] = []): any[] =>
    nodes.flatMap((n) => [n, ...(n.children ? flattenNodes(n.children) : [])]);

  const nodeById = useMemo(() => {
    const flat = flattenNodes(wbsNodes ?? []);
    return new Map(flat.map((node) => [node.id, node]));
  }, [wbsNodes]);

  const filteredNodes = useMemo(() => {
    const flat = flattenNodes(wbsNodes ?? []);
    const q = filterText.trim().toLowerCase();
    return flat.filter((node) => {
      if (node?.deletedAt) return false;
      const statusNorm = normalizeStatus(node.status);
      if (filterStatus !== "ALL" && statusNorm !== filterStatus) return false;
      if (filterService !== "ALL" && String(node.serviceCatalogId ?? "") !== filterService) return false;
      if (filterOwner !== "ALL") {
        const ownerId = node.ownerId ?? node.responsibleMembershipId ?? node.responsible?.membershipId;
        if (String(ownerId ?? "") !== filterOwner) return false;
      }
      if (filterOverdue === "OVERDUE") {
        const endDate = node.endDate ?? node.dueDate;
        if (!endDate) return false;
        const end = new Date(endDate);
        const now = new Date();
        end.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        if (!(end < now)) return false;
        if (statusNorm === "Finalizado") return false;
      }
      if (!q) return true;
      const code = String(node.wbsCode ?? node.code ?? node.id ?? "").toLowerCase();
      const title = String(node.title ?? "").toLowerCase();
      const owner = String(node.owner?.name ?? node.owner?.email ?? "").toLowerCase();
      return code.includes(q) || title.includes(q) || owner.includes(q);
    });
  }, [filterStatus, filterService, filterOwner, filterOverdue, filterText, wbsNodes]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createTitle.trim()) return;
    await onCreateWbsItem?.(null, { title: createTitle.trim(), status: createStatus });
    setIsCreateOpen(false);
    setCreateTitle("");
    setCreateStatus(STATUS_ORDER[0]);
    onReloadWbs?.();
  };

  const handleBulkUpdate = async (nodeId: string, changes: WbsUpdate) => {
    if (!onUpdateWbsNode) return;
    const selected = selectedIds.length > 0 && selectedIds.includes(nodeId);
    const bulkFields = ["status", "startDate", "endDate"];
    const hasBulkField = Object.keys(changes).some((key) => bulkFields.includes(key));
    if (!selected || !hasBulkField || selectedIds.length <= 1) {
      await onUpdateWbsNode(nodeId, changes);
      return;
    }

    const hasDateChange = "startDate" in changes || "endDate" in changes;
    const baseChanges: WbsUpdate = { ...changes };
    delete baseChanges.durationInDays;
    delete baseChanges.estimateHours;

    await Promise.all(
      selectedIds.map((id) => {
        if (!hasDateChange) {
          return onUpdateWbsNode(id, baseChanges);
        }
        const node = nodeById.get(id);
        const nextStart = "startDate" in baseChanges ? baseChanges.startDate ?? null : node?.startDate ?? null;
        const nextEnd = "endDate" in baseChanges ? baseChanges.endDate ?? null : node?.endDate ?? null;
        const duration = calcDurationInDays(nextStart, nextEnd);
        const updates: WbsUpdate = { ...baseChanges, durationInDays: duration };
        if (duration > 0) updates.estimateHours = duration * WORKDAY_HOURS;
        return onUpdateWbsNode(id, updates);
      })
    );

    onReloadWbs?.();
  };

  const handleBulkResponsible = async (nodeId: string, membershipId: string | null) => {
    if (!onUpdateWbsResponsible) return;
    const selected = selectedIds.length > 0 && selectedIds.includes(nodeId);
    const targetIds = selected ? selectedIds : [nodeId];
    await Promise.all(targetIds.map((id) => onUpdateWbsResponsible(id, membershipId)));
    if (targetIds.length > 1) {
      onReloadWbs?.();
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId) {
      setImportError("Selecione um projeto antes de exportar.");
      return;
    }
    try {
      setImportError(null);
      setImportFeedback(null);
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        format: "xlsx",
      });
      if (currentProject?.name) params.set("projectName", currentProject.name);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;
      const response = await fetch(`${apiBaseUrl}/wbs/export?${params.toString()}`, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao exportar (${response.status}). ${text || ""}`.trim());
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const safeName = (currentProject?.name ?? "projeto").replace(/[^a-z0-9-_]/gi, "_");
      link.href = URL.createObjectURL(blob);
      link.download = `EAP-${safeName}-${date}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setImportFeedback("Exportação concluída.");
    } catch (error: any) {
      setImportError(error?.message ?? "Erro ao exportar.");
    }
  };

  const handleImportClick = () => {
    setImportFeedback(null);
    setImportError(null);
    importInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportFeedback(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) {
      setImportError("Selecione um projeto antes de importar.");
      event.target.value = "";
      return;
    }
    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;
      const response = await fetch(`${apiBaseUrl}/wbs/import?projectId=${selectedProjectId}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao importar (${response.status}). ${text || ""}`.trim());
      }
      const data = await response.json().catch(() => ({}));
      const created = data?.created ?? 0;
      const updated = data?.updated ?? 0;
      const errors = data?.errors?.length ?? 0;
      setImportFeedback(`Importação concluída. Criados: ${created}. Atualizados: ${updated}. Erros: ${errors}.`);
      onReloadWbs?.();
    } catch (error: any) {
      setImportError(error?.message ?? "Erro ao importar.");
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const doFetchJson = async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = init?.headers ? { ...(init.headers as any) } : {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      ...init,
      headers,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json?.message || "Erro na requisição");
    }
    return json;
  };

  const loadTrash = async () => {
    if (!selectedProjectId) return;
    setTrashLoading(true);
    setTrashError(null);
    try {
      const data = await doFetchJson(`/wbs/trash?projectId=${selectedProjectId}`, { method: "GET" });
      setTrashItems(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err: any) {
      setTrashError(err?.message ?? "Erro ao carregar lixeira.");
    } finally {
      setTrashLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await doFetchJson(`/wbs/${id}/restore`, { method: "PATCH" });
      await loadTrash();
      onReloadWbs?.();
    } catch (err: any) {
      setTrashError(err?.message ?? "Erro ao restaurar tarefa.");
    }
  };

  const handleHardDelete = async (id: string, title: string) => {
    const ok = window.confirm(`Excluir definitivamente a tarefa "${title}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await doFetchJson(`/wbs/${id}`, { method: "DELETE" });
      await loadTrash();
      onReloadWbs?.();
    } catch (err: any) {
      setTrashError(err?.message ?? "Erro ao excluir tarefa.");
    }
  };

  const currentProjectName = currentProject?.name ?? "Selecionar";

  return (
    <section className="edt-page">
      <header className="page-header">
        <p className="eyebrow">EAP</p>
        <h1>Estrutura Analítica do Projeto</h1>
        <p className="subtext">
          Projeto atual: {currentProjectName}
          {wbsError ? ` — ${wbsError}` : ""}
        </p>
      </header>

            <div className="eap-toolbar2" style={{ marginBottom: 12 }}>
        <div className="eap-actions-left">
          <button className="eap-btn" onClick={() => setIsCreateOpen(true)}>
            + Nova tarefa
          </button>
          <button className="eap-btn" onClick={() => onReloadWbs?.()}>
            Recarregar
          </button>
          <div className="eap-divider" />
          <button className="eap-btn" onClick={handleExport}>
            Exportar
          </button>
          <button className="eap-btn" onClick={handleImportClick}>
            Importar
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button className="eap-btn" onClick={() => setCatalogOpen(true)}>
            Importar serviços
          </button>
          <button className="eap-btn eap-btn-danger" onClick={() => { setTrashOpen(true); loadTrash(); }}>
            Lixeira
          </button>
        </div>

        <div className="eap-actions-right no-grow" style={{ gap: 12 }}>
          <div className="eap-filters">
            <div className="eap-filter-field">
              <label>Status</label>
              <select
                className="eap-filter-select"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as Status | "ALL")}
              >
                <option value="ALL">Todos</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="eap-filter-field">
              <label>Catálogo</label>
              <select
                className="eap-filter-select"
                value={filterService}
                onChange={(event) => setFilterService(event.target.value)}
              >
                <option value="ALL">Todos</option>
                {serviceCatalogOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name ?? "Sem nome"}
                  </option>
                ))}
              </select>
            </div>
            <div className="eap-filter-field">
              <label>Responsável</label>
              <select
                className="eap-filter-select"
                value={filterOwner}
                onChange={(event) => setFilterOwner(event.target.value)}
              >
                <option value="ALL">Todos</option>
                {(members ?? []).map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.name ?? member.email ?? "Sem nome"}
                  </option>
                ))}
              </select>
            </div>
            <div className="eap-filter-field">
              <label>Em atraso</label>
              <select
                className="eap-filter-select is-small"
                value={filterOverdue}
                onChange={(event) => setFilterOverdue(event.target.value as "ALL" | "OVERDUE")}
              >
                <option value="ALL">Todos</option>
                <option value="OVERDUE">Em atraso</option>
              </select>
            </div>
          </div>
          <div className="eap-filter-field">
            <label>Tarefas</label>
            <div className="eap-search">
              <input
                className="eap-search-input compact"
                placeholder="Filtrar tarefas..."
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
              />
              {!!filterText && (
                <button
                  className="eap-search-clear"
                  onClick={() => setFilterText("")}
                  aria-label="Limpar filtro"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {importFeedback && <p className="gp-alert-success">{importFeedback}</p>}
      {importError && <p className="gp-alert-error">{importError}</p>}
      {wbsLoading && <p className="muted">Carregando EAP...</p>}

      {!wbsLoading && (
        <div className="edt-card">
          <div className="edt-scroll-wrapper">
            <WbsTreeView
              nodes={wbsNodes}
              loading={wbsLoading}
              error={wbsError}
              onCreate={(parentId) => onCreateWbsItem?.(parentId ?? null)}
              onMove={onMoveNode}
              onUpdate={handleBulkUpdate}
              onChangeResponsible={handleBulkResponsible}
              members={members}
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
              onOpenDetails={() => {}}
              serviceCatalog={serviceCatalogOptions}
              serviceCatalogError={serviceCatalogError}
              onSelectionChange={(ids: string[]) => setSelectedIds(ids)}
              selectedIds={selectedIds}
              clearSelectionKey={0}
              filterText={filterText}
              filterStatus={filterStatus === "ALL" ? undefined : filterStatus}
              filterService={filterService}
              filterOwner={filterOwner}
              filterOverdue={filterOverdue}
            />
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="gp-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="gp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="gp-modal-header">
              <h2>Nova tarefa</h2>
              <button
                type="button"
                className="gp-modal-close"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <form className="gp-modal-body new-project-form" onSubmit={handleCreate}>
              <div className="form-field">
                <label>Nome da tarefa *</label>
                <input
                  className="gp-input"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Status</label>
                <StatusSelect value={createStatus} onChange={(value) => setCreateStatus(value as Status)} />
              </div>
              <div className="gp-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={!createTitle.trim() || importLoading}>
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {catalogOpen && (
        <ServiceCatalogModal
          open={catalogOpen}
          services={serviceCatalogOptions}
          selectedCount={selectedIds.length}
          onClose={() => setCatalogOpen(false)}
          onImport={onImportServiceCatalog}
          onCreate={onCreateServiceCatalog}
          onUpdate={onUpdateServiceCatalog}
          onDelete={onDeleteServiceCatalog}
          onApply={async (svc) => {
            if (selectedIds.length === 0) {
              setImportError("Selecione ao menos 1 tarefa.");
              return;
            }
            try {
              setBulkApplying(true);
              const base = svc.hoursBase ?? svc.hours ?? null;
              await Promise.all(
                selectedIds.map((id) =>
                  onUpdateWbsNode?.(id, {
                    serviceCatalogId: svc.id,
                    serviceHours: base ?? undefined,
                  })
                )
              );
              setImportFeedback("Serviço aplicado nas tarefas selecionadas.");
              onReloadWbs?.();
            } finally {
              setBulkApplying(false);
            }
          }}
        />
      )}

      {trashOpen && (
        <div className="gp-modal-backdrop" onClick={() => setTrashOpen(false)}>
          <div className="gp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="gp-modal-header">
              <h2>Lixeira EAP</h2>
              <button type="button" className="gp-modal-close" onClick={() => setTrashOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="gp-modal-body">
              {console.log("[trash] modal render state", {
                loading: trashLoading,
                error: trashError,
                itemsCount: trashItems?.length,
              })}
              {trashError && <div className="gp-alert-error">{trashError}</div>}
              {trashLoading ? (
                <p className="muted">Carregando lixeira...</p>
              ) : trashItems.length === 0 ? (
                <p className="muted">Nenhuma tarefa na lixeira.</p>
              ) : (
                <div className="service-catalog-table-wrapper">
                  <table className="service-catalog-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>Status</th>
                        <th>Excluída em</th>
                        <th className="service-catalog-actions-col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.wbsCode ?? item.code ?? "-"}</td>
                          <td className="service-catalog-name-cell">{item.title ?? "-"}</td>
                          <td>{normalizeStatus(item.status)}</td>
                          <td>
                            {item.deletedAt
                              ? new Date(item.deletedAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="service-catalog-actions-cell">
                            <button
                              type="button"
                              className="btn-link-small"
                              onClick={() => handleRestore(item.id)}
                              disabled={trashLoading}
                            >
                              Restaurar
                            </button>
                            <button
                              type="button"
                              className="btn-danger-ghost"
                              onClick={() => handleHardDelete(item.id, item.title ?? "tarefa")}
                              disabled={trashLoading}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="gp-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setTrashOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EDTPage;
