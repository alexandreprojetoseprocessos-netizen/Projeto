import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";

export const EDTPage = () => {
  const navigate = useNavigate();
  const {
    wbsNodes,
    wbsError,
    wbsLoading,
    onMoveNode,
    onUpdateWbsNode,
    selectedNodeId,
    onSelectNode,
    onCreateWbsItem,
    projects,
    selectedProjectId,
  } = useOutletContext<DashboardOutletContext>();

  const currentProject = projects.find((project: any) => project.id === selectedProjectId) ?? null;

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
              onOpenDetails={handleOpenDetails}
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
