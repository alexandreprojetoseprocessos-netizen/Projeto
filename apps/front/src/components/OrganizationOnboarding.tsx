import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Crown, PauseCircle, ShieldCheck, Trash2, Workflow } from "lucide-react";
import OrgActionsMenu from "./OrgActionsMenu";
import OrgStatusModal from "./OrgStatusModal";
import { AppPageHero, AppStateCard } from "./AppPageHero";
import { canManageOrganizationSettings, type OrgRole } from "./permissions";

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
  onCreateOrganization?: (name: string, domain?: string) => void | Promise<void>;
  userEmail?: string | null;
  organizationLimits?: {
    planCode: string | null;
    max: number | null;
    used: number;
    remaining: number | null;
  } | null;
  currentOrgRole?: OrgRole | null;
  onReloadOrganizations?: () => void;
};

export const OrganizationSelector = ({
  organizations,
  onSelect,
  onCreateOrganization,
  userEmail,
  organizationLimits,
  currentOrgRole,
  onReloadOrganizations
}: OrganizationSelectorProps) => {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [orgList, setOrgList] = useState<OrganizationCard[]>(organizations);
  const [creating, setCreating] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
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
  const totalSlotsLabel = max === null ? "ilimitadas" : `${used} de ${max}`;
  const organizationsPercent =
    max === null || max === 0 ? 100 : Math.min(100, Math.round((used / max) * 100));
  const limitReachedTitle = !canCreateMore ? "Limite de organizações do seu plano atingido." : undefined;
  const onboardingSteps = [
    {
      title: "1. Criar organização",
      description: "Defina o ambiente principal onde projetos, equipe e documentos vão viver."
    },
    {
      title: "2. Escolher contexto",
      description: "Entre na organização correta para operar com o escopo certo desde o início."
    },
    {
      title: "3. Abrir o primeiro projeto",
      description: "Depois do ambiente criado, o fluxo segue para o primeiro cadastro do portfólio."
    }
  ];

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

  const handleOrgStatusChange = (orgId: string, status?: string) => {
    if (status && status !== "ACTIVE") {
      setOrgList((current) => current.filter((org) => org.id !== orgId));
    }
    onReloadOrganizations?.();
  };

  const isCreateDisabled = !canCreateMore || creating || !newOrgName.trim();

  return (
    <div className="org-onboarding">
      {showLimitBanner && (
        <div className="org-limit-banner">
          <div className="org-limit-stripe" />
          <div className="org-limit-content">
            <strong>Você atingiu o limite de organizações do seu plano.</strong>
            <span>
              Para criar novas organizações, atualize seu plano em{" "}
              <button type="button" className="link-button" onClick={() => navigate("/plano")}>
                Meu plano
              </button>
              .
            </span>
          </div>
        </div>
      )}

      <AppPageHero
        className="orgOnboardingHero"
        kicker="Onboarding inicial"
        title="Criar nova organização"
        subtitle="A organização representa sua empresa, clínica ou negócio. É aqui que você concentra projetos, pessoas e documentos."
        actions={
          <div className="org-onboarding-hero-actions">
            <button type="button" className="primary-button" disabled={!canCreateMore} onClick={scrollToCreate}>
              Criar nova organização
            </button>
            <button type="button" className="button-outline org-plan-button" onClick={() => navigate("/plano")}>
              Ver detalhes do plano
            </button>
          </div>
        }
        stats={[
          {
            label: "Plano atual",
            value: planName,
            helper: userEmail ?? "Conta principal do workspace",
            icon: <Crown size={18} />,
            tone: "default"
          },
          {
            label: "Organizações usadas",
            value: used,
            helper: max === null ? "Sem limite contratado" : `Capacidade total ${max}`,
            icon: <Building2 size={18} />,
            tone: "info"
          },
          {
            label: "Disponibilidade",
            value: max === null ? "Livre" : remaining ?? 0,
            helper: max === null ? "Criação livre no plano atual" : "Vagas restantes no plano",
            icon: <ShieldCheck size={18} />,
            tone: canCreateMore ? "success" : "danger"
          },
          {
            label: "Fluxo",
            value: "3 etapas",
            helper: "Organização, contexto e primeiro projeto",
            icon: <Workflow size={18} />,
            tone: "warning"
          }
        ]}
      />

      <section className="org-onboarding-journey">
        {onboardingSteps.map((step) => (
          <article key={step.title} className="org-onboarding-step">
            <strong>{step.title}</strong>
            <p>{step.description}</p>
          </article>
        ))}
      </section>

      <div className="org-grid">
        <div className="org-left-column">
          <section id="org-create-section" className="org-card org-create-card">
            <div className="org-card-head">
              <div className="org-card-icon">
                <Building2 className="org-card-icon-svg" />
              </div>
              <h3>Nova organização</h3>
            </div>
            <form className="org-form" onSubmit={handleSubmit} ref={formRef}>
              <div className="form-group">
                <label>
                  Nome da organização
                  <input
                    type="text"
                    placeholder="Ex.: Minha empresa LTDA"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Domínio (opcional)
                  <input
                    type="text"
                    placeholder="ex: minhaempresa.com"
                    value={newOrgDomain}
                    onChange={(e) => setNewOrgDomain(e.target.value)}
                  />
                </label>
              </div>

              <span title={limitReachedTitle}>
                <button
                  type="submit"
                  className="primary-button org-create-button"
                  disabled={isCreateDisabled}
                  aria-disabled={isCreateDisabled}
                >
                  {creating ? "Criando..." : "Criar nova organização"}
                </button>
              </span>
            </form>
          </section>

          <div className="org-quick-actions">
            <button
              type="button"
              className="org-quick-card"
              onClick={() => setShowDeactivatedModal(true)}
            >
              <div className="org-quick-icon is-muted">
                <PauseCircle className="org-quick-icon-svg" />
              </div>
              <span>Desativados</span>
            </button>

            <button
              type="button"
              className="org-quick-card"
              onClick={() => setShowTrashModal(true)}
            >
              <div className="org-quick-icon is-accent">
                <Trash2 className="org-quick-icon-svg" />
              </div>
              <span>Lixeira (90 dias)</span>
            </button>
          </div>

          <section className="org-list-section">
            <div className="org-list-header">
              <div>
                <h2 className="org-section-title">Suas organizações</h2>
                <p className="org-section-subtitle">Escolha onde você quer trabalhar hoje.</p>
              </div>
            </div>
            <div className="org-list-divider" />
            {orgList.length === 0 ? (
              <AppStateCard
                className="org-empty-card"
                tone="warning"
                title="Nenhuma organização cadastrada ainda"
                description="Crie a sua primeira organização para começar a estruturar projetos, equipes e documentos em um ambiente único."
                action={
                  <button type="button" className="primary-button" onClick={scrollToCreate}>
                    Criar primeira organização
                  </button>
                }
              />
            ) : (
              <div className="org-list-grid">
                {orgList.map((organization) => {
                  const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
                  const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
                  const isActive = organization.isActive ?? true;
                  const canManageThisOrg = canManageOrganizationSettings(
                    (currentOrgRole ?? organization.role ?? null) as OrgRole | null
                  );
                  const projectsCount =
                    organization.projectsCount ?? organization.activeProjects ?? (organization as any).projectCount ?? 0;
                  const membersCount =
                    (organization as any).membersCount ??
                    (organization as any).members?.length ??
                    (organization as any).usersCount ??
                    0;

                  return (
                    <div className="org-card org-item-card" key={organization.id}>
                      <div className="org-card-left">
                        <div className="org-card-avatar">
                          <Building2 className="org-card-avatar-icon" />
                        </div>

                        <div className="org-card-info">
                          <div className="org-card-header-row">
                            <span className="org-card-name">{organization.name}</span>
                          </div>

                          <div className="org-card-meta" title={createdLabel ? `Criada em ${createdLabel}` : undefined}>
                            {projectsCount} projetos {"\u2022"} {membersCount} membros
                          </div>
                        </div>
                      </div>

                      <div className="org-card-right">
                        {canManageThisOrg && (
                          <div className="org-actions-row">
                            <OrgActionsMenu
                              organization={organization}
                              onRenamed={handleOrgRenamed}
                              onToggledActive={handleOrgToggledActive}
                              onDeleted={handleOrgDeleted}
                              onStatusChange={handleOrgStatusChange}
                              mode="menu"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          className="org-card-action"
                          disabled={!isActive}
                          onClick={() => onSelect(organization.id)}
                          aria-label="Entrar"
                          title="Entrar"
                        >
                          <span className="org-card-action-text">Entrar</span>
                          <ChevronRight className="org-card-action-icon" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="org-plan-column">
          <div className="org-card org-plan-card">
            <div className="org-plan-header">
              <span className="plan-badge">Plano Atual</span>
              <Crown className="org-plan-icon" />
            </div>
            <div className="org-plan-name">{planName}</div>
            <p className="org-plan-section-title">Detalhes do plano</p>

            {userEmail && (
              <div className="org-plan-pill">
                <div className="org-plan-pill-label">Responsável pelas organizações</div>
                <div className="org-plan-pill-value">{userEmail}</div>
              </div>
            )}

            <div className="org-plan-body">
              <p className="org-plan-label">Organizações incluídas</p>
              <p className="org-plan-value">{totalSlotsLabel}</p>

              <div className="org-plan-progress">
                <div className="org-plan-progress-fill" style={{ width: `${organizationsPercent}%` }} />
              </div>

              <p className="org-plan-helper">
                Use esta conta para centralizar suas empresas, clínicas ou unidades.
              </p>
            </div>

            <button type="button" className="button-outline org-plan-button" onClick={() => navigate("/plano")}>
              Ver detalhes do plano
            </button>
          </div>
        </div>
      </div>

      <OrgStatusModal
        type="DEACTIVATED"
        open={showDeactivatedModal}
        onClose={() => setShowDeactivatedModal(false)}
        onReload={onReloadOrganizations}
        limitMax={organizationLimits?.max ?? null}
      />

      <OrgStatusModal
        type="SOFT_DELETED"
        open={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        onReload={onReloadOrganizations}
        limitMax={organizationLimits?.max ?? null}
      />
    </div>
  );
};

export default OrganizationSelector;


