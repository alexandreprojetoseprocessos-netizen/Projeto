import { useOutletContext } from "react-router-dom";
import { ProjectPortfolio } from "../components/ProjectPortfolio";
import type { DashboardOutletContext } from "../components/DashboardLayout";

export const ProjectsPage = () => {
  const {
    portfolio,
    portfolioError,
    portfolioLoading,
    onExportPortfolio,
    selectedProjectId,
    onProjectChange
  } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="projects-page">
      <header className="page-header">
        <p className="eyebrow">Portfólio</p>
        <h1>Projetos</h1>
      </header>

      <ProjectPortfolio
        projects={portfolio}
        error={portfolioError}
        isLoading={portfolioLoading}
        onExport={onExportPortfolio}
        selectedProjectId={selectedProjectId}
        onSelectProject={onProjectChange}
      />
    </section>
  );
};
