import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { GanttTimeline } from "../components/DashboardLayout";
export const ProjectTimelinePage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectTimelineData, projectTimelineLoading, projectTimelineError } = useOutletContext();
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    const tasks = projectTimelineData?.tasks ?? [];
    const milestones = projectTimelineData?.milestones ?? [];
    return (_jsxs("section", { className: "project-timeline-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Cronograma do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? "Projeto" })] }), projectTimelineError && _jsx("p", { className: "error-text", children: projectTimelineError }), projectTimelineLoading && _jsx("p", { className: "muted", children: "Carregando cronograma..." })] }), _jsx(GanttTimeline, { tasks: tasks, milestones: milestones })] }));
};
