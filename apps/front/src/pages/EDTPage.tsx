import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";

export const EDTPage = () => {
  const navigate = useNavigate();
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
    serviceCatalog,
    serviceCatalogError,
    onImportServiceCatalog,
    onCreateServiceCatalog,
    onDeleteServiceCatalog,
  } = useOutletContext<DashboardOutletContext>();

  const currentProject = projects.find((project: any) => project.id === selectedProjectId) ?? null;

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
  const [catalogName, setCatalogName] = useState("");
  const [catalogHours, setCatalogHours] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [catalogActionError, setCatalogActionError] = useState<string | null>(null);
  const [catalogActionLoading, setCatalogActionLoading] = useState(false);
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

  const handleOpenDetails = (node: any) => {
    setSelectedTask(node);
    setDetailsOpen(true);
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
      // Reutiliza o handler existente de criação. Hoje cria no nível raiz; campo de pai/dependências pode ser ligado depois.
      await onCreateWbsItem(null);
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

  const handleManualServiceCreate = async () => {
    if (!onCreateServiceCatalog) return;
    setCatalogActionError(null);
    const name = catalogName.trim();
    const hoursNumber = Number(catalogHours);

    if (!name) {
      setCatalogActionError("Informe o nome do serviço.");
      return;
    }
    if (Number.isNaN(hoursNumber) || hoursNumber < 0) {
      setCatalogActionError("Horas base inválidas.");
      return;
    }

    setCatalogActionLoading(true);
    try {
      await onCreateServiceCatalog({
        name,
        hoursBase: hoursNumber,
        description: catalogDescription.trim() || null
      });
      setCatalogName("");
      setCatalogHours("");
      setCatalogDescription("");
    } catch (error: any) {
      setCatalogActionError(error?.message ?? "Erro ao adicionar serviço.");
    } finally {
      setCatalogActionLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string, name?: string) => {
    if (!onDeleteServiceCatalog) return;
    const confirmed = window.confirm(
      `Remover o serviço${name ? ` \"${name}\"` : ""}? Tarefas vinculadas ficarão sem serviço.`
    );
    if (!confirmed) return;
    setCatalogActionError(null);
    setCatalogActionLoading(true);
    try {
      await onDeleteServiceCatalog(serviceId);
    } catch (error: any) {
      setCatalogActionError(error?.message ?? "Erro ao remover serviço.");
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
            Para usar a EDT, selecione um projeto no topo da tela ou acesse a aba de projetos para escolher um.
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
          <p className="page-kicker">EDT</p>
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

      <div className="edt-actions-bar">
        <div className="edt-actions-bar-left">
          <button type="button" className="btn-primary" onClick={() => setIsNewTaskOpen(true)}>
            + Nova tarefa
          </button>
          <span className="edt-actions-hint">Ações rápidas</span>
        </div>
        <div className="edt-actions-bar-right">
          <button type="button" className="btn-secondary">
            Exportar
          </button>
          <button type="button" className="btn-secondary">
            Importar
          </button>
          <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
            Catálogo de Serviços
          </button>
          <button type="button" className="btn-ghost">
            Lixeira
          </button>
        </div>
      </div>

      {wbsError && <p className="error-text">{wbsError}</p>}
      {wbsLoading ? <p className="muted">Carregando EDT...</p> : null}

      {(!wbsNodes || wbsNodes.length === 0) && !wbsLoading ? (
        <div className="workspace-empty-card" style={{ marginTop: "1rem" }}>
          <h3>Nenhum item cadastrado</h3>
          <p className="muted">
            Crie a primeira entrega ou tarefa para começar a estruturar a EDT. Você pode adicionar itens em qualquer
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
            <div className="gp-modal-body">
              {importError && <div className="gp-alert-error">{importError}</div>}
              {importSuccess && <div className="gp-alert-success">{importSuccess}</div>}
              {serviceCatalogError && <div className="gp-alert-error">{serviceCatalogError}</div>}
              {catalogActionError && <div className="gp-alert-error">{catalogActionError}</div>}
              <div className="form-field">
                <label>Arquivo (.xlsx ou .xls)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  disabled={importLoading}
                />
              </div>
              <div className="form-field" style={{ marginTop: "1rem" }}>
                <h3 className="gp-modal-subtitle" style={{ marginBottom: "0.5rem" }}>
                  Adicionar serviço manualmente
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 1fr auto", gap: "8px", alignItems: "center" }}>
                  <input
                    className="gp-input"
                    placeholder="Nome do serviço"
                    value={catalogName}
                    onChange={(e) => setCatalogName(e.target.value)}
                    disabled={catalogActionLoading}
                  />
                  <input
                    className="gp-input"
                    type="number"
                    min={0}
                    step={0.25}
                    placeholder="Horas base"
                    value={catalogHours}
                    onChange={(e) => setCatalogHours(e.target.value)}
                    disabled={catalogActionLoading}
                  />
                  <input
                    className="gp-input"
                    placeholder="Descrição (opcional)"
                    value={catalogDescription}
                    onChange={(e) => setCatalogDescription(e.target.value)}
                    disabled={catalogActionLoading}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleManualServiceCreate}
                    disabled={catalogActionLoading}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {catalogActionLoading ? "Salvando..." : "Adicionar serviço"}
                  </button>
                </div>
              </div>

              <div className="form-field" style={{ marginTop: "1rem" }}>
                <h3 className="gp-modal-subtitle" style={{ marginBottom: "0.5rem" }}>
                  Serviços cadastrados
                </h3>
                <div className="gp-table-wrapper">
                  <table className="gp-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Horas base</th>
                        <th>Descrição</th>
                        <th style={{ width: "110px" }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedServiceCatalog.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "12px" }}>
                            Nenhum serviço cadastrado.
                          </td>
                        </tr>
                      ) : (
                        sortedServiceCatalog.map((service) => (
                          <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>{service.hoursBase ?? service.hours ?? "-"}</td>
                            <td>{service.description || "-"}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => handleDeleteService(service.id, service.name)}
                                disabled={catalogActionLoading}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                <p className="detail-label">ID / Nível</p>
                <p className="detail-value">
                  {selectedTask.wbsCode ?? selectedTask.displayId ?? selectedTask.id} · N{selectedTask.level ?? 0}
                </p>
              </div>
              <div>
                <p className="detail-label">Situação</p>
                <p className="detail-value">{selectedTask.status ?? "Não informado"}</p>
              </div>
              <div>
                <p className="detail-label">Responsável</p>
                <p className="detail-value">
                  {selectedTask.owner?.name ?? selectedTask.owner?.email ?? "Sem responsável"}
                </p>
              </div>
              <div>
                <p className="detail-label">Duração</p>
                <p className="detail-value">{selectedTask.estimateHours ? `${selectedTask.estimateHours / 8}d` : "—"}</p>
              </div>
              <div>
                <p className="detail-label">Início / Término</p>
                <p className="detail-value">
                  {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleDateString("pt-BR") : "—"} • {" "}
                  {selectedTask.endDate ? new Date(selectedTask.endDate).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
              <div>
                <p className="detail-label">Dependências</p>
                <p className="detail-value">
                  {selectedTask.dependencies?.length ? selectedTask.dependencies.join(", ") : "Sem dependências"}
                </p>
              </div>
              <div className="detail-span-2">
                <p className="detail-label">Descrição</p>
                <p className="detail-value">{selectedTask.description ?? "Sem descrição"}</p>
              </div>
              <div className="detail-span-2">
                <p className="detail-label">Progresso</p>
                <div className="wbs-progress-cell">
                  <div className="wbs-progress-bar">
                    <div
                      className="wbs-progress-fill"
                      style={{ width: `${Math.max(0, Math.min(100, selectedTask.progress ?? 0))}%` }}
                    />
                  </div>
                  <span className="wbs-progress-value">
                    {Math.max(0, Math.min(100, selectedTask.progress ?? 0))}%
                  </span>
                </div>
              </div>
            </div>
            <div className="gp-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setDetailsOpen(false)}>
                Fechar
              </button>
              <button type="button" className="btn-primary" onClick={() => setDetailsOpen(false)}>
                Editar (em breve)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

