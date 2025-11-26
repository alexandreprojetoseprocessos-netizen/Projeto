import { useRef, useState, type FormEvent } from "react";

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
  organizationLimits?: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null;
};

export const OrganizationSelector = ({
  organizations,
  onSelect,
  onCreateOrganization,
  userEmail,
  organizationLimits
}: OrganizationSelectorProps) => {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateOrganization) return;
    const trimmedName = newOrgName.trim();
    if (!trimmedName) return;
    const trimmedDomain = newOrgDomain.trim();
    onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
  };

  const hasOrganizations = organizations.length > 0;
  const planCode = organizationLimits?.planCode ?? null;
  const max = organizationLimits?.max ?? null;
  const used = organizationLimits?.used ?? organizations.length;
  const remaining = organizationLimits?.remaining ?? null;
  const canCreateMore = max === null || remaining === null || remaining > 0;
  const planName =
    planCode === "START"
      ? "Start"
      : planCode === "BUSINESS"
      ? "Business"
      : planCode === "ENTERPRISE"
      ? "Enterprise"
      : "Nao informado";

  return (
    <div className="workspace-page">
      <header className="workspace-header org-header">
        <div className="org-header-left">
          <p className="eyebrow">Bem-vindo(a)</p>
          <h1>Escolha onde voce quer trabalhar hoje</h1>
          {userEmail && <p className="org-user-email">{userEmail}</p>}
        </div>

        <div className="org-header-right">
          <div className="org-plan-card">
            <span className="org-plan-label">Plano atual</span>
            <strong className="org-plan-name">{planName}</strong>
            {max === null ? (
              <p className="org-plan-meta">
                Organizacoes: <strong>Ilimitadas</strong>
              </p>
            ) : (
              <p className="org-plan-meta">
                Organizacoes: <strong>{used} de {max}</strong> usadas
              </p>
            )}
            {max !== null && remaining !== null && remaining > 0 && (
              <p className="org-plan-extra">
                Voce ainda pode criar <strong>{remaining}</strong> organizacao{remaining > 1 ? "es" : ""}.
              </p>
            )}
            {max !== null && remaining === 0 && (
              <p className="org-plan-warning">Voce atingiu o limite de organizacoes do plano.</p>
            )}
            <button
              type="button"
              className="primary-button"
              disabled={!canCreateMore}
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Criar nova organizacao
            </button>
          </div>
        </div>
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
                {organization.activeProjects} projetos ativos - {organization.role}
              </p>
              <p className="muted">Plano: {organization.plan ?? "Nao informado"}</p>
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
            <p>Nenhuma organizacao disponivel para este usuario.</p>
          </div>
        )}
      </section>

      <div className="workspace-empty-card" style={{ marginTop: "1rem" }} ref={formRef}>
        <h2>{hasOrganizations ? "Criar nova organizacao" : "Passo 1 de 3: Crie sua primeira organizacao"}</h2>
        <p>
          A organizacao representa sua empresa, clinica ou negocio. Ela concentra projetos, pessoas e arquivos. Preencha
          os dados abaixo para continuar.
        </p>
        {!canCreateMore && (
          <p className="org-plan-warning">
            Voce atingiu o limite de organizacoes do seu plano. Atualize o plano para criar mais organizacoes.
          </p>
        )}
        <form className="workspace-form" onSubmit={handleSubmit}>
          <label>
            Nome da organizacao
            <input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              required
              placeholder="Ex.: Minha empresa LTDA"
            />
          </label>
          <label>
            Dominio (opcional)
            <input
              value={newOrgDomain}
              onChange={(e) => setNewOrgDomain(e.target.value)}
              placeholder="ex: minhaempresa.com"
            />
          </label>
          <button className="primary-button" type="submit" disabled={!canCreateMore}>
            {hasOrganizations ? "Criar nova organizacao" : "Criar e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
};
