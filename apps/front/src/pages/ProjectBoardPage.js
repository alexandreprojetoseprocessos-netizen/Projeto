import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { KanbanBoard } from "../components/KanbanBoard";
export const ProjectBoardPage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectBoardColumns, projectBoardError, onMoveProjectTask, onCreateProjectTask, onReloadProjectBoard, newProjectTaskTitle, onProjectTaskTitleChange, newProjectTaskColumn, onProjectTaskColumnChange } = useOutletContext();
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    return (_jsxs("section", { className: "project-board-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Board do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? "Projeto" })] }), projectBoardError && _jsx("p", { className: "error-text", children: projectBoardError })] }), _jsx(KanbanBoard, { columns: projectBoardColumns ?? [], onDragEnd: onMoveProjectTask ?? (() => { }), onCreate: onCreateProjectTask ?? (async () => false), onTaskClick: onReloadProjectBoard
                    ? () => {
                        void onReloadProjectBoard();
                    }
                    : undefined, newTaskTitle: newProjectTaskTitle ?? "", onTaskTitleChange: onProjectTaskTitleChange ?? (() => { }), newTaskColumn: newProjectTaskColumn ?? "", onTaskColumnChange: onProjectTaskColumnChange ?? (() => { }) })] }));
};
