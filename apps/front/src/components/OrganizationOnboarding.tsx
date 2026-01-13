import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PauseCircle, Trash2 } from "lucide-react";
import OrgActionsMenu from "./OrgActionsMenu";
import OrgStatusModal from "./OrgStatusModal";
import { canManageOrganizationSettings, type OrgRole } from "./permissions";
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
    <div className="org-page">
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

      <div className="page-header">
        <div className="page-header-kicker">BEM-VINDO(A)</div>
        <h1 className="page-header-title">Criar nova organização</h1>
        <p className="page-header-subtitle">
          A organização representa sua empresa, clínica ou negócio. É aqui que você concentra projetos, pessoas e
          documentos.
        </p>
      </div>

      <div className="org-grid">
        <div className="org-left-column">
          <section id="org-create-section" className="form-card org-form-card">
            <h3>Nova organização</h3>
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
                  Dominio (opcional)
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

          <div className="org-status-row">
            <button
              type="button"
              className="org-status-box"
              onClick={() => setShowDeactivatedModal(true)}
            >
              <PauseCircle className="status-icon status-icon--paused" />
              <span>Desativados</span>
            </button>

            <button
              type="button"
              className="org-status-box"
              onClick={() => setShowTrashModal(true)}
            >
              <Trash2 className="status-icon status-icon--trash" />
              <span>Lixeira (90 dias)</span>
            </button>
          </div>
        </div>

        <div className="plan-card org-plan-card">
          <div>
            <span className="plan-badge">Plano atual</span>
            <div className="plan-title">{planName}</div>
          </div>
          <h3>Detalhes do plano</h3>

          {userEmail && (
            <div className="email-box">
              <div className="org-responsible-label">Responsável pelas organizações</div>
              <div className="org-responsible-email">{userEmail}</div>
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

          <button type="button" className="button-primary org-plan-button" onClick={() => navigate("/plano")}>
            Ver detalhes do plano
          </button>
        </div>
      </div>

      <section className="org-list-section">
        <h2 className="org-section-title">Suas organizações</h2>
        <p className="org-section-subtitle">
          Escolha onde você quer trabalhar hoje.
        </p>
        {orgList.length === 0 ? (
          <div className="org-empty">
            <h3>Nenhuma organização cadastrada ainda</h3>
            <p>
              Crie a sua primeira organização para começar a estruturar seus projetos. Você pode adicionar quantas
              precisar dentro do seu plano.
            </p>
            <button type="button" className="primary-button" onClick={scrollToCreate}>
              Criar primeira organização
            </button>
          </div>
        ) : (
          <div className="org-list-grid">
            {orgList.map((organization) => {
            const bgColor = getColorForName(organization.name || "Org");
            const initials = getInitials(organization.name || "Org");
            const createdAt = organization.createdAt ? new Date(organization.createdAt) : null;
            const createdLabel = createdAt ? createdAt.toLocaleDateString("pt-BR") : null;
            const isActive = organization.isActive ?? true;
            const canManageThisOrg = canManageOrganizationSettings(
              (currentOrgRole ?? organization.role ?? null) as OrgRole | null
            );
            const projectsCount =
              organization.projectsCount ?? organization.activeProjects ?? (organization as any).projectCount ?? 0;

              return (
                <div className="org-card" key={organization.id}>
                  <div className="org-card-left">
                    <div className="org-card-avatar" style={{ backgroundColor: bgColor }}>
                      {initials}
                    </div>

                    <div className="org-card-info">
                      <div className="org-card-header-row">
                        <span className="org-card-name">{organization.name}</span>
                      </div>

                      {canManageThisOrg && (
                        <div className="org-actions-row org-card-actions-inline">
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

                      <div className="org-card-meta" title={createdLabel ? `Criada em ${createdLabel}` : undefined}>
                        {projectsCount} projeto(s) ativos {"\u00b7"} {organization.role} {"\u00b7"} Plano: {planName}
                      </div>
                    </div>
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
          </div>
        )}
      </section>

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


