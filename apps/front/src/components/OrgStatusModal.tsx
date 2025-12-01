import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PauseCircle, Trash2, X } from "lucide-react";

type OrgStatus = "DEACTIVATED" | "SOFT_DELETED";

type OrgStatusModalProps = {
  type: OrgStatus;
  open: boolean;
  onClose: () => void;
  onReload?: () => void;
};

type OrgItem = {
  id: string;
  name: string;
  deletedAt?: string | null;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const getDaysLeft = (deletedAt?: string | null) => {
  if (!deletedAt) return null;
  const start = new Date(deletedAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, 90 - diffDays);
};

const OrgStatusModal = ({ type, open, onClose, onReload }: OrgStatusModalProps) => {
  const { token } = useAuth();
  const [items, setItems] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const title = type === "DEACTIVATED" ? "Organizações desativadas" : "Lixeira (90 dias)";

  const fetchItems = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations?status=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message || "Erro ao carregar organizações");
      }
      setItems((body as any).organizations ?? []);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar organizações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  const handleRestore = async (id: string) => {
    if (!token) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${id}/restore`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 && body?.code === "ORG_LIMIT_REACHED") {
          setActionError(body?.message || "Limite de organizações atingido.");
          return;
        }
        throw new Error(body?.message || "Erro ao restaurar organização");
      }
      onReload?.();
      await fetchItems();
    } catch (err: any) {
      setActionError(err?.message || "Erro ao restaurar organização");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendToTrash = async (id: string) => {
    if (!token) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${id}/trash`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Erro ao enviar para lixeira");
      }
      onReload?.();
      await fetchItems();
    } catch (err: any) {
      setActionError(err?.message || "Erro ao enviar para lixeira");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Excluir permanentemente esta organização? Isso removerá projetos vinculados.")) return;
    setActionLoadingId(id);
    setActionError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
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

  const content = useMemo(() => {
    if (loading) return <p className="muted">Carregando...</p>;
    if (error) return <p className="error-text">{error}</p>;
    if (!items.length) return <p className="muted">Nenhuma organização encontrada.</p>;

    return items.map((org) => {
      const daysLeft = type === "SOFT_DELETED" ? getDaysLeft(org.deletedAt) : null;
      return (
        <div className="org-modal-row" key={org.id}>
          <div className="org-modal-row__info">
            <div className="org-modal-row__avatar">{(org.name || "Org").slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="org-modal-row__name">{org.name}</div>
              {type === "SOFT_DELETED" && (
                <div className="org-modal-row__meta">
                  {daysLeft !== null
                    ? `Restam ${daysLeft} dia${daysLeft === 1 ? "" : "s"} para exclusão permanente`
                    : "Aguardando exclusão permanente"}
                </div>
              )}
              {type === "DEACTIVATED" && <div className="org-modal-row__meta">Desativado</div>}
            </div>
          </div>
          <div className="org-modal-row__actions">
            <button type="button" className="button-primary" onClick={() => handleRestore(org.id)} disabled={actionLoadingId === org.id}>
              Restaurar
            </button>
            {type === "DEACTIVATED" ? (
              <button
                type="button"
                className="button-primary"
                onClick={() => handleSendToTrash(org.id)}
                disabled={actionLoadingId === org.id}
              >
                Enviar para lixeira
              </button>
            ) : (
              <button
                type="button"
                className="button-primary"
                onClick={() => handleDeletePermanent(org.id)}
                disabled={actionLoadingId === org.id}
              >
                Excluir permanentemente
              </button>
            )}
          </div>
        </div>
      );
    });
  }, [actionLoadingId, error, items, loading, type]);

  if (!open) return null;

  return (
    <div className="org-modal-overlay" role="dialog" aria-modal="true">
      <div className="org-modal">
        <header className="org-modal__header">
          <h3>{title}</h3>
          <button type="button" className="org-modal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {actionError && <div className="org-modal-error">{actionError}</div>}

        <div className="org-modal__content">{content}</div>
      </div>
    </div>
  );
};

export default OrgStatusModal;
