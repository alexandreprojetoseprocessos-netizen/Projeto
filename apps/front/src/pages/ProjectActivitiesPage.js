import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
export const ProjectActivitiesPage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectActivities, projectActivitiesLoading, projectActivitiesError } = useOutletContext();
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    return (_jsxs("section", { className: "project-activities-page", children: [_jsx("header", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Atividades do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? selectedProject?.name ?? "Projeto" })] }) }), projectActivitiesLoading && _jsx("p", { className: "muted", children: "Carregando atividades..." }), projectActivitiesError && _jsxs("p", { className: "error-text", children: ["Erro: ", projectActivitiesError] }), _jsx("div", { className: "activities-timeline", children: (projectActivities ?? []).map((activity) => (_jsxs("div", { className: "activity-item", children: [_jsxs("div", { className: "activity-header", children: [_jsx("strong", { children: activity.title ?? activity.type ?? "Atividade" }), _jsx("span", { children: activity.createdAtFormatted ?? activity.createdAt ?? activity.date ?? "" })] }), _jsx("p", { className: "activity-description", children: activity.description ?? activity.body ?? "" }), activity.userName && _jsx("span", { className: "activity-user", children: activity.userName })] }, activity.id ?? activity.title))) })] }));
};
