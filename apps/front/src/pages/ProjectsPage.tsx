import { useState, type FormEvent, type ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import { ProjectPortfolio, type PortfolioProject } from "../components/ProjectPortfolio";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { canManageProjects, type OrgRole } from "../components/permissions";

type FirstProjectPayload = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

const FirstProjectOnboarding = ({
  onCreateProject
}: {
  onCreateProject: (payload: FirstProjectPayload) => Promise<void> | void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível criar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-empty-card workspace-project-onboarding">
      <h2>Passo 2 de 3: Crie seu primeiro projeto</h2>
      <p>
        Agora que sua organização está criada, vamos configurar o primeiro projeto. Você poderá adicionar tarefas,
        equipe, cronograma e relatórios depois.
      </p>

      {error && <p className="error-text">{error}</p>}

      <form className="workspace-form" onSubmit={handleSubmit}>
        <label className="input-group">
          <span>Nome do projeto</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Implantação do sistema na Clínica X"
            required
          />
        </label>

        <label className="input-group">
          <span>Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Resumo do objetivo do projeto..."
            rows={3}
          />
        </label>

        <div className="workspace-form-row">
          <label className="input-group">
            <span>Data de início (opcional)</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="input-group">
            <span>Data de término (opcional)</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar projeto e continuar"}
        </button>
      </form>
    </div>
  );
};

const NewProjectModal = ({
  isOpen,
  onClose,
  children,
  title = "Novo projeto",
  subtitle = "Planeje um novo trabalho informando os dados basicos do projeto no portfolio."
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="gp-modal-backdrop" onClick={onClose}>
      <div
        className="gp-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        <div className="gp-modal-header">
          <h2 id="new-project-title">{title}</h2>
          <button type="button" className="gp-modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="gp-modal-subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
};

const ProjectLimitModal = ({
  isOpen,
  onClose,
  maxProjects
}: {
  isOpen: boolean;
  onClose: () => void;
  maxProjects: number | null;
}) => {
  if (!isOpen) return null;

  return (
    <div className="gp-modal-backdrop" onClick={onClose}>
      <div className="gp-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="gp-modal-header">
          <h2>Limite do plano</h2>
          <button type="button" className="gp-modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="gp-modal-subtitle">
          {maxProjects === null
            ? "Seu plano atual não possui limite de projetos."
            : `Seu plano permite até ${maxProjects} projetos. Exclua ou mova um projeto para continuar.`}
        </p>
        <p className="muted">Projetos desativados contam para o limite do plano.</p>
        <div className="gp-modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProjectsPage = () => {
  const {
    portfolio,
    portfolioError,
    portfolioLoading,
    projectsError,
    onExportPortfolio,
    selectedProjectId,
    organizations,
    selectedOrganizationId,
    onProjectChange,
    onCreateProject,
    onUpdateProject,
    currentOrgRole,
    projectLimits
  } = useOutletContext<DashboardOutletContext>();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    startDate: "",
    endDate: "",
    budget: "",
    repositoryUrl: "",
    teamMembers: "",
    description: ""
  });

  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;
  const canCreateProjects = canManageProjects(orgRole);
  const currentOrganization = organizations?.find((organization) => organization.id === selectedOrganizationId) ?? null;
  const resetForm = () => {
    setForm({
      name: "",
      clientName: "",
      startDate: "",
      endDate: "",
      budget: "",
      repositoryUrl: "",
      teamMembers: "",
      description: ""
    });
  };

  const handleCreateFirstProject = async (payload: FirstProjectPayload) => {
    await onCreateProject({
      name: payload.name,
      clientName: payload.description ?? "Cliente",
      budget: 0,
      repositoryUrl: "",
      startDate: payload.startDate,
      endDate: payload.endDate,
      description: payload.description,
      teamMembers: []
    });
  };

  const hasProjects = Boolean(portfolio && portfolio.length > 0);
  const isAtProjectLimit = projectLimits?.remaining === 0;
  const isEditing = Boolean(editingProject);
  const modalTitle = isEditing ? "Editar projeto" : "Novo projeto";
  const modalSubtitle = isEditing ? "Atualize as informacoes do projeto." : undefined;
  const modalSubmitLabel = isEditing ? "Salvar alteracoes" : "Criar projeto";
  const modalSubmitLoadingLabel = isEditing ? "Salvando..." : "Criando...";

  const handleOpenCreateModal = () => {
    if (isAtProjectLimit) return;
    setEditingProject(null);
    setIsEditModalOpen(false);
    setCreateError(null);
    setFieldErrors({});
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (project: PortfolioProject) => {
    const members = Array.isArray(project.teamMembers)
      ? project.teamMembers
      : Array.isArray(project.members)
        ? project.members
            .map((member) => member?.name ?? member?.email ?? "")
            .filter(Boolean)
        : [];
    const budgetValue = project.budget === null || project.budget === undefined ? "" : String(project.budget);
    setForm({
      name: project.projectName ?? "",
      clientName: project.clientName ?? currentOrganization?.name ?? "",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      budget: budgetValue,
      repositoryUrl: project.repositoryUrl ?? "",
      teamMembers: members.join(", "),
      description: project.description ?? ""
    });
    setEditingProject(project);
    setIsEditModalOpen(true);
    setIsCreateModalOpen(false);
    setCreateError(null);
    setFieldErrors({});
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingProject(null);
    setCreateError(null);
    setFieldErrors({});
    resetForm();
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!form.name.trim()) errors.name = "Informe o nome do projeto.";
    if (!form.startDate) errors.startDate = "Informe a data de início.";
    if (!form.endDate) errors.endDate = "Informe a data de conclusão.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setCreateError(null);

    const payload = {
      name: form.name.trim(),
      clientName: currentOrganization?.name ?? form.clientName.trim(),
      budget: Number(form.budget) || 0,
      repositoryUrl: form.repositoryUrl.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      description: form.description.trim() || undefined,
      teamMembers: form.teamMembers
        .split(",")
        .map((member) => member.trim())
        .filter(Boolean)
    };

    try {
      if (isEditing && editingProject) {
        await onUpdateProject(editingProject.projectId, payload);
      } else {
        await onCreateProject(payload);
      }
      handleCloseModal();
    } catch (error: any) {
      const code = error?.body?.code;
      if (!isEditing && (code === "PLAN_LIMIT_REACHED" || code === "PROJECT_LIMIT_REACHED")) {
        setCreateError(null);
        setIsLimitModalOpen(true);
        return;
      }
      const fallbackMessage = isEditing ? "Erro ao salvar projeto" : "Erro ao criar projeto";
      const message = error?.body?.message ?? (error instanceof Error ? error.message : fallbackMessage);
      setCreateError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container projects-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">Portfólio</p>
          <h1 className="page-title">Projetos</h1>
          <p className="page-subtitle">Filtros avançados e troca de visualização entre cards e tabela.</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={handleOpenCreateModal}
          disabled={isAtProjectLimit}
        >
          + Novo projeto
        </button>
        {isAtProjectLimit && (
          <div className="projects-limit-hint">
            <div>
              Você atingiu o limite de projetos do seu plano atual ({projectLimits?.used} de {projectLimits?.max}). Arquive
              ou exclua um projeto para criar outro.
            </div>
            <button type="button" className="link-button" onClick={() => setIsLimitModalOpen(true)}>
              Entenda o limite
            </button>
            <div className="muted">Projetos desativados contam para o limite do plano.</div>
          </div>
        )}
      </header>

      {projectsError && <p className="error-text">{projectsError}</p>}

      {portfolioLoading ? (
        <p className="muted">Carregando projetos...</p>
      ) : !hasProjects ? (
        canCreateProjects ? (
          <FirstProjectOnboarding onCreateProject={handleCreateFirstProject} />
        ) : (
          <p className="muted">Você tem acesso apenas para visualizar projetos nesta organização.</p>
        )
      ) : (
        <ProjectPortfolio
          projects={portfolio}
          error={portfolioError}
          isLoading={portfolioLoading}
          onExport={onExportPortfolio}
          selectedProjectId={selectedProjectId}
          onSelectProject={onProjectChange}
          onCreateProject={onCreateProject}
          onEditProject={handleOpenEditModal}
        />
      )}

      <NewProjectModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        subtitle={modalSubtitle}
      >
        <form onSubmit={handleModalSubmit} className="gp-modal-body new-project-form">
          {createError && <div className="gp-alert-error">{createError}</div>}

          <div className="form-field">
            <label htmlFor="projectName">Nome do projeto *</label>
            <input
              id="projectName"
              name="name"
              type="text"
              className="gp-input"
              value={form.name ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ex.: Implantação ERP 2025"
              required
            />
            {fieldErrors.name && <small className="input-error">{fieldErrors.name}</small>}
          </div>

          <div className="form-field">
            <label>Organização do projeto</label>
            <input
              className="gp-input gp-input-readonly"
              type="text"
              value={currentOrganization?.name ?? ""}
              placeholder="Selecione uma organização no topo"
              readOnly
            />
          </div>

          <div className="form-field">
            <label>Início planejado *</label>
            <input
              className="gp-input"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
            {fieldErrors.startDate && <small className="input-error">{fieldErrors.startDate}</small>}
          </div>

          <div className="form-field">
            <label>Conclusão prevista *</label>
            <input
              className="gp-input"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
            {fieldErrors.endDate && <small className="input-error">{fieldErrors.endDate}</small>}
          </div>

          <div className="form-field">
            <label>Orçamento aprovado (R$)</label>
            <input
              className="gp-input gp-input-currency"
              type="text"
              inputMode="decimal"
              value={form.budget}
              onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              placeholder="250000"
            />
          </div>

          <div className="form-field">
            <label>Repositório GitHub</label>
            <input
              className="gp-input"
              type="url"
              value={form.repositoryUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, repositoryUrl: event.target.value }))}
              placeholder="https://github.com/org/projeto"
            />
          </div>

          <div className="form-field form-field-span-2">
            <label>Equipe (e-mails separados por vírgula)</label>
            <textarea
              className="gp-input"
              value={form.teamMembers}
              onChange={(event) => setForm((prev) => ({ ...prev, teamMembers: event.target.value }))}
              placeholder="ana@empresa.com, joao@empresa.com"
              rows={2}
            />
          </div>

          <div className="form-field form-field-span-2">
            <label>Descrição</label>
            <textarea
              className="gp-input"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Objetivos, entregas e premissas iniciais..."
              rows={3}
            />
          </div>

          <div className="gp-modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !currentOrganization}>
              {isSubmitting ? modalSubmitLoadingLabel : modalSubmitLabel}
            </button>
          </div>
        </form>
      </NewProjectModal>

      <ProjectLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        maxProjects={projectLimits?.max ?? null}
      />
    </div>
  );
};
