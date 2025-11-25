import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";

export const ProjectActivitiesPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedProject,
    selectedProjectId,
    onProjectChange,
    projectActivities,
    projectActivitiesLoading,
    projectActivitiesError
  } = useOutletContext<DashboardOutletContext>();

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

  return (
    <section className="project-activities-page">
      <header className="page-header">
        <div>
          <h1>Atividades do Projeto</h1>
          <p>{selectedProject?.projectName ?? selectedProject?.name ?? "Projeto"}</p>
        </div>
      </header>

      {projectActivitiesLoading && <p className="muted">Carregando atividades...</p>}
      {projectActivitiesError && <p className="error-text">Erro: {projectActivitiesError}</p>}

      <div className="activities-timeline">
        {(projectActivities ?? []).map((activity: any) => (
          <div key={activity.id ?? activity.title} className="activity-item">
            <div className="activity-header">
              <strong>{activity.title ?? activity.type ?? "Atividade"}</strong>
              <span>{activity.createdAtFormatted ?? activity.createdAt ?? activity.date ?? ""}</span>
            </div>
            <p className="activity-description">{activity.description ?? activity.body ?? ""}</p>
            {activity.userName && <span className="activity-user">{activity.userName}</span>}
          </div>
        ))}
      </div>
    </section>
  );
};
