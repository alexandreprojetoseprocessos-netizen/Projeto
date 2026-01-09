import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { KanbanBoard } from "../components/KanbanBoard";

export const ProjectBoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    selectedProject,
    selectedProjectId,
    onProjectChange,
    projectBoardColumns,
    projectBoardError,
    onMoveProjectTask,
    onCreateProjectTask,
    onReloadProjectBoard,
    newProjectTaskTitle,
    onProjectTaskTitleChange,
    newProjectTaskColumn,
    onProjectTaskColumnChange
  } = useOutletContext<DashboardOutletContext>();

  useEffect(() => {
    if (id && selectedProjectId !== id && onProjectChange) {
      onProjectChange(id);
    }
  }, [id, selectedProjectId, onProjectChange]);

  return (
    <section className="project-board-page">
      <header className="page-header">
        <div>
          <h1>Board do Projeto</h1>
          <p>{selectedProject?.projectName ?? "Projeto"}</p>
        </div>
        {projectBoardError && <p className="error-text">{projectBoardError}</p>}
      </header>

      <KanbanBoard
        columns={projectBoardColumns ?? []}
        onDragEnd={onMoveProjectTask ?? (() => {})}
        onCreate={onCreateProjectTask ?? (async () => false)}
        onTaskClick={
          onReloadProjectBoard
            ? () => {
                void onReloadProjectBoard();
              }
            : undefined
        }
        newTaskTitle={newProjectTaskTitle ?? ""}
        onTaskTitleChange={onProjectTaskTitleChange ?? (() => {})}
        newTaskColumn={newProjectTaskColumn ?? ""}
        onTaskColumnChange={onProjectTaskColumnChange ?? (() => {})}
      />
    </section>
  );
};
