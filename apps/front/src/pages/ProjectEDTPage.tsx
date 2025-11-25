import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { WbsTreeView } from "../components/DashboardLayout";

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
    onUpdateProjectDependency
  } = useOutletContext<DashboardOutletContext>();

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

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
            selectedNodeId={null}
            onSelect={() => {}}
          />
        </div>
      </div>
    </section>
  );
};
