import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOutletContext } from "react-router-dom";
import { FileIcon } from "../components/DashboardLayout";
import { EmptyStateCard } from "../components/DashboardLayout";
export const DocumentsPage = () => {
    const { attachments, attachmentsError, attachmentsLoading } = useOutletContext();
    return (_jsxs("section", { className: "documents-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("h1", { children: "Documentos" }), attachmentsError && _jsx("p", { className: "error-text", children: attachmentsError })] }), attachmentsLoading ? (_jsx("div", { className: "docs-grid", children: [0, 1, 2].map((index) => (_jsxs("article", { className: "doc-card skeleton-card", children: [_jsx("div", { className: "skeleton skeleton-title" }), _jsx("div", { className: "skeleton skeleton-text" }), _jsx("div", { className: "skeleton skeleton-text", style: { width: "40%" } })] }, index))) })) : (attachments ?? []).length ? (_jsx("div", { className: "docs-grid", children: (attachments ?? []).map((doc) => (_jsxs("article", { className: "doc-card", children: [_jsxs("div", { children: [_jsx("h4", { children: doc.fileName }), _jsx("p", { className: "muted", children: doc.category ?? "Documento" }), _jsx("small", { children: doc.size ?? doc.sizeReadable ?? "" })] }), _jsx("button", { type: "button", className: "secondary-button", children: "Baixar" })] }, doc.id))) })) : (_jsx(EmptyStateCard, { icon: FileIcon, title: "Nenhum documento enviado", description: "Centralize atas, contratos e anexos importantes para facilitar o acompanhamento.", actionLabel: "Adicionar documento", onAction: () => {
                    if (typeof window !== "undefined")
                        window.alert("Upload em breve.");
                } }))] }));
};
export default DocumentsPage;
