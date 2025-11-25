import { useOutletContext } from "react-router-dom";
import { WbsTreeView, type DashboardOutletContext } from "../components/DashboardLayout";

export const EDTPage = () => {
  const {
    wbsNodes,
    wbsError,
    wbsLoading,
    onMoveNode,
    onUpdateWbsNode,
    selectedNodeId,
    onSelectNode
  } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="edt-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">EDT Global</p>
          <h1>EDT – Estrutura Analítica do Projeto (Modelo)</h1>
          <p className="subtext">Visualize e mantenha a árvore de entregas e dependências em nível organizacional.</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary-button">Exportar</button>
          <button type="button" className="secondary-button">Importar</button>
          <button type="button" className="ghost-button">Lixeira</button>
        </div>
      </header>

      {wbsError && <p className="error-text">{wbsError}</p>}
      {wbsLoading ? <p className="muted">Carregando EDT...</p> : null}

      <div className="edt-card">
        <div className="edt-scroll-wrapper" style={{ overflowX: "auto", overflowY: "hidden" }}>
          <WbsTreeView
            nodes={wbsNodes}
            onMove={onMoveNode}
            onUpdate={onUpdateWbsNode}
            selectedNodeId={selectedNodeId}
            onSelect={onSelectNode}
          />
        </div>
      </div>
    </section>
  );
};
