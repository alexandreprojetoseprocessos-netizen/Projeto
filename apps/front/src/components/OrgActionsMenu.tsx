import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface OrgActionsMenuProps {
  organization: {
    id: string;
    name: string;
    isActive?: boolean;
  };
  onRenamed: (orgId: string, newName: string) => void;
  onToggledActive: (orgId: string, isActive: boolean) => void;
  onDeleted: (orgId: string) => void;
}

const OrgActionsMenu: React.FC<OrgActionsMenuProps> = ({
  organization,
  onRenamed,
  onToggledActive,
  onDeleted
}) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleMenu = () => setOpen((v) => !v);

  const handleRename = async () => {
    if (!token) return;
    const newName = window.prompt("Renomear organizacao", organization.name);
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    try {
      const response = await fetch(`/organizations/${organization.id}`, {
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

  const handleToggleActive = async () => {
    if (!token) return;
    const desired = !(organization.isActive ?? true);
    try {
      const response = await fetch(`/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: desired })
      });
      if (!response.ok) throw new Error("Falha ao atualizar organizacao");
      const data = await response.json();
      const nextActive = data.organization?.isActive ?? desired;
      onToggledActive(organization.id, nextActive);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar organizacao", error);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    if (!window.confirm("Tem certeza que deseja excluir esta organizacao?")) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(`/organizations/${organization.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Falha ao excluir organizacao");
      onDeleted(organization.id);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao excluir organizacao", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="org-card-actions">
      <button type="button" className="org-menu-button" onClick={toggleMenu}>
        ⋯
      </button>

      {open && (
        <div className="org-menu-container">
          <button className="org-menu-item" type="button" onClick={handleRename}>
            Renomear
          </button>
          <button className="org-menu-item" type="button" onClick={handleToggleActive}>
            {organization.isActive ? "Desativar" : "Reativar"}
          </button>
          <button className="org-menu-item" type="button" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
          <button className="org-menu-item org-menu-cancel" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default OrgActionsMenu;
