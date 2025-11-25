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
          <h1>{hasOrganizations ? "Escolha onde você quer trabalhar hoje" : "Vamos começar pelo básico"}</h1>
          {userEmail && <p className="subtext">{userEmail}</p>}
        </div>
        {hasOrganizations && onCreateOrganization ? (
          <button className="ghost-button" type="button" onClick={() => onCreateOrganization("", "")}>
            + Criar nova organização
          </button>
        ) : null}
      </header>

      {hasOrganizations ? (
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
                  {organization.activeProjects} projetos ativos • {organization.role}
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
        </section>
      ) : (
        <div className="workspace-empty-card">
          <h2>Passo 1 de 3: Crie sua primeira organização</h2>
          <p>
            Antes de começar a criar projetos, você precisa configurar a sua organização. Ela representa a sua empresa,
            clínica ou consultoria.
          </p>
          {userEmail && (
            <p className="muted">
              Você está logado como <strong>{userEmail}</strong>.
            </p>
          )}

          <form className="workspace-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <span>Nome da organização</span>
              <input
                value={newOrgName}
                onChange={(event) => setNewOrgName(event.target.value)}
                placeholder="Ex.: Minha Empresa LTDA"
                required
              />
            </label>

            <label className="input-group">
              <span>Domínio (opcional)</span>
              <input
                value={newOrgDomain}
                onChange={(event) => setNewOrgDomain(event.target.value)}
                placeholder="ex: minhaempresa.com"
              />
            </label>

            <button className="primary-button" type="submit">
              Criar e continuar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
