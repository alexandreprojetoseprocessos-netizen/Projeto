import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../config/api";

interface OrgActionsMenuProps {
  organization: {
    id: string;
    name: string;
    isActive?: boolean;
    status?: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED";
  };
  onRenamed: (orgId: string, newName: string) => void;
  onToggledActive: (orgId: string, isActive: boolean) => void;
  onDeleted: (orgId: string) => void;
  onStatusChange?: (orgId: string, status: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED") => void;
  mode?: "menu" | "inline";
}

const OrgActionsMenu: React.FC<OrgActionsMenuProps> = ({
  organization,
  onRenamed,
  onToggledActive,
  onDeleted,
  onStatusChange,
  mode = "menu"
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isInline = mode === "inline";

  const toggleMenu = () => setOpen((v) => !v);

  const handleRename = async () => {
    if (!token) return;
    const newName = window.prompt("Renomear organização", organization.name);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    try {
      const body = await apiRequest<{ organization?: { name?: string } }>(`/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmed })
      });
      onRenamed(organization.id, body.organization?.name ?? trimmed);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao renomear organização", error);
    }
  };

  const handleDeactivate = async () => {
    if (!token) return;
    try {
      const body = await apiRequest<{ organization?: { status?: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED" } }>(
        `/organizations/${organization.id}/deactivate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      onStatusChange?.(organization.id, body.organization?.status ?? "DEACTIVATED");
      onToggledActive(organization.id, false);
      onDeleted(organization.id);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao desativar organização", error);
    }
  };

  const handleTrash = async () => {
    if (!token) return;
    if (!window.confirm("Tem certeza que deseja enviar esta organização para a lixeira?")) return;
    setDeleting(true);
    try {
      const body = await apiRequest<{ organization?: { status?: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED" } }>(
        `/organizations/${organization.id}/trash`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      onStatusChange?.(organization.id, body.organization?.status ?? "SOFT_DELETED");
      onDeleted(organization.id);
      onToggledActive(organization.id, false);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao excluir organização", error);
    } finally {
      setDeleting(false);
    }
  };

  if (isInline) {
    return (
      <>
        <button className="button-primary" type="button" onClick={handleRename}>
          Renomear
        </button>
        <button className="button-primary" type="button" onClick={handleDeactivate}>
          Desativar
        </button>
        <button className="button-primary" type="button" onClick={handleTrash} disabled={deleting}>
          {deleting ? "Excluindo..." : "Excluir"}
        </button>
      </>
    );
  }

  return (
    <div className={`org-card-actions ${isInline ? "org-card-actions--inline" : ""}`}>
      <button type="button" className="org-menu-button" onClick={toggleMenu}>
        ...
      </button>

      {open && (
        <div className="org-menu-container">
          <button className="button-primary" type="button" onClick={handleRename}>
            Renomear
          </button>
          <button className="button-primary" type="button" onClick={handleDeactivate}>
            Desativar
          </button>
          <button className="button-primary" type="button" onClick={handleTrash} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrgActionsMenu;
