import React, { useMemo, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";

export const EDTPage = () => {
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

  const currentProject = projects.find((project: any) => project.id === selectedProjectId) ?? null;

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [catalogActionError, setCatalogActionError] = useState<string | null>(null);
  const [catalogActionLoading, setCatalogActionLoading] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterService, setFilterService] = useState<string>("ALL");
  const [filterOwner, setFilterOwner] = useState<string>("ALL");
  const [filterOverdue, setFilterOverdue] = useState<"ALL" | "OVERDUE">("ALL");
  const [form, setForm] = useState({
    name: "",
    status: "BACKLOG",
    owner: "",
    description: "",
    duration: "",
    startDate: "",
    endDate: "",
    dependencies: "",
  });

  React.useEffect(() => {
    setSelectedIds([]);
    setClearSelectionKey((prev) => prev + 1);
  }, [wbsNodes]);

  const doFetchJson = async (path: string, init?: RequestInit) => {
    const headers: Record<string, string> = init?.headers ? { ...(init.headers as any) } : {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      ...init,
      headers
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json?.message || "Erro na requisicao");
    }
    return json;
  };

  const handleOpenDetails = (node: any) => {
    setSelectedTask(node);
    setDetailsOpen(true);
  };

  const statusLabel = (s?: string | null) => {
    const v = String(s ?? "").toUpperCase();
    if (["DONE", "FINISHED", "COMPLETED", "FINALIZADO"].includes(v)) return "Finalizado";
    if (["IN_PROGRESS", "EM_ANDAMENTO"].includes(v)) return "Em andamento";
    if (["NOT_STARTED", "NAO_INICIADO", "BACKLOG"].includes(v)) return "Não iniciado";
    if (["DELAYED", "EM_ATRASO"].includes(v)) return "Em atraso";
    if (["RISK", "EM_RISCO"].includes(v)) return "Em risco";
    return s ?? "-";
  };

  const formatDateBR = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  };

  const formatDependencies = (deps?: string[]) => {
    if (!deps?.length) return "Sem dependências";
    return deps
      .map((id) => {
        const n = wbsNodes?.find((x: any) => x.id === id);
        if (!n) return "Dependência desconhecida";
        const code = n.code ?? n.wbsCode ?? n.idNumber ?? n.displayId ?? "";
        const title = n.title ?? "";
        if (code && title) return `${code} - ${title}`;
        if (code) return code;
        return title || "Dependência desconhecida";
      })
      .join(", ");
  };

  const formatServiceName = (serviceId?: string | null) => {
    if (!serviceId) return "Sem serviço";
    const svc = serviceCatalog?.find((item: any) => item.id === serviceId);
    return svc?.name ?? "Sem serviço";
  };

  const formatServiceHours = (task: any) => {
    if (task?.serviceHours !== null && task?.serviceHours !== undefined) {
      const val = Number(task.serviceHours);
      if (!Number.isNaN(val)) {
        return `${Math.max(0, Math.round(val * 100) / 100)}h`;
      }
    }
    const svc = task?.serviceCatalogId
      ? serviceCatalog?.find((item: any) => item.id === task.serviceCatalogId)
      : null;
    if (svc) {
      const base = Number(svc.hoursBase ?? svc.hours ?? 0);
      const mult = task?.serviceMultiplier ?? 1;
      const val = base * mult;
      if (!Number.isNaN(val) && val !== 0) {
        return `${Math.max(0, Math.round(val * 100) / 100)}h`;
      }
    }
    return "—";
  };

  const displayTaskCode = selectedTask
    ? selectedTask.code ?? selectedTask.wbsCode ?? selectedTask.displayId ?? selectedTask.id
    : null;
  const displayTaskLevel = selectedTask?.level ?? 0;
  const displayTaskDuration = selectedTask?.estimateHours
    ? `${Math.max(0, Math.round((selectedTask.estimateHours / 8) * 10) / 10)}d`
    : "—";
  const displayStartDate = formatDateBR(selectedTask?.startDate);
  const displayEndDate = formatDateBR(selectedTask?.endDate);
  const displayServiceName = selectedTask ? formatServiceName(selectedTask.serviceCatalogId) : "Sem serviço";
  const displayServiceHours = selectedTask ? formatServiceHours(selectedTask) : "—";
  const displayMultiplier = selectedTask?.serviceMultiplier ?? "—";

  const handleExportWbs = async () => {
    if (!selectedProjectId) {
      setImportFeedback("Selecione um projeto para exportar a EAP.");
      return;
    }
    try {
      setImportFeedback(null);
      const url = `${apiBaseUrl}/wbs/export?projectId=${selectedProjectId}&format=xlsx&projectName=${encodeURIComponent(currentProject?.name ?? "projeto")}`;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;

      const response = await fetch(url, {
        credentials: "include",
        headers
      });
      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Falha ao exportar EAP");
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const safeName = (currentProject?.name ?? "projeto").replace(/[^a-z0-9-_]/gi, "_");
      link.href = URL.createObjectURL(blob);
      link.download = `EAP-${safeName}-${date}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setImportFeedback("Exporta??o conclu?da.");
    } catch (error: any) {
      setImportError(error?.message ?? "Erro ao exportar EAP.");
    }
  };

  const handleImportClick = () => {
    setImportFeedback(null);
    setImportError(null);
    importInputRef.current?.click();
  };

  const handleImportWbs = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportFeedback(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedProjectId) {
      setImportError("Selecione um projeto antes de importar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImportLoading(true);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (selectedOrganizationId) headers["x-organization-id"] = selectedOrganizationId;

      const response = await fetch(`${apiBaseUrl}/wbs/import?projectId=${selectedProjectId}`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message ?? "Erro ao importar EAP.");
      }
      const msg = `Importado: criados ${result.created ?? 0}, atualizados ${result.updated ?? 0}`;
      const errorMsg = result?.errors?.length ? ` | Erros: ${result.errors.length}` : "";
      setImportFeedback(msg + errorMsg);
      if (result?.errors?.length) {
        setImportError(result.errors.map((e: any) => `Linha ${e.row}: ${e.message}`).join("; "));
      }
      onReloadWbs?.();
    } catch (error: any) {
      setImportError(error?.message ?? "Erro ao importar EAP.");
    } finally {
      setImportLoading(false);
      event.target.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (!token || !selectedOrganizationId) return;
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`Mover ${selectedIds.length} tarefa(s) para a lixeira?`);
    if (!ok) return;
    try {
      setImportError(null);
      await doFetchJson(`/wbs/bulk-delete`, {
        method: "PATCH",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" }
      });
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
      onReloadWbs?.();
    } catch (err: any) {
      setImportError(err?.message ?? "Erro ao mover para a lixeira.");
    }
  };

  const loadTrash = async () => {
    if (!token || !selectedOrganizationId || !selectedProjectId) return;
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
    if (!token || !selectedOrganizationId) return;
    try {
      await doFetchJson(`/wbs/${id}/restore`, { method: "PATCH" });
      await loadTrash();
      onReloadWbs?.();
    } catch (err: any) {
      setTrashError(err?.message ?? "Erro ao restaurar.");
    }
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError("Informe o nome da tarefa.");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError("Término não pode ser anterior ao início.");
      return;
    }
    if (!onCreateWbsItem) {
      setFormError("Ação de criação não disponível.");
      return;
    }
    setCreatingTask(true);
    try {
      const durationDays = form.duration ? Number(form.duration) : null;
      await onCreateWbsItem(null, {
        title: form.name.trim(),
        status: form.status,
        description: form.description || undefined,
        durationDays: durationDays && !Number.isNaN(durationDays) ? durationDays : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      });
      setForm({
        name: "",
        status: "BACKLOG",
        owner: "",
        description: "",
        duration: "",
        startDate: "",
        endDate: "",
        dependencies: "",
      });
      setIsNewTaskOpen(false);
    } catch (error: any) {
      setFormError(error?.message ?? "Erro ao criar tarefa.");
    } finally {
      setCreatingTask(false);
    }
  };

  const sortedServiceCatalog = useMemo(
    () =>
      [...(serviceCatalog ?? [])].sort((a, b) =>
        (a?.name ?? "").localeCompare(b?.name ?? "", "pt-BR", { sensitivity: "base" })
      ),
    [serviceCatalog]
  );

  const handleAddManualService = async () => {
    if (!onCreateServiceCatalog && !onUpdateServiceCatalog) return;
    setCatalogActionError(null);
    const name = manualName.trim();
    const hoursValue = manualHours.trim();
    if (!name) return;
    const hoursBase = hoursValue ? Number(hoursValue) : 0;
    if (Number.isNaN(hoursBase) || hoursBase < 0) {
      setCatalogActionError("Horas base inválidas.");
      return;
    }

    setCatalogActionLoading(true);
    try {
      if (editingServiceId && onUpdateServiceCatalog) {
        await onUpdateServiceCatalog(editingServiceId, {
          name,
          hoursBase,
          description: manualDescription || null
        });
      } else if (onCreateServiceCatalog) {
        await onCreateServiceCatalog({
          name,
          hoursBase,
          description: manualDescription || null
        });
      }
      setManualName("");
      setManualHours("");
      setManualDescription("");
      setEditingServiceId(null);
    } catch (error) {
      setCatalogActionError((error as any)?.message ?? "Erro ao salvar serviço.");
    } finally {
      setCatalogActionLoading(false);
    }
  };

    const handleDeleteService = async (serviceId: string, name?: string) => {
    if (!onDeleteServiceCatalog) return;
    const confirmed = window.confirm(
      `Remover o serviço${name ? ` "${name}"` : ""}? Tarefas vinculadas ficarão sem serviço.`
    );
    if (!confirmed) return;
    setCatalogActionError(null);
    setCatalogActionLoading(true);
    try {
      await onDeleteServiceCatalog(serviceId);
      if (editingServiceId === serviceId) {
        setEditingServiceId(null);
        setManualName("");
        setManualHours("");
        setManualDescription("");
      }
    } catch (error) {
      setCatalogActionError((error as any)?.message ?? "Erro ao remover serviço.");
    } finally {
      setCatalogActionLoading(false);
    }
  };
if (!selectedProjectId) {
    return (
      <section className="page-container edt-page">
        <div className="workspace-empty-card" style={{ marginTop: "1rem" }}>
          <h2>Nenhum projeto selecionado</h2>
          <p>
            Para usar a EAP, selecione um projeto no topo da tela ou acesse a aba de projetos para escolher um.
          </p>
          <button type="button" className="primary-button" onClick={() => navigate("/projects")}>
            Ir para projetos
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container edt-page">
      <header className="page-header edt-header">
        <div>
          <p className="page-kicker">EAP</p>
          <h1 className="page-title">Estrutura Analítica do Projeto</h1>
          <p className="page-subtitle">
            Visualize e organize a árvore de tarefas, responsáveis e prazos do projeto atual.
          </p>
          {currentProject && (
            <p className="edt-current-project">
              Projeto atual: <strong>{currentProject.name}</strong>
            </p>
          )}
        </div>
      </header>

      <div className="eap-toolbar2">
        <div className="eap-actions-left">
          <button type="button" className="eap-btn" onClick={() => setIsNewTaskOpen(true)}>
            + Nova tarefa
          </button>
          <div className="eap-divider" />
          <button type="button" className="eap-btn" onClick={handleExportWbs}>
            Exportar
          </button>
          <button type="button" className="eap-btn" onClick={handleImportClick}>
            Importar
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            style={{ display: "none" }}
            onChange={handleImportWbs}
          />
          <button type="button" className="eap-btn" onClick={() => setImportOpen(true)}>
            Catálogo
          </button>
          <button
            type="button"
            className="eap-btn eap-btn-danger"
            onClick={() => {
              setTrashOpen(true);
              loadTrash();
            }}
            title="Lixeira"
          >
            🗑 Lixeira
          </button>
          {selectedIds.length > 0 && (
            <button type="button" className="eap-btn eap-btn-danger" onClick={handleBulkDelete}>
              Excluir {selectedIds.length} selecionada(s)
            </button>
          )}
        </div>

        <div className="eap-actions-right no-grow">
          <div className="eap-filters">
            <div className="eap-filter-field">
              <label>Status</label>
              <select
                className="eap-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="BACKLOG">Não iniciado</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="DONE">Finalizado</option>
                <option value="RISK">Em risco</option>
              </select>
            </div>

            <div className="eap-filter-field">
              <label>Catálogo</label>
              <select
                className="eap-filter-select"
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
              >
                <option value="ALL">Todos</option>
                {serviceCatalog?.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="eap-filter-field">
              <label>Responsável</label>
              <select
                className="eap-filter-select"
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
              >
                <option value="ALL">Todos</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email ?? "Membro"}
                  </option>
                ))}
              </select>
            </div>

            <div className="eap-filter-field">
              <label>Em atraso</label>
              <select
                className="eap-filter-select is-small"
                value={filterOverdue}
                onChange={(e) => setFilterOverdue(e.target.value as "ALL" | "OVERDUE")}
              >
                <option value="ALL">Todos</option>
                <option value="OVERDUE">Somente em atraso</option>
              </select>
            </div>
          </div>

          <div className="eap-filter-field">
            <label>Tarefas</label>
            <div className="eap-search">
              <span className="eap-search-icon">⌕</span>
              <input
                className="eap-search-input compact"
                placeholder="Filtrar tarefas..."
                title="Filtrar por ID, nome, responsável ou status"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              {!!filterText && (
                <button className="eap-search-clear" onClick={() => setFilterText("")} aria-label="Limpar filtro">
                  ×
                </button>
              )}
            </div>
          </div>
          <span className="eap-count">
            {/** filteredRows is computed inside WbsTreeView; showing quick counts from props */}
            {wbsNodes?.length ?? 0} itens
          </span>
        </div>
      </div>
      {importFeedback && <p className="muted" style={{ marginTop: 8 }}>{importFeedback}</p>}

      {wbsError && <p className="error-text">{wbsError}</p>}
      {wbsLoading ? <p className="muted">Carregando EAP...</p> : null}

      {(!wbsNodes || wbsNodes.length === 0) && !wbsLoading ? (
        <div className="workspace-empty-card" style={{ marginTop: "1rem" }}>
          <h3>Nenhum item cadastrado</h3>
          <p className="muted">
            Crie a primeira entrega ou tarefa para começar a estruturar a EAP. Você pode adicionar itens em qualquer
            nível e reordená-los depois.
          </p>
          <button type="button" className="primary-button" onClick={() => onCreateWbsItem?.(null)}>
            Criar nova tarefa
          </button>
        </div>
      ) : (
        <div className="edt-card">
          <div className="edt-scroll-wrapper">
            <WbsTreeView
              nodes={wbsNodes}
              loading={wbsLoading}
              error={wbsError}
              onCreate={(parentId) => onCreateWbsItem?.(parentId ?? null)}
              onMove={onMoveNode}
              onUpdate={onUpdateWbsNode}
              onChangeResponsible={onUpdateWbsResponsible}
              members={members}
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
              onOpenDetails={handleOpenDetails}
              serviceCatalog={serviceCatalog}
              onSelectionChange={setSelectedIds}
              clearSelectionKey={clearSelectionKey}
              filterText={filterText}
              filterStatus={filterStatus}
              filterService={filterService}
              filterOwner={filterOwner}
              filterOverdue={filterOverdue}
            />
          </div>
        </div>
      )}

      {isNewTaskOpen && (
        <div className="gp-modal-backdrop" onClick={() => !creatingTask && setIsNewTaskOpen(false)}>
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-wbs-task-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gp-modal-header">
              <h2 id="new-wbs-task-title">Nova tarefa</h2>
              <button
                type="button"
                className="gp-modal-close"
                onClick={() => setIsNewTaskOpen(false)}
                aria-label="Fechar"
                disabled={creatingTask}
              >
                ×
              </button>
            </div>
            <p className="gp-modal-subtitle">Preencha as informações básicas da entrega.</p>
            <form className="gp-modal-body new-project-form" onSubmit={handleCreateTask}>
              {formError && <div className="gp-alert-error">{formError}</div>}
              <div className="form-field">
                <label>Nome da tarefa *</label>
                <input
                  className="gp-input"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={creatingTask}
                  required
                />
              </div>
              <div className="form-field">
                <label>Situação</label>
                <select
                  className="gp-input"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  disabled={creatingTask}
                >
                  <option value="BACKLOG">Não iniciado</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="DONE">Concluído</option>
                  <option value="RISK">Em risco</option>
                </select>
              </div>
              <div className="form-field">
                <label>Responsável</label>
                <input
                  className="gp-input"
                  value={form.owner}
                  onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
                  disabled={creatingTask}
                  placeholder="Use a lista de responsáveis da tabela"
                />
              </div>
              <div className="form-field form-field-span-2">
                <label>Descrição</label>
                <textarea
                  className="gp-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={creatingTask}
                />
              </div>
              <div className="form-field">
                <label>Duração (dias)</label>
                <input
                  className="gp-input"
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
                  disabled={creatingTask}
                />
              </div>
              <div className="form-field">
                <label>Início</label>
                <input
                  className="gp-input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  disabled={creatingTask}
                />
              </div>
              <div className="form-field">
                <label>Término</label>
                <input
                  className="gp-input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  disabled={creatingTask}
                />
              </div>
              <div className="form-field">
                <label>Dependências</label>
                <input
                  className="gp-input"
                  value={form.dependencies}
                  onChange={(e) => setForm((prev) => ({ ...prev, dependencies: e.target.value }))}
                  disabled={creatingTask}
                  placeholder="IDs ou tarefas relacionadas"
                />
              </div>

              <div className="gp-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewTaskOpen(false)} disabled={creatingTask}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creatingTask}>
                  {creatingTask ? "Criando..." : "Criar tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="gp-modal-backdrop" onClick={() => !importLoading && setImportOpen(false)}>
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-service-catalog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gp-modal-header">
              <h2 id="import-service-catalog-title">Importar Catálogo de Serviços</h2>
              <button
                type="button"
                className="gp-modal-close"
                onClick={() => setImportOpen(false)}
                aria-label="Fechar"
                disabled={importLoading}
              >
                ×
              </button>
            </div>
                        <div className="gp-modal-body service-catalog-modal">
              {importError && <div className="gp-alert-error">{importError}</div>}
              {importSuccess && <div className="gp-alert-success">{importSuccess}</div>}
              {catalogActionError && <div className="gp-alert-error">{catalogActionError}</div>}

              {/* Bloco 1 – Importar arquivo */}
              <section className="service-catalog-section">
                <h3 className="service-catalog-section-title">Importar arquivo</h3>
                <p className="service-catalog-section-help">
                  Importe um arquivo Excel (.xlsx ou .xls) com a lista de serviços e horas base.
                  Os serviços existentes serão atualizados e novos serão adicionados.
                </p>
                <div className="service-catalog-file-field">
                  <label className="service-catalog-label">Arquivo (.xlsx ou .xls)</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    disabled={importLoading || catalogActionLoading}
                  />
                </div>
              </section>

              <hr className="service-catalog-divider" />

              {/* Bloco 2 – Adicionar serviço manualmente */}
              <section className="service-catalog-section">
                <h3 className="service-catalog-section-title">Adicionar serviço manualmente</h3>
                <div className="service-catalog-form">
                  <div className="service-catalog-form-field">
                    <label className="service-catalog-label">Nome do serviço</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Ex.: Consultoria, Treinamento..."
                      disabled={importLoading || catalogActionLoading}
                    />
                  </div>
                  <div className="service-catalog-form-field">
                    <label className="service-catalog-label">Horas base</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      placeholder="Ex.: 15"
                      disabled={importLoading || catalogActionLoading}
                    />
                  </div>
                  <div className="service-catalog-form-field service-catalog-form-field-wide">
                    <label className="service-catalog-label">Descrição (opcional)</label>
                    <input
                      type="text"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Detalhes do serviço, observações..."
                      disabled={importLoading || catalogActionLoading}
                    />
                  </div>
                  <div className="service-catalog-form-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={importLoading || catalogActionLoading || !manualName.trim()}
                      onClick={handleAddManualService}
                    >
                      Adicionar serviço
                    </button>
                  </div>
                </div>
              </section>

              <hr className="service-catalog-divider" />

              {/* Bloco 3 – Lista dos serviços cadastrados */}
              <section className="service-catalog-section">
                <div className="service-catalog-header-row">
                  <h3 className="service-catalog-section-title">Serviços cadastrados</h3>
                  <span className="service-catalog-count">
                    {sortedServiceCatalog.length} serviço(s)
                  </span>
                </div>

                {sortedServiceCatalog.length === 0 ? (
                  <p className="service-catalog-empty">
                    Nenhum serviço cadastrado ainda. Importe um arquivo ou adicione manualmente.
                  </p>
                ) : (
                  <div className="service-catalog-table-wrapper">
                    <table className="service-catalog-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Horas base</th>
                          <th>Descrição</th>
                          <th className="service-catalog-actions-col">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedServiceCatalog.map((service) => (
                          <tr key={service.id}>
                            <td className="service-catalog-name-cell">{service.name}</td>
                            <td className="service-catalog-hours-cell">
                              {service.hoursBase ?? service.hours ?? "-"}
                            </td>
                            <td className="service-catalog-description-cell">
                              {service.description || "-"}
                            </td>
                            <td className="service-catalog-actions-cell">
                              <button
                                type="button"
                                className="btn-link-small"
                                onClick={() => {
                                  setEditingServiceId(service.id);
                                  setManualName(service.name ?? "");
                                  const hours = service.hoursBase ?? service.hours ?? null;
                                  setManualHours(hours != null ? String(hours) : "");
                                  setManualDescription(service.description ?? "");
                                }}
                                disabled={importLoading || catalogActionLoading}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn-danger-ghost"
                                onClick={() => handleDeleteService(service.id)}
                                disabled={importLoading || catalogActionLoading}
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
              </section>
            </div>
            <div className="gp-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setImportOpen(false)}
                disabled={importLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!importFile || importLoading}
                onClick={async () => {
                  if (!onImportServiceCatalog || !importFile) return;
                  setImportError(null);
                  setImportSuccess(null);
                  setImportLoading(true);
                  try {
                    await onImportServiceCatalog(importFile);
                    setImportSuccess("Catálogo importado com sucesso.");
                    setImportFile(null);
                    setTimeout(() => setImportOpen(false), 800);
                  } catch (err: any) {
                    setImportError(err?.message ?? "Erro ao importar catálogo.");
                  } finally {
                    setImportLoading(false);
                  }
                }}
              >
                {importLoading ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsOpen && selectedTask && (
        <div className="gp-modal-backdrop" onClick={() => setDetailsOpen(false)}>
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wbs-task-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gp-modal-header">
              <h2 id="wbs-task-details-title">Detalhes da tarefa</h2>
              <button type="button" className="gp-modal-close" onClick={() => setDetailsOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="gp-modal-body wbs-details-grid">
              <div>
                <p className="detail-label">Nome</p>
                <p className="detail-value">{selectedTask.title ?? "Tarefa sem nome"}</p>
              </div>
              <div>
                <p className="detail-label">Código / Nível</p>
                <p className="detail-value">
                  {displayTaskCode ?? "-"} - N{displayTaskLevel}
                </p>
              </div>
              <div>
                <p className="detail-label">Situação</p>
                <p className="detail-value">{statusLabel(selectedTask.status)}</p>
              </div>
              <div>
                <p className="detail-label">Responsável</p>
                <p className="detail-value">
                  {selectedTask.owner?.name ?? selectedTask.owner?.email ?? "Sem responsável"}
                </p>
              </div>
              <div>
                <p className="detail-label">Início</p>
                <p className="detail-value">{displayStartDate}</p>
              </div>
              <div>
                <p className="detail-label">Término</p>
                <p className="detail-value">{displayEndDate}</p>
              </div>
              <div>
                <p className="detail-label">Duração</p>
                <p className="detail-value">{displayTaskDuration}</p>
              </div>
              <div>
                <p className="detail-label">Catálogo de Serviços</p>
                <p className="detail-value">{displayServiceName}</p>
              </div>
              <div>
                <p className="detail-label">Multiplicador</p>
                <p className="detail-value">{displayMultiplier ?? "—"}</p>
              </div>
              <div>
                <p className="detail-label">HR</p>
                <p className="detail-value">{displayServiceHours}</p>
              </div>
              <div className="detail-span-2">
                <p className="detail-label">Dependências</p>
                <p className="detail-value">{formatDependencies(selectedTask.dependencies)}</p>
              </div>
              <div className="detail-span-2">
                <p className="detail-label">Descrição</p>
                <p className="detail-value">
                  {selectedTask.description?.trim() ? selectedTask.description : "Sem descrição"}
                </p>
              </div>
            </div>
            <div className="gp-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setDetailsOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {trashOpen && (
        <div className="gp-modal-backdrop" onClick={() => setTrashOpen(false)}>
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trash-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gp-modal-header">
              <h2 id="trash-modal-title">Lixeira</h2>
              <button type="button" className="gp-modal-close" onClick={() => setTrashOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="gp-modal-body">
              {trashError && <div className="gp-alert-error">{trashError}</div>}
              {trashLoading ? (
                <p className="muted">Carregando lixeira...</p>
              ) : trashItems.length === 0 ? (
                <p className="muted">Nenhum item na lixeira.</p>
              ) : (
                <div className="service-catalog-table-wrapper">
                  <table className="service-catalog-table">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Nome</th>
                        <th>Excluido em</th>
                        <th className="service-catalog-actions-col">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.wbsCode ?? item.code ?? "-"}</td>
                          <td className="service-catalog-name-cell">{item.title ?? "-"}</td>
                          <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "-"}</td>
                          <td className="service-catalog-actions-cell">
                            <button
                              type="button"
                              className="btn-link-small"
                              onClick={() => handleRestore(item.id)}
                              disabled={trashLoading}
                            >
                              Restaurar
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
