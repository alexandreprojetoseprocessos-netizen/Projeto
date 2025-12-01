import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import OrgActionsMenu from "./OrgActionsMenu";
import { canManageOrganizationSettings } from "./permissions";
import { getColorForName, getInitials } from "../utils/color";

export type OrganizationCard = {
  id: string;
  name: string;
  role: string;
  plan?: string | null;
  activeProjects?: number;
  projectsCount?: number;
  domain?: string | null;
  createdAt?: string;
  isActive?: boolean;
  status?: "ACTIVE" | "DEACTIVATED" | "SOFT_DELETED";
  deletedAt?: string | null;
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
  currentOrgRole?: string | null;
};

export const OrganizationSelector = ({
  organizations,
  onSelect,
  onCreateOrganization,
  userEmail,
  organizationLimits,
  currentOrgRole
}: OrganizationSelectorProps) => {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [orgList, setOrgList] = useState<OrganizationCard[]>(organizations);
  const formRef = useRef<HTMLFormElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setOrgList(organizations);
  }, [organizations]);

  const planCode = organizationLimits?.planCode ?? null;
  const planName =
    planCode === "START"
      ? "Start"
      : planCode === "BUSINESS"
      ? "Business"
      : planCode === "ENTERPRISE"
      ? "Enterprise"
      : "Não informado";
  const max = organizationLimits?.max ?? null;
  const remaining = organizationLimits?.remaining ?? null;
  const used = organizationLimits?.used ?? orgList.length;
  const canCreateMore = max === null ? true : remaining !== null && remaining > 0;
  const showLimitBanner = !canCreateMore && max !== null;
  const canManageOrg = canManageOrganizationSettings(currentOrgRole);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateOrganization) return;
    const trimmedName = newOrgName.trim();
    if (!trimmedName || !canCreateMore) return;
    const trimmedDomain = newOrgDomain.trim();
    onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
    setNewOrgName("");
    setNewOrgDomain("");
  };

  const scrollToCreate = () => {
    const el = document.getElementById("org-create-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOrgRenamed = (orgId: string, newName: string) => {
    setOrgList((current) => current.map((org) => (org.id === orgId ? { ...org, name: newName } : org)));
  };

  const handleOrgToggledActive = (orgId: string, isActive: boolean) => {
    if (!isActive) {
      setOrgList((current) => current.filter((org) => org.id !== orgId));
    } else {
      setOrgList((current) => current.map((org) => (org.id === orgId ? { ...org, isActive } : org)));
    }
  };

  const handleOrgDeleted = (orgId: string) => {
    setOrgList((current) => current.filter((org) => org.id !== orgId));
  };

  const handleOrgStatusChange = (orgId: string, status?: string) => {
    if (status && status !== "ACTIVE") {
      setOrgList((current) => current.filter((org) => org.id !== orgId));
    }
  };

  return (
    <div className="org-page">
      {showLimitBanner && (
        <div className="org-limit-banner">
          <div className="org-limit-stripe" />
          <div className="org-limit-content">
            <strong>Você atingiu o limite de organizações do seu plano.</strong>
            <span>
              Para criar novas organizações, atualize seu plano em {" "}
              <button type="button" className="link-button" onClick={() => navigate("/plano")}>
                Meu plano
              </button>
              .
            </span>
          </div>
        </div>
      )}

      <div className="org-header">
        <div className="org-header-left">
          <span className="org-kicker">BEM-VINDO(A)</span>
          <h1>Escolha onde você quer trabalhar hoje</h1>
          {userEmail && <p className="org-user-email">{userEmail}</p>}
        </div>

        <div className="org-header-right">
          <div className="org-plan-card">
            <span className="org-plan-label">Plano atual</span>
            <strong className="org-plan-name">{planName}</strong>
            {max === null ? (
              <p className="org-plan-meta">
                Organizações: <strong>Ilimitadas</strong>
              </p>
            ) : (
              <p className="org-plan-meta">
                Organizações: <strong>{used} de {max}</strong> usadas
              </p>
            )}
            {max !== null && remaining !== null && remaining > 0 && (
              <p className="org-plan-extra">
                Você ainda pode criar <strong>{remaining}</strong> organização{remaining > 1 ? "s" : ""}.
              </p>
            )}
            {max !== null && remaining === 0 && (
              <p className="org-plan-warning">Você atingiu o limite de organizações do plano.</p>
            )}
            <button type="button" className="primary-button" disabled={!canCreateMore} onClick={scrollToCreate}>
              Criar nova organização
            </button>
            {!canCreateMore && (
              <button type="button" className="link-button" onClick={scrollToCreate}>
                Ver opções em "Meu plano"
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="org-content">
        {orgList.length === 0 && (
          <div className="org-empty">
            <h2>Você ainda não tem nenhuma organização</h2>
            <p>Crie sua primeira organização para começar a cadastrar projetos, equipe e documentos.</p>
            <button className="primary-button" type="button" onClick={scrollToCreate}>
              Criar primeira organização
            </button>
          </div>
        )}

        <div className="org-grid">
          {orgList.map((organization) => {
            const bgColor = getColorForName(organization.name || "Org");
            const initials = getInitials(organization.name || "Org");
            const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
            const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
            const isActive = organization.isActive ?? true;
            const canManageThisOrg = canManageOrganizationSettings(currentOrgRole ?? organization.role ?? null);
            const projectsCount =
              organization.projectsCount ?? organization.activeProjects ?? organization.projectCount ?? 0;

            return (
              <div key={organization.id} className="org-card">
                <div className="org-card-header">
                  <div className="org-card-main">
                    <div className="org-avatar" style={{ backgroundColor: bgColor }}>
                      {initials}
                    </div>
                    <div className="org-card-text">
                      <h2 className="org-name">{organization.name}</h2>
                      <p
                        className="org-meta-line"
                        title={createdLabel ? `Criada em ${createdLabel}` : undefined}
                      >
                        {projectsCount} projeto(s) ativos  {organization.role}
                      </p>
                      <p className="org-plan-line">
                        Plano: <span>{planName}</span>
                      </p>
                    </div>
                  </div>
                  {canManageThisOrg && (
                    <div className="org-actions-row">
                      <OrgActionsMenu
                        organization={organization}
                        onRenamed={handleOrgRenamed}
                        onToggledActive={handleOrgToggledActive}
                        onDeleted={handleOrgDeleted}
                        onStatusChange={handleOrgStatusChange}
                        mode="inline"
                      />
                    </div>
                  )}
                </div>

                <div className="org-card-right">
                  <button
                    type="button"
                    className="button-primary"
                    disabled={!isActive}
                    onClick={() => onSelect(organization.id)}
                  >
                    Entrar
                  </button>
                </div>
              </div>
            );
          })}

          <div className="org-card org-card-create" id="org-create-card">
            <h2>Criar nova organização</h2>
            <p>
              A organização representa sua empresa, clínica ou negócio. Ela concentra projetos, pessoas e arquivos.
              Preencha os dados abaixo para continuar.
            </p>
            <form className="org-form" onSubmit={handleSubmit} ref={formRef}>
              <label>
                Nome da organização
                <input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Ex.: Minha empresa LTDA"
                  required
                />
              </label>
              <label>
                Domínio (opcional)
                <input
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  placeholder="ex: minhaempresa.com"
                />
              </label>
              <button className="primary-button" type="submit" disabled={!canCreateMore}>
                Criar nova organização
              </button>
              {!canCreateMore && (
                <p className="org-plan-warning">
                  Você atingiu o limite de organizações do seu plano. Veja opções em "Meu plano".
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

