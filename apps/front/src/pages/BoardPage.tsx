import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { KanbanBoard } from "../components/KanbanBoard";

const BoardPage = () => {
  const {
    kanbanColumns,
    boardError,
    onCreateTask,
    onDragTask,
    onReloadProjectBoard,
    newTaskTitle,
    onTaskTitleChange,
    newTaskColumn,
    onTaskColumnChange
  } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="board-page">
      <header className="page-header">
        <h1>Board</h1>
        {boardError && <p className="error-text">{boardError}</p>}
      </header>

      <KanbanBoard
        columns={kanbanColumns}
        onDragEnd={onDragTask}
        onCreate={onCreateTask}
        onTaskClick={onReloadProjectBoard}
        newTaskTitle={newTaskTitle}
        onTaskTitleChange={onTaskTitleChange}
        newTaskColumn={newTaskColumn}
        onTaskColumnChange={onTaskColumnChange}
      />
    </section>
  );
};

export default BoardPage;
