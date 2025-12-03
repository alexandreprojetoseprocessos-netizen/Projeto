import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { WbsTreeView } from "../components/DashboardLayout";
export const ProjectEDTPage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectWbsNodes, projectWbsError, projectWbsLoading, onCreateProjectWbsItem, onUpdateProjectWbsItem, onDeleteProjectWbsItem, onRestoreProjectWbsItem, projectDependencyOptions, onUpdateProjectDependency } = useOutletContext();
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    return (_jsxs("section", { className: "project-edt-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "EDT do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? selectedProject?.name ?? "Projeto" })] }), _jsxs("div", { className: "edt-actions", children: [_jsx("button", { type: "button", className: "secondary-button", children: "Exportar" }), _jsx("button", { type: "button", className: "secondary-button", children: "Importar" }), _jsx("button", { type: "button", className: "ghost-button", children: "Lixeira" })] })] }), _jsx("div", { className: "edt-card", children: _jsx("div", { className: "edt-scroll-wrapper", children: _jsx(WbsTreeView, { nodes: projectWbsNodes ?? [], loading: projectWbsLoading, error: projectWbsError ?? null, onCreate: onCreateProjectWbsItem ?? (() => { }), onUpdate: onUpdateProjectWbsItem ?? (() => { }), onDelete: onDeleteProjectWbsItem ?? (() => { }), onRestore: onRestoreProjectWbsItem, dependencyOptions: projectDependencyOptions, onUpdateDependency: onUpdateProjectDependency, onMove: () => { }, selectedNodeId: null, onSelect: () => { } }) }) })] }));
};
