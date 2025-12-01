import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../hooks/useDashboardData";

const formatMetricValue = (value: number | null | undefined) =>
  value === null || value === undefined ? "–" : value;

const formatHours = (value: number | null | undefined) =>
  value === null || value === undefined ? "–" : `${value.toFixed(1)}h`;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    activeProjectsCount,
    runningTasksCount,
    riskProjectsCount,
    loggedHoursLast14Days,
    highlightedProjects,
    portfolioSummary,
    recentActivities,
    projectToast,
    orgError,
    projectsError
  } = useDashboardData();

  const metrics = [
    { label: "Projetos ativos", value: formatMetricValue(activeProjectsCount), sub: "+3 este mês" },
    { label: "Tarefas em andamento", value: formatMetricValue(runningTasksCount), sub: "esta semana" },
    { label: "Em risco", value: formatMetricValue(riskProjectsCount), sub: "necessitam atenção" },
    {
      label: "Horas registradas (14d)",
      value: formatHours(loggedHoursLast14Days),
      sub: "últimos 14 dias"
    }
  ];

  const summaryList = [
    `Projetos ativos: ${formatMetricValue(portfolioSummary.activeProjectsCount)}`,
    `Tarefas em andamento: ${formatMetricValue(portfolioSummary.runningTasksCount)}`,
    `Projetos em risco: ${formatMetricValue(portfolioSummary.riskProjectsCount)}`,
    `Tarefas atrasadas: ${formatMetricValue(portfolioSummary.overdueTasksCount)}`
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Visão geral do trabalho</h1>
      <p className="page-subtitle">Acompanhe o progresso dos seus projetos, tarefas e riscos em tempo real.</p>

      {projectToast && <p className="success-text">{projectToast}</p>}
      {orgError && <p className="error-text">{orgError}</p>}
      {projectsError && <p className="error-text">{projectsError}</p>}

      <div className="dash-metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="dash-metric-card">
            <span className="dash-metric-label">{metric.label}</span>
            <div className="dash-metric-value">{metric.value}</div>
            <span className="dash-metric-sub">{metric.sub}</span>
          </article>
        ))}
      </div>

      <section>
        <h2 className="section-title">Projetos em destaque</h2>
        <p className="section-subtitle">Filtros avançados e troca de visualização entre cards e tabela.</p>
        <div className="dash-projects-grid">
          {highlightedProjects.length === 0 ? (
            <p className="muted">Nenhum projeto disponível no momento.</p>
          ) : (
            highlightedProjects.map((project) => (
              <article key={project.id} className="dash-project-card">
                <div className="dash-project-header">
                  <span className="dash-project-name">{project.name}</span>
                  <span className={`status-pill status-pill--${project.status}`}>{project.statusLabel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="progress-bar" aria-hidden="true">
                    <div className="progress-bar-fill" style={{ width: `${project.progress}%` }} />
                  </div>
                  <span className="progress-percent">{project.progress}%</span>
                </div>
                <div className="dash-project-meta">
                  <span>📅 {project.period}</span>
                  <span>👥 {project.membersLabel}</span>
                  <span>✅ {project.tasksLabel}</span>
                </div>
                <button type="button" className="link-button" onClick={() => navigate(`/projects/${project.id}`)}>
                  Ver detalhes
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">Resumo rápido</h2>
        <div className="dash-summary-grid">
          <article className="dash-summary-card">
            <div className="summary-title">Portfólio</div>
            <div className="summary-list">
              {summaryList.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <article className="dash-summary-card">
            <div className="summary-title">Atividade recente</div>
            <div className="activity-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <span>
                    {activity.description} • {activity.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
