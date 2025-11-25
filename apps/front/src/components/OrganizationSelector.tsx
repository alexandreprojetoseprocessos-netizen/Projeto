import { useState, type FormEvent } from "react";

type OrganizationCard = {
  id: string;
  name: string;
  role: string;
  plan?: string | null;
  activeProjects: number;
};

type OrganizationSelectorProps = {
  organizations: OrganizationCard[];
  onSelect: (orgId: string) => void;
  onCreateOrganization?: (name: string, domain?: string) => void;
  userEmail?: string | null;
};

export const OrganizationSelector = ({
  organizations,
  onSelect,
  onCreateOrganization,
  userEmail
}: OrganizationSelectorProps) => {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateOrganization) return;
    const trimmedName = newOrgName.trim();
    if (!trimmedName) return;
    const trimmedDomain = newOrgDomain.trim();
    onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
  };

  const hasOrganizations = organizations.length > 0;

  return (
    <div className="workspace-page">
    <header className="workspace-header">
      <div>
        <p className="eyebrow">Bem-vindo(a)</p>
        <h1>Escolha onde você quer trabalhar hoje</h1>
        {userEmail && <p className="subtext">{userEmail}</p>}
      </div>
      <button className="ghost-button" type="button" onClick={onCreateOrganization}>
        + Criar nova organização
      </button>
    </header>

    <section className="workspace-grid">
      {organizations.map((organization) => (
        <article key={organization.id} className="workspace-card">
          <div className="workspace-card__avatar" aria-hidden>
            {organization.name
              .split(" ")
              .slice(0, 2)
              .map((chunk) => chunk.charAt(0))
              .join("")
              .toUpperCase()}
          </div>
          <div className="workspace-card__content">
            <h2>{organization.name}</h2>
            <p>
              {organization.activeProjects} projetos ativos · {organization.role}
            </p>
            <p className="muted">Plano: {organization.plan ?? "Não informado"}</p>
          </div>
          <div className="workspace-card__actions">
            <button className="secondary-button" type="button" onClick={() => onSelect(organization.id)}>
              Entrar
            </button>
          </div>
        </article>
      ))}

      {organizations.length === 0 && (
        <div className="workspace-empty">
          <p>Nenhuma organização disponível para este usuário.</p>
          <button className="secondary-button" type="button" onClick={onCreateOrganization}>
            Criar primeira organização
          </button>
        </div>
      )}
    </section>
    </div>
  );
};
