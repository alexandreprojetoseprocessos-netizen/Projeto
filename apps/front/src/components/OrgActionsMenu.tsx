import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../config/api";

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
    const newName = window.prompt("Renomear organizacao", organization.name);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    try {
      const response = await fetch(apiUrl(`/organizations/${organization.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmed })
      });
      if (!response.ok) throw new Error("Falha ao renomear");
      const data = await response.json();
      onRenamed(organization.id, data.organization?.name ?? trimmed);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao renomear organizacao", error);
    }
  };

  const handleDeactivate = async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl(`/organizations/${organization.id}/deactivate`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Falha ao desativar organizacao");
      const data = await response.json();
      onStatusChange?.(organization.id, data.organization?.status ?? "DEACTIVATED");
      onToggledActive(organization.id, false);
      onDeleted(organization.id);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao desativar organizacao", error);
    }
  };

  const handleTrash = async () => {
    if (!token) return;
    if (!window.confirm("Tem certeza que deseja enviar esta organizacao para a lixeira?")) return;
    setDeleting(true);
    try {
      const response = await fetch(apiUrl(`/organizations/${organization.id}/trash`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Falha ao excluir organizacao");
      const data = await response.json();
      onStatusChange?.(organization.id, data.organization?.status ?? "SOFT_DELETED");
      onDeleted(organization.id);
      onToggledActive(organization.id, false);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao excluir organizacao", error);
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

