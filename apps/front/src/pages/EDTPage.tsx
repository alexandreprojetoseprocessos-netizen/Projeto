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
    selectedNodeId,
    onSelectNode,
    onCreateWbsItem,
    projects,
    selectedProjectId,
  } = useOutletContext<DashboardOutletContext>();

  const currentProject = projects.find((project: any) => project.id === selectedProjectId) ?? null;

  if (!selectedProjectId) {
    return (
      <section className="edt-page">
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
    <section className="edt-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">EDT</p>
          <h1>EDT - Estrutura Analitica do Projeto</h1>
          {currentProject && (
            <p className="edt-subtitle">
              Projeto atual: <strong>{currentProject.name}</strong>
            </p>
          )}
          <p className="subtext">
            Visualize e mantenha a arvore de entregas e dependencias para o projeto selecionado. Crie itens, organize
            hierarquias e acompanhe o progresso.
          </p>
        </div>
        <div className="actions">
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

      {wbsError && <p className="error-text">{wbsError}</p>}
      {wbsLoading ? <p className="muted">Carregando EDT...</p> : null}

      {(!wbsNodes || wbsNodes.length === 0) && !wbsLoading ? (
        <div className="workspace-empty-card" style={{ marginTop: "1rem" }}>
          <h3>Nenhum item cadastrado</h3>
          <p className="muted">
            Crie a primeira entrega ou tarefa para comecar a estruturar a EDT. Voce pode adicionar itens em qualquer
            nivel e reordena-los depois.
          </p>
          <button type="button" className="primary-button" onClick={() => onCreateWbsItem?.(null)}>
            Criar nova tarefa
          </button>
        </div>
      ) : (
        <div className="edt-card">
          <div className="edt-scroll-wrapper" style={{ overflowX: "auto", overflowY: "hidden" }}>
            <WbsTreeView
              nodes={wbsNodes}
              loading={wbsLoading}
              error={wbsError}
              onCreate={(parentId) => onCreateWbsItem?.(parentId ?? null)}
              onMove={onMoveNode}
              onUpdate={onUpdateWbsNode}
              selectedNodeId={selectedNodeId}
              onSelect={onSelectNode}
            />
          </div>
        </div>
      )}
    </section>
  );
};
