import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { FileIcon } from "../components/DashboardLayout";
import { EmptyStateCard } from "../components/DashboardLayout";

export const DocumentsPage = () => {
  const { attachments, attachmentsError, attachmentsLoading } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="documents-page">
      <header className="page-header">
        <h1>Documentos</h1>
        {attachmentsError && <p className="error-text">{attachmentsError}</p>}
      </header>

      {attachmentsLoading ? (
        <div className="docs-grid">
          {[0, 1, 2].map((index) => (
            <article key={index} className="doc-card skeleton-card">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            </article>
          ))}
        </div>
      ) : (attachments ?? []).length ? (
        <div className="docs-grid">
          {(attachments ?? []).map((doc: any) => (
            <article key={doc.id} className="doc-card">
              <div>
                <h4>{doc.fileName}</h4>
                <p className="muted">{doc.category ?? "Documento"}</p>
                <small>{doc.size ?? doc.sizeReadable ?? ""}</small>
              </div>
              <button type="button" className="secondary-button">
                Baixar
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={FileIcon}
          title="Nenhum documento enviado"
          description="Centralize atas, contratos e anexos importantes para facilitar o acompanhamento."
          actionLabel="Adicionar documento"
          onAction={() => {
            if (typeof window !== "undefined") window.alert("Upload em breve.");
          }}
        />
      )}
    </section>
  );
};

export default DocumentsPage;
