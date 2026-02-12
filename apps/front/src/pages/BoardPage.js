import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOutletContext } from "react-router-dom";
import { KanbanBoard } from "../components/KanbanBoard";
const BoardPage = () => {
    const { kanbanColumns, boardError, onCreateTask, onDragTask, onReloadProjectBoard, newTaskTitle, onTaskTitleChange, newTaskColumn, onTaskColumnChange } = useOutletContext();
    return (_jsxs("section", { className: "board-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("h1", { children: "Board" }), boardError && _jsx("p", { className: "error-text", children: boardError })] }), _jsx(KanbanBoard, { columns: kanbanColumns, onDragEnd: onDragTask, onCreate: onCreateTask, onTaskClick: onReloadProjectBoard, newTaskTitle: newTaskTitle, onTaskTitleChange: onTaskTitleChange, newTaskColumn: newTaskColumn, onTaskColumnChange: onTaskColumnChange })] }));
};
export default BoardPage;
