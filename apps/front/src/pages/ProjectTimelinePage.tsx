import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { GanttTimeline } from "../components/DashboardLayout";

export const ProjectTimelinePage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedProject,
    selectedProjectId,
    onProjectChange,
    projectTimelineData,
    projectTimelineLoading,
    projectTimelineError
  } = useOutletContext<DashboardOutletContext>();

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

  const tasks = projectTimelineData?.tasks ?? [];
  const milestones = projectTimelineData?.milestones ?? [];

  return (
    <section className="project-timeline-page">
      <header className="page-header">
        <div>
          <h1>Cronograma do Projeto</h1>
          <p>{selectedProject?.projectName ?? selectedProject?.name ?? "Projeto"}</p>
        </div>
        {projectTimelineError && <p className="error-text">{projectTimelineError}</p>}
        {projectTimelineLoading && <p className="muted">Carregando cronograma...</p>}
      </header>

      <GanttTimeline tasks={tasks} milestones={milestones} />
    </section>
  );
};
