import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
export const ProjectDocumentsPage = () => {
    const { id } = useParams();
    const { selectedProject, selectedProjectId, onProjectChange, projectDocuments, projectDocumentsLoading, projectDocumentsError, onUploadProjectDocument, onDeleteProjectDocument, onDownloadProjectDocument } = useOutletContext();
    useEffect(() => {
        if (id && selectedProjectId !== id && onProjectChange) {
            onProjectChange(id);
        }
    }, [id, selectedProjectId, onProjectChange]);
    return (_jsxs("section", { className: "project-documents-page", children: [_jsxs("header", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Documentos do Projeto" }), _jsx("p", { children: selectedProject?.projectName ?? selectedProject?.name ?? "Projeto" })] }), _jsx("div", { className: "actions", children: _jsxs("label", { className: "upload-label", children: [_jsx("span", { children: "Enviar" }), _jsx("input", { type: "file", onChange: (event) => onUploadProjectDocument?.(event.target.files?.[0] ?? null) })] }) })] }), projectDocumentsLoading && _jsx("p", { className: "muted", children: "Carregando documentos..." }), projectDocumentsError && _jsxs("p", { className: "error-text", children: ["Erro: ", projectDocumentsError] }), _jsx("div", { className: "documents-list", children: (projectDocuments ?? []).map((doc) => (_jsxs("div", { className: "document-row", children: [_jsxs("div", { className: "document-info", children: [_jsx("strong", { children: doc.name }), _jsx("span", { children: doc.sizeReadable ?? "" }), _jsx("span", { children: doc.category ?? "" })] }), _jsxs("div", { className: "document-actions", children: [_jsx("button", { type: "button", onClick: () => onDownloadProjectDocument?.(doc.id), children: "Baixar" }), _jsx("button", { type: "button", onClick: () => onDeleteProjectDocument?.(doc.id), children: "Excluir" })] })] }, doc.id))) })] }));
};
