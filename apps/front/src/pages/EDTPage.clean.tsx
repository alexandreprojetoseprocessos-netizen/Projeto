import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";
import { StatusSelect } from "../components/StatusSelect";
import { normalizeStatus, type Status } from "../utils/status";

console.log("[EAP] page mounted:", "EDTPage.clean.tsx", new Date().toISOString());

const EDTPage: React.FC = () => {
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
    onReloadWbs,
    serviceCatalog,
  } = useOutletContext<DashboardOutletContext>();

  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createStatus, setCreateStatus] = useState<Status>("Não iniciado");

  const filteredNodes = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return (wbsNodes ?? []).filter((node) => {
      const normalized = normalizeStatus(node.status);
      if (filterStatus !== "ALL" && normalized !== filterStatus) return false;
      if (!q) return true;
      const code = String(node.wbsCode ?? node.code ?? node.id ?? "").toLowerCase();
      const title = String(node.title ?? "").toLowerCase();
      const owner = String(node.owner?.name ?? node.owner?.email ?? "").toLowerCase();
      return code.includes(q) || title.includes(q) || owner.includes(q);
    });
  }, [filterStatus, filterText, wbsNodes]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createTitle.trim()) return;
    await onCreateWbsItem?.(null, { title: createTitle.trim(), status: createStatus });
    setIsCreateOpen(false);
    setCreateTitle("");
    setCreateStatus("Não iniciado");
    onReloadWbs?.();
  };

  const currentProjectName =
    projects?.find((project: any) => project.id === selectedProjectId)?.name ?? "Selecionar";

  return (
    <section className="edt-page">
      <header className="page-header">
        <p className="eyebrow">EAP</p>
        <h1>Estrutura Analítica do Projeto</h1>
        {projects?.length ? <p className="subtext">Projeto atual: {currentProjectName}</p> : null}
      </header>

      <div className="eap-toolbar2" style={{ marginBottom: 12 }}>
        <div className="eap-actions-left">
          <button className="eap-btn" onClick={() => setIsCreateOpen(true)}>
            + Nova tarefa
          </button>
          <button className="eap-btn" onClick={() => onReloadWbs?.()}>
            Recarregar
          </button>
          <button className="eap-btn" onClick={() => onReloadWbs?.()}>
            Exportar
          </button>
          <button className="eap-btn" onClick={() => onReloadWbs?.()}>
            Importar
          </button>
          <button className="eap-btn" onClick={() => onReloadWbs?.()}>
            Importar serviços
          </button>
          <button className="eap-btn eap-btn-danger" onClick={() => onReloadWbs?.()}>
            Lixeira
          </button>
        </div>

        <div className="eap-actions-right no-grow" style={{ gap: 12 }}>
          <div className="eap-filters">
            <div className="eap-filter-field">
              <label>Status</label>
              <StatusSelect
                className="eap-filter-select"
                value={filterStatus === "ALL" ? undefined : filterStatus}
                onChange={(value) => setFilterStatus(value as Status)}
              />
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

      {wbsError && <p className="error-text">{wbsError}</p>}
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
              onUpdate={onUpdateWbsNode}
              onChangeResponsible={onUpdateWbsResponsible}
              members={members}
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
              onOpenDetails={() => {}}
              serviceCatalog={serviceCatalog}
              onSelectionChange={() => {}}
              clearSelectionKey={0}
              filterText={filterText}
              filterStatus={filterStatus === "ALL" ? undefined : filterStatus}
              filterService="ALL"
              filterOwner="ALL"
              filterOverdue="ALL"
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
                <button type="submit" className="btn-primary" disabled={!createTitle.trim()}>
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default EDTPage;
