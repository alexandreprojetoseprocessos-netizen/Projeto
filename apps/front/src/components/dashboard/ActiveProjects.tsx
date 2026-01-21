import { ChevronRight } from "lucide-react";

type ActiveProject = {
  id: string;
  name: string;
  progress: number;
  statusLabel: string;
  period: string;
  membersLabel: string;
  tasksLabel: string;
  isPlaceholder?: boolean;
};

type ActiveProjectsProps = {
  projects: ActiveProject[];
  onOpenProject: (projectId: string) => void;
};

export const ActiveProjects = ({ projects, onOpenProject }: ActiveProjectsProps) => (
  <section className="dashboard-card dashboard-hover">
    <div className="dashboard-card-header">
      <div>
        <h3 className="dashboard-card-title">Projetos Ativos</h3>
        <p className="dashboard-muted">Acompanhe os projetos com maior impacto.</p>
      </div>
      <span className="dashboard-link">Ver todos</span>
    </div>
    {projects.length === 0 ? (
      <div className="dashboard-empty">Nenhum projeto ativo encontrado.</div>
    ) : (
      <div className="dashboard-projects-grid">
        {projects.map((project) => {
          const initial = project.name ? project.name.trim().charAt(0).toUpperCase() : "?";
          return (
            <article
              key={project.id}
              className={`dashboard-project-card ${project.isPlaceholder ? "is-placeholder" : ""}`}
            >
              <div className="dashboard-project-top">
                <div className="dashboard-project-avatar">{initial}</div>
                <div>
                  <div className="dashboard-project-title">{project.name}</div>
                  <div className="dashboard-project-desc">{project.statusLabel}</div>
                </div>
              </div>
              <div className="dashboard-project-progress">
                <div className="dashboard-progress-track">
                  <div className="dashboard-progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="dashboard-progress-value">{project.progress}%</span>
              </div>
              <div className="dashboard-project-meta">
                <span>{project.tasksLabel}</span>
                <span>{project.membersLabel}</span>
                <span>{project.period}</span>
              </div>
              {!project.isPlaceholder && (
                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() => onOpenProject(project.id)}
                >
                  Ver detalhes
                  <ChevronRight className="dashboard-link-icon" />
                </button>
              )}
            </article>
          );
        })}
      </div>
    )}
  </section>
);
