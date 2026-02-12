import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, Eye, FileText, Filter, Folder, Grid2x2, List, Search, Trash2, Upload } from "lucide-react";
import { apiFetch, getNetworkErrorMessage, parseApiError } from "../config/api";
const formatFileSize = (value) => {
    if (!value || Number.isNaN(value))
        return "-";
    const mb = value / (1024 * 1024);
    if (mb >= 1)
        return `${mb.toFixed(1)} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
};
const formatDateTime = (value) => {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
});
export const DocumentsPage = () => {
    const { attachments, attachmentsError, attachmentsLoading, selectedProject, selectedProjectId, selectedOrganizationId } = useOutletContext();
    const [query, setQuery] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const [importFolderId, setImportFolderId] = useState("");
    const [uploadError, setUploadError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [localAttachments, setLocalAttachments] = useState([]);
    const defaultFolders = [
        {
            id: "folder-propostas",
            name: "Propostas",
            tone: "blue",
        },
        {
            id: "folder-contratos",
            name: "Contratos",
            tone: "green",
        },
        {
            id: "folder-designs",
            name: "Designs",
            tone: "orange",
        },
        {
            id: "folder-atas",
            name: "Atas de Reuniao",
            tone: "purple",
        },
        {
            id: "folder-relatorios",
            name: "Relatorios",
            tone: "teal",
        },
        {
            id: "folder-planejamento",
            name: "Planejamento",
            tone: "rose",
        },
        {
            id: "folder-briefing",
            name: "Briefings",
            tone: "indigo",
        },
        {
            id: "folder-entregas",
            name: "Entregas",
            tone: "amber",
        }
    ];
    const [folders, setFolders] = useState(defaultFolders);
    const currentProjectName = selectedProject?.projectName ?? selectedProject?.name ?? "";
    useEffect(() => {
        setLocalAttachments(attachments ?? []);
    }, [attachments]);
    const rows = useMemo(() => {
        const mappedAttachments = (localAttachments ?? []).map((doc) => ({
            id: doc.id ?? doc.fileId ?? doc.fileName,
            name: doc.fileName ?? doc.name ?? "Documento",
            project: doc.projectName ?? doc.project ?? currentProjectName,
            projectId: doc.projectId ?? doc.project_id ?? selectedProjectId,
            author: doc.uploadedBy?.fullName ?? doc.uploadedBy?.email ?? doc.authorName ?? doc.createdBy ?? "Equipe",
            size: formatFileSize(doc.fileSize ?? doc.size),
            updated: formatDateTime(doc.updatedAt ?? doc.createdAt),
            type: "file",
            url: doc.fileUrl ?? doc.url ?? doc.downloadUrl ?? undefined,
            category: doc.category ?? null
        }));
        if (!selectedProjectId)
            return [];
        return mappedAttachments;
    }, [localAttachments, currentProjectName, selectedProjectId]);
    const filteredRows = useMemo(() => {
        const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
        const scopedRows = selectedFolder ? rows.filter((row) => row.category === selectedFolder.name) : rows;
        if (!query)
            return scopedRows;
        const term = query.toLowerCase();
        return scopedRows.filter((row) => row.name.toLowerCase().includes(term) || (row.project ?? "").toLowerCase().includes(term));
    }, [rows, query, folders, selectedFolderId]);
    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;
    const folderCounts = useMemo(() => {
        const counts = new Map();
        folders.forEach((folder) => {
            counts.set(folder.id, rows.filter((row) => row.category === folder.name).length);
        });
        return counts;
    }, [folders, rows]);
    const handleImportClick = () => {
        if (!selectedProjectId || selectedProjectId === "all")
            return;
        setUploadError(null);
        setShowImport((prev) => !prev);
        if (!importFolderId && folders.length) {
            setImportFolderId(folders[0].id);
        }
    };
    const handlePickFile = () => {
        if (!importFolderId || !selectedProjectId || selectedProjectId === "all" || uploading)
            return;
        fileInputRef.current?.click();
    };
    const handleFileSelected = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !importFolderId)
            return;
        if (!selectedProjectId || selectedProjectId === "all")
            return;
        setUploadError(null);
        setUploading(true);
        const folderName = folders.find((folder) => folder.id === importFolderId)?.name ?? "Geral";
        try {
            const base64 = await fileToBase64(file);
            const response = await apiFetch(`/projects/${selectedProjectId}/attachments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
                },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type || "application/octet-stream",
                    fileBase64: base64,
                    category: folderName
                })
            });
            if (!response.ok) {
                const apiError = await parseApiError(response, "/attachments");
                throw new Error(apiError.message);
            }
            const body = await response.json();
            const attachment = body?.attachment ?? body;
            setLocalAttachments((prev) => [attachment, ...prev]);
            setShowImport(false);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
            setUploadError(message);
        }
        finally {
            setUploading(false);
        }
        event.target.value = "";
    };
    const handleDownload = async (row) => {
        if (!row.url)
            return;
        try {
            const response = await fetch(row.url);
            if (!response.ok) {
                throw new Error("Falha ao baixar o arquivo");
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = row.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
            setUploadError(message);
        }
    };
    const handlePreview = (row) => {
        if (!row.url)
            return;
        window.open(row.url, "_blank", "noopener,noreferrer");
    };
    const handleDelete = async (row) => {
        if (!selectedProjectId || !row.id)
            return;
        const targetProjectId = selectedProjectId === "all" ? row.projectId : selectedProjectId;
        if (!targetProjectId)
            return;
        try {
            const response = await apiFetch(`/projects/${targetProjectId}/attachments/${row.id}`, {
                method: "DELETE",
                headers: {
                    ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
                }
            });
            if (!response.ok) {
                const apiError = await parseApiError(response, "/attachments/delete");
                throw new Error(apiError.message);
            }
            setLocalAttachments((prev) => prev.filter((item) => item.id !== row.id));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
            setUploadError(message);
        }
    };
    const handleFolderNameChange = useCallback((folderId, nextName) => {
        const oldName = folders.find((folder) => folder.id === folderId)?.name;
        setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, name: nextName } : folder)));
        if (!oldName)
            return;
        setLocalAttachments((prev) => prev.map((item) => (item.category === oldName ? { ...item, category: nextName } : item)));
    }, [folders]);
    return (_jsxs("section", { className: "documents-page", children: [_jsxs("header", { className: "documents-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "Documentos" }), _jsx("p", { children: "Gerencie todos os documentos dos seus projetos" })] }), _jsx("div", { className: "documents-header-actions", children: _jsxs("button", { className: "documents-import-button", type: "button", onClick: handleImportClick, disabled: !selectedProjectId || selectedProjectId === "all", title: !selectedProjectId || selectedProjectId === "all"
                                ? "Selecione um projeto especifico para importar."
                                : undefined, children: [_jsx(Upload, { size: 16 }), " Importar"] }) })] }), showImport && (_jsx("div", { className: "documents-import-panel", children: _jsxs("div", { className: "documents-import-content", children: [_jsxs("div", { children: [_jsx("strong", { children: "Importar arquivo" }), _jsx("small", { children: "Escolha a pasta de destino antes de selecionar o arquivo." }), _jsxs("ul", { className: "documents-import-rules", children: [_jsx("li", { children: "Documentos de texto: menor que 1 MB." }), _jsx("li", { children: "PDF com imagens: menor que 5 MB." }), _jsx("li", { children: "Imagens individuais: abaixo de 500 KB." })] })] }), _jsxs("div", { className: "documents-import-controls", children: [_jsxs("label", { className: "documents-import-select", children: [_jsx("span", { children: "Selecionar pasta" }), _jsx("select", { value: importFolderId, onChange: (event) => setImportFolderId(event.target.value), children: folders.map((folder) => (_jsx("option", { value: folder.id, children: folder.name }, folder.id))) })] }), _jsxs("label", { className: "documents-import-file", children: [_jsx("span", { children: "Selecione o arquivo" }), _jsx("button", { type: "button", className: "documents-import-primary", onClick: handlePickFile, children: "Escolher arquivo" })] }), _jsxs("label", { className: "documents-import-exit", children: [_jsx("span", { children: "Sair da importa\u00E7\u00E3o" }), _jsx("button", { type: "button", className: "documents-import-ghost", onClick: () => setShowImport(false), children: "Cancelar" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".pdf,.doc,.docx,.xls,.xlsx", onChange: handleFileSelected, hidden: true })] }), uploadError && _jsx("small", { className: "error-text", children: uploadError })] }) })), attachmentsError && _jsx("p", { className: "error-text", children: attachmentsError }), _jsxs("div", { className: "documents-section", children: [_jsx("div", { className: "documents-section-title", children: "Acesso rapido" }), _jsx("div", { className: "documents-quick-grid", children: folders.map((item) => (_jsxs("button", { className: `documents-quick-card documents-quick-card--folder ${item.tone} ${selectedFolderId === item.id ? "is-active" : ""}`, type: "button", onClick: () => setSelectedFolderId((prev) => (prev === item.id ? null : item.id)), children: [_jsx("span", { className: "documents-folder-tab" }), _jsx("span", { className: "documents-quick-icon", children: _jsx(Folder, { size: 18 }) }), _jsxs("div", { className: "documents-quick-content", children: [_jsx("input", { className: "documents-folder-input", value: item.name, onChange: (event) => handleFolderNameChange(item.id, event.target.value), onClick: (event) => event.stopPropagation() }), _jsxs("small", { children: [folderCounts.get(item.id) ?? 0, " arquivos"] })] })] }, item.id))) })] }), _jsxs("div", { className: "documents-table-card", children: [_jsxs("div", { className: "documents-table-header", children: [_jsxs("div", { children: [_jsx("h2", { children: selectedFolder ? `Arquivos da pasta ${selectedFolder.name}` : "Arquivos recentes" }), _jsx("p", { children: selectedFolder ? "Arquivos armazenados nesta pasta" : "Arquivos que foram atualizados recentemente" })] }), _jsxs("div", { className: "documents-table-actions", children: [_jsxs("div", { className: "documents-search", children: [_jsx(Search, { size: 16 }), _jsx("input", { type: "search", placeholder: "Buscar arquivos...", value: query, onChange: (event) => setQuery(event.target.value) })] }), _jsxs("button", { className: "documents-filter", type: "button", children: [_jsx(Filter, { size: 16 }), " Filtrar"] }), _jsxs("div", { className: "documents-view-toggle", children: [_jsx("button", { type: "button", children: _jsx(List, { size: 16 }) }), _jsx("button", { type: "button", children: _jsx(Grid2x2, { size: 16 }) })] })] })] }), attachmentsLoading ? (_jsx("div", { className: "documents-table-skeleton", children: "Carregando documentos..." })) : (_jsxs("div", { className: "documents-table", children: [_jsxs("div", { className: "documents-table-row documents-table-row--header", children: [_jsx("span", { children: "Nome" }), _jsx("span", { children: "Projeto" }), _jsx("span", { children: "Autor" }), _jsx("span", { children: "Tamanho" }), _jsx("span", { children: "Atualizado" }), _jsx("span", {})] }), filteredRows.length ? (filteredRows.map((row) => (_jsxs("div", { className: "documents-table-row", children: [_jsxs("div", { className: "documents-file", children: [_jsx("span", { className: "documents-file-icon", children: _jsx(FileText, { size: 16 }) }), _jsx("span", { children: row.name })] }), _jsx("span", { className: "documents-tag", children: row.project }), _jsx("span", { children: row.author }), _jsx("span", { children: row.size }), _jsx("span", { children: row.updated }), _jsxs("div", { className: "documents-row-actions", children: [_jsx("button", { type: "button", className: "documents-icon-button", onClick: () => handleDownload(row), children: _jsx(Download, { size: 16 }) }), _jsx("button", { type: "button", className: "documents-icon-button", onClick: () => handlePreview(row), children: _jsx(Eye, { size: 16 }) }), _jsx("button", { type: "button", className: "documents-icon-button documents-icon-button--danger", onClick: () => handleDelete(row), children: _jsx(Trash2, { size: 16 }) })] })] }, row.id)))) : (_jsx("div", { className: "documents-table-skeleton", children: "Nenhum arquivo encontrado." }))] }))] })] }));
};
export default DocumentsPage;
