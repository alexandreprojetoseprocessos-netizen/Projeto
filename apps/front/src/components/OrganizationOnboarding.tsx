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
};

type OrganizationSelectorProps = {
  organizations: OrganizationCard[];
  onSelect: (orgId: string) => void;
  onCreateOrganization?: (name: string, domain?: string) => void | Promise<void>;
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
  const [creating, setCreating] = useState(false);
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
      : "Nao informado";
  const max = organizationLimits?.max ?? null;
  const remaining = organizationLimits?.remaining ?? null;
  const used = organizationLimits?.used ?? orgList.length;
  const canCreateMore = max === null ? true : remaining !== null && remaining > 0;
  const showLimitBanner = !canCreateMore && max !== null;
  const canManageOrg = canManageOrganizationSettings(currentOrgRole);
  const totalSlotsLabel = max === null ? "ilimitadas" : `${used} de ${max}`;
  const organizationsPercent =
    max === null || max === 0 ? 100 : Math.min(100, Math.round((used / max) * 100));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onCreateOrganization) return;
    const trimmedName = newOrgName.trim();
    if (!trimmedName || !canCreateMore || creating) return;
    const trimmedDomain = newOrgDomain.trim();
    setCreating(true);
    try {
      await onCreateOrganization(trimmedName, trimmedDomain ? trimmedDomain : undefined);
      setNewOrgName("");
      setNewOrgDomain("");
      formRef.current?.reset();
    } catch (error) {
      // erro tratado fora
    } finally {
      setCreating(false);
    }
  };

  const scrollToCreate = () => {
    const el = document.getElementById("org-create-section");
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

  const isCreateDisabled = !canCreateMore || creating || !newOrgName.trim();

  return (
    <div className="org-page">
      {showLimitBanner && (
        <div className="org-limit-banner">
          <div className="org-limit-stripe" />
          <div className="org-limit-content">
            <strong>Voce atingiu o limite de organizacoes do seu plano.</strong>
            <span>
              Para criar novas organizacoes, atualize seu plano em {" "}
              <button type="button" className="link-button" onClick={() => navigate("/plano")}>
                Meu plano
              </button>
              .
            </span>
          </div>
        </div>
      )}

      <div className="org-top">
        <div className="org-top-left">
          <span className="org-kicker">BEM-VINDO(A)</span>

          <section id="org-create-section" className="org-section org-create-section">
            <h2 className="org-section-title">Criar nova organizacao</h2>
            <p className="org-section-text">
              A organizacao representa sua empresa, clinica ou negocio. E aqui que voce concentra projetos, pessoas e
              documentos.
            </p>

            <div className="org-card org-card-create">
              <form className="org-form" onSubmit={handleSubmit} ref={formRef}>
                <label>
                  Nome da organizacao
                  <input
                    type="text"
                    placeholder="Ex.: Minha empresa LTDA"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Dominio (opcional)
                  <input
                    type="text"
                    placeholder="ex: minhaempresa.com"
                    value={newOrgDomain}
                    onChange={(e) => setNewOrgDomain(e.target.value)}
                  />
                </label>

                <button type="submit" className="primary-button org-create-button" disabled={isCreateDisabled}>
                  {creating ? "Criando..." : "Criar nova organizacao"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="org-top-right">
          <div className="org-responsible">
            <span className="org-responsible-label">Responsavel pelas organizacoes</span>
            {userEmail && <span className="org-responsible-email">{userEmail}</span>}
          </div>

          <aside className="org-plan-card">
            <div className="org-plan-card-header">
              <span className="org-plan-pill">Plano atual</span>
              <span className="org-plan-name">{planName}</span>
            </div>

            <div className="org-plan-body">
              <p className="org-plan-label">Organizacoes incluidas</p>
              <p className="org-plan-value">{totalSlotsLabel}</p>

              <div className="org-plan-progress">
                <div className="org-plan-progress-fill" style={{ width: `${organizationsPercent}%` }} />
              </div>

              <p className="org-plan-helper">
                Use esta conta para centralizar suas empresas, clinicas ou unidades.
              </p>
            </div>

            <button
              type="button"
              className="primary-button org-plan-button"
              onClick={() => navigate("/plano")}
            >
              Ver detalhes do plano
            </button>
          </aside>
        </div>
      </div>

      <section className="org-section-strip">
        <h2>Escolha onde voce quer trabalhar hoje</h2>
        <p>Selecione uma organizacao para gerenciar seus projetos, equipe e documentos.</p>
      </section>

      <section className="org-section org-list-section">
        {orgList.length === 0 ? (
          <div className="org-empty">
            <h3>Nenhuma organizacao cadastrada ainda</h3>
            <p>
              Crie a sua primeira organizacao para comecar a estruturar seus projetos. Voce pode adicionar quantas
              precisar dentro do seu plano.
            </p>
            <button type="button" className="primary-button" onClick={scrollToCreate}>
              Criar primeira organizacao
            </button>
          </div>
        ) : (
          <div className="org-grid">
            {orgList.map((organization) => {
              const bgColor = getColorForName(organization.name || "Org");
              const initials = getInitials(organization.name || "Org");
              const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
              const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
              const isActive = organization.isActive ?? true;
              const projectsCount =
                organization.projectsCount ?? organization.activeProjects ?? (organization as any).projectCount ?? 0;

              return (
                <article key={organization.id} className="org-card" style={{ position: "relative" }}>
                  <div className="org-card-header">
                    <div className="org-card-avatar" style={{ backgroundColor: bgColor }}>
                      {initials}
                    </div>
                    <div className="org-card-title-area">
                      <div className="org-card-title-row">
                        <h3 className="org-card-title">{organization.name}</h3>
                        {canManageOrg && (
                          <OrgActionsMenu
                            organization={organization}
                            onRenamed={handleOrgRenamed}
                            onToggledActive={handleOrgToggledActive}
                            onDeleted={handleOrgDeleted}
                          />
                        )}
                      </div>
                      <p className="org-card-meta" title={createdLabel ? `Criada em ${createdLabel}` : undefined}>
                        {projectsCount} projeto(s) ativos - {organization.role}
                      </p>
                      <p className="org-card-plan">Plano: {planName}</p>
                    </div>
                  </div>

                  <div className="org-card-footer">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!isActive}
                      onClick={() => onSelect(organization.id)}
                    >
                      Entrar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizationSelector;
