import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";

export type ProjectTrashModalProps = {
  open: boolean;
  onClose: () => void;
  onReload?: () => void;
  organizationId: string;
};

type ProjectTrashItem = {
  id: string;
  name: string;
  archivedAt?: string | null;
};

const getDaysLeft = (archivedAt?: string | null) => {
  if (!archivedAt) return null;
  const start = new Date(archivedAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, 30 - diffDays);
};

const ProjectTrashModal = ({ open, onClose, onReload, organizationId }: ProjectTrashModalProps) => {
  const { token } = useAuth();
  const [items, setItems] = useState<ProjectTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!token || !organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/projects?status=ARCHIVED"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Organization-Id": organizationId
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || "Erro ao carregar projetos arquivados");
      }
      const projects = (body as any).projects ?? [];
      setItems(
        projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          archivedAt: project.archivedAt ?? null
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar projetos arquivados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, organizationId]);

  const handleRestore = async (id: string) => {
    if (!token || !organizationId) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      const response = await fetch(apiUrl(`/projects/${id}/restore`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Organization-Id": organizationId
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || "Erro ao restaurar projeto");
      }
      onReload?.();
      await fetchItems();
    } catch (err: any) {
      setActionError(err?.message || "Erro ao restaurar projeto");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!token || !organizationId) return;
    if (!window.confirm("Excluir permanentemente este projeto? Essa ação não pode ser desfeita.")) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      const response = await fetch(apiUrl(`/projects/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Organization-Id": organizationId
        }
      });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Erro ao excluir permanentemente");
      }
      onReload?.();
      await fetchItems();
    } catch (err: any) {
      setActionError(err?.message || "Erro ao excluir permanentemente");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="org-modal-overlay" role="dialog" aria-modal="true">
      <div className="org-modal">
        <header className="org-modal__header">
          <h3>Projetos arquivados</h3>
          <button type="button" className="org-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {actionError && <div className="org-modal-error">{actionError}</div>}

        <div className="org-modal__content">
          {loading && <p className="muted">Carregando...</p>}
          {!loading && error && <p className="error-text">{error}</p>}
          {!loading && !error && items.length === 0 && <p className="muted">Nenhum projeto na lixeira.</p>}
          {!loading && !error && items.length > 0 &&
            items.map((project) => {
              const daysLeft = getDaysLeft(project.archivedAt);
              return (
                <div className="org-modal-row" key={project.id}>
                  <div className="org-modal-row__info">
                    <div className="org-modal-row__avatar">
                      <Trash2 size={16} />
                    </div>
                    <div>
                      <div className="org-modal-row__name">{project.name}</div>
                      <div className="org-modal-row__meta">
                        {daysLeft !== null
                          ? `Restam ${daysLeft} dia${daysLeft === 1 ? "" : "s"} para exclusão permanente`
                          : "Arquivado"}
                      </div>
                    </div>
                  </div>
                  <div className="org-modal-row__actions">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => handleRestore(project.id)}
                      disabled={actionLoadingId === project.id}
                    >
                      Restaurar
                    </button>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => handleDeletePermanent(project.id)}
                      disabled={actionLoadingId === project.id}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ProjectTrashModal;
