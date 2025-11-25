import { useMemo, type SVGProps } from "react";
import { useOutletContext } from "react-router-dom";
import { ProjectPortfolio } from "../components/ProjectPortfolio";
import type { DashboardOutletContext } from "../components/DashboardLayout";

type IconProps = SVGProps<SVGSVGElement>;
type KPIIcon = (props: IconProps) => JSX.Element;

const svgStrokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round"
} as const;

const BriefcaseIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <path d="M6 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M16 7H8" />
    <path d="M12 12v3" />
  </svg>
);

const ListChecksIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <rect x="3" y="4" width="10" height="16" rx="2" />
    <path d="M8 8h3" />
    <path d="M8 12h3" />
    <path d="M8 16h3" />
    <path d="M17 8l2 2 3-3" />
    <path d="M17 14l2 2 3-3" />
  </svg>
);

const AlertTriangleIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ClockIcon: KPIIcon = (props) => (
  <svg viewBox="0 0 24 24" {...svgStrokeProps} {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5l3 2" />
  </svg>
);

export const DashboardPage = () => {
  const {
    organizations,
    selectedOrganizationId,
    onOrganizationChange,
    projects,
    selectedProjectId,
    onProjectChange,
    onSignOut,
    handleOpenProjectModal,
    portfolio,
    portfolioError,
    portfolioLoading,
    onExportPortfolio,
    handleViewProjectDetails,
    kanbanColumns,
    summary,
    projectToast,
    orgError,
    projectsError
  } = useOutletContext<DashboardOutletContext>();

  const flattenedTasks = useMemo(
    () => kanbanColumns.flatMap((column) => column.tasks.map((task) => ({ ...task, column: column.title }))),
    [kanbanColumns]
  );

  const kpis: Array<{ label: string; value: string | number; sub: string; Icon: KPIIcon }> = useMemo(
    () => [
      {
        label: "Projetos ativos",
        value: projects.length,
        sub: `${organizations.length} organizações`,
        Icon: BriefcaseIcon
      },
      {
        label: "Tarefas em andamento",
        value: flattenedTasks.filter((task) => task.status === "IN_PROGRESS").length,
        sub: "Hoje",
        Icon: ListChecksIcon
      },
      {
        label: "Tarefas atrasadas",
        value: summary?.overdueTasks ?? 0,
        sub: "Priorizar",
        Icon: AlertTriangleIcon
      },
      {
        label: "Horas registradas (14d)",
        value: summary?.hoursTracked?.toFixed ? summary.hoursTracked.toFixed(1) : "0.0",
        sub: "Últimos 14 dias",
        Icon: ClockIcon
      }
    ],
    [flattenedTasks, organizations.length, projects.length, summary]
  );

  const heroSection = (
    <section className="hero-card">
      <div>
        <p className="eyebrow">Bem-vindo(a)</p>
        <h1>Visão geral do trabalho</h1>
        <p className="subtext">Acompanhe o progresso dos projetos, tarefas e riscos em tempo real.</p>
      </div>
      <div className="hero-selectors">
        <label>
          Organização
          <select value={selectedOrganizationId ?? ""} onChange={(event) => onOrganizationChange(event.target.value)}>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.role})
              </option>
            ))}
          </select>
        </label>
        {projects.length > 0 && (
          <label>
            Projeto
            <select value={selectedProjectId ?? ""} onChange={(event) => onProjectChange(event.target.value)}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="hero-meta">
        <button type="button" className="secondary-button" onClick={handleOpenProjectModal}>
          Criar projeto
        </button>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </section>
  );

  const renderProjectsList = () => (
    <ProjectPortfolio
      projects={portfolio}
      error={portfolioError}
      isLoading={portfolioLoading}
      onExport={onExportPortfolio}
      selectedProjectId={selectedProjectId ?? ""}
      onSelectProject={onProjectChange}
      onCreateProject={handleOpenProjectModal}
      onViewProjectDetails={handleViewProjectDetails}
    />
  );

  return (
    <>
      {heroSection}

      {projectToast && <p className="success-text">{projectToast}</p>}
      {orgError && <p className="error-text">{orgError}</p>}
      {projectsError && <p className="error-text">{projectsError}</p>}

      <section className="summary-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.Icon;
          return (
            <article key={kpi.label} className="summary-card">
              <div className="summary-card__header">
                <div className="summary-card__icon" aria-hidden="true">
                  <Icon width={18} height={18} />
                </div>
                <span>{kpi.label}</span>
              </div>
              <span className="summary-card__divider" />
              <strong>{kpi.value}</strong>
              <small>{kpi.sub}</small>
            </article>
          );
        })}
      </section>

      {renderProjectsList()}
    </>
  );
};
