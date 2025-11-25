import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";

export const ProjectDocumentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedProject,
    selectedProjectId,
    onProjectChange,
    projectDocuments,
    projectDocumentsLoading,
    projectDocumentsError,
    onUploadProjectDocument,
    onDeleteProjectDocument,
    onDownloadProjectDocument
  } = useOutletContext<DashboardOutletContext>();

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

  return (
    <section className="project-documents-page">
      <header className="page-header">
        <div>
          <h1>Documentos do Projeto</h1>
          <p>{selectedProject?.projectName ?? selectedProject?.name ?? "Projeto"}</p>
        </div>

        <div className="actions">
          <label className="upload-label">
            <span>Enviar</span>
            <input
              type="file"
              onChange={(event) => onUploadProjectDocument?.(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </header>

      {projectDocumentsLoading && <p className="muted">Carregando documentos...</p>}
      {projectDocumentsError && <p className="error-text">Erro: {projectDocumentsError}</p>}

      <div className="documents-list">
        {(projectDocuments ?? []).map((doc: any) => (
          <div key={doc.id} className="document-row">
            <div className="document-info">
              <strong>{doc.name}</strong>
              <span>{doc.sizeReadable ?? ""}</span>
              <span>{doc.category ?? ""}</span>
            </div>

            <div className="document-actions">
              <button type="button" onClick={() => onDownloadProjectDocument?.(doc.id)}>
                Baixar
              </button>
              <button type="button" onClick={() => onDeleteProjectDocument?.(doc.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
