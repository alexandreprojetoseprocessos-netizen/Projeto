import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Download,
  Eye,
  FileText,
  Filter,
  Folder,
  Grid2x2,
  List,
  Search,
  Trash2,
  Upload
} from "lucide-react";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { apiFetch, getNetworkErrorMessage, parseApiError } from "../config/api";

type DocumentRow = {
  id: string;
  name: string;
  project: string;
  projectId?: string;
  author: string;
  size: string;
  updated: string;
  type?: "pdf" | "doc" | "sheet" | "image" | "file";
  url?: string;
  category?: string | null;
};

type FolderItem = {
  id: string;
  name: string;
  tone: "blue" | "green" | "orange" | "purple" | "teal" | "rose" | "indigo" | "amber";
};

const formatFileSize = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "-";
  const mb = value / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });

export const DocumentsPage = () => {
  const { attachments, attachmentsError, attachmentsLoading, selectedProject, selectedProjectId, selectedOrganizationId } =
    useOutletContext<DashboardOutletContext>();
  const [query, setQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFolderId, setImportFolderId] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<any[]>([]);
  const defaultFolders: FolderItem[] = [
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
  const [folders, setFolders] = useState<FolderItem[]>(defaultFolders);

  const currentProjectName = selectedProject?.projectName ?? selectedProject?.name ?? "";

  useEffect(() => {
    setLocalAttachments(attachments ?? []);
  }, [attachments]);

  const rows = useMemo(() => {
    const mappedAttachments = (localAttachments ?? []).map((doc: any) => ({
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
    })) as DocumentRow[];
    if (!selectedProjectId) return [];
    return mappedAttachments;
  }, [localAttachments, currentProjectName, selectedProjectId]);

  const filteredRows = useMemo(() => {
    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
    const scopedRows = selectedFolder ? rows.filter((row) => row.category === selectedFolder.name) : rows;

    if (!query) return scopedRows;
    const term = query.toLowerCase();
    return scopedRows.filter(
      (row) => row.name.toLowerCase().includes(term) || (row.project ?? "").toLowerCase().includes(term)
    );
  }, [rows, query, folders, selectedFolderId]);

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    folders.forEach((folder) => {
      counts.set(folder.id, rows.filter((row) => row.category === folder.name).length);
    });
    return counts;
  }, [folders, rows]);

  const handleImportClick = () => {
    if (!selectedProjectId || selectedProjectId === "all") return;
    setUploadError(null);
    setShowImport((prev) => !prev);
    if (!importFolderId && folders.length) {
      setImportFolderId(folders[0].id);
    }
  };

  const handlePickFile = () => {
    if (!importFolderId || !selectedProjectId || selectedProjectId === "all" || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importFolderId) return;
    if (!selectedProjectId || selectedProjectId === "all") return;
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
    } catch (error) {
      const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
      setUploadError(message);
    } finally {
      setUploading(false);
    }

    event.target.value = "";
  };

  const handleDownload = async (row: DocumentRow) => {
    if (!row.url) return;
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
    } catch (error) {
      const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
      setUploadError(message);
    }
  };

  const handlePreview = (row: DocumentRow) => {
    if (!row.url) return;
    window.open(row.url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (row: DocumentRow) => {
    if (!selectedProjectId || !row.id) return;
    const targetProjectId = selectedProjectId === "all" ? row.projectId : selectedProjectId;
    if (!targetProjectId) return;
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
    } catch (error) {
      const message = error instanceof Error ? error.message : getNetworkErrorMessage(error);
      setUploadError(message);
    }
  };

  const handleFolderNameChange = useCallback(
    (folderId: string, nextName: string) => {
      const oldName = folders.find((folder) => folder.id === folderId)?.name;
      setFolders((prev) =>
        prev.map((folder) => (folder.id === folderId ? { ...folder, name: nextName } : folder))
      );
      if (!oldName) return;
      setLocalAttachments((prev) =>
        prev.map((item) => (item.category === oldName ? { ...item, category: nextName } : item))
      );
    },
    [folders]
  );

  return (
    <section className="documents-page">
      <header className="documents-header">
        <div>
          <h1>Documentos</h1>
          <p>Gerencie todos os documentos dos seus projetos</p>
        </div>
        <div className="documents-header-actions">
          <button
            className="documents-import-button"
            type="button"
            onClick={handleImportClick}
            disabled={!selectedProjectId || selectedProjectId === "all"}
            title={
              !selectedProjectId || selectedProjectId === "all"
                ? "Selecione um projeto especifico para importar."
                : undefined
            }
          >
            <Upload size={16} /> Importar
          </button>
        </div>
      </header>

      {showImport && (
        <div className="documents-import-panel">
          <div className="documents-import-content">
            <div>
              <strong>Importar arquivo</strong>
              <small>Escolha a pasta de destino antes de selecionar o arquivo.</small>
              <ul className="documents-import-rules">
                <li>Documentos de texto: menor que 1 MB.</li>
                <li>PDF com imagens: menor que 5 MB.</li>
                <li>Imagens individuais: abaixo de 500 KB.</li>
              </ul>
            </div>
            <div className="documents-import-controls">
              <label className="documents-import-select">
                <span>Selecionar pasta</span>
                <select value={importFolderId} onChange={(event) => setImportFolderId(event.target.value)}>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="documents-import-file">
                <span>Selecione o arquivo</span>
                <button type="button" className="documents-import-primary" onClick={handlePickFile}>
                  Escolher arquivo
                </button>
              </label>
              <label className="documents-import-exit">
                <span>Sair da importação</span>
                <button type="button" className="documents-import-ghost" onClick={() => setShowImport(false)}>
                  Cancelar
                </button>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelected}
                hidden
              />
            </div>
            {uploadError && <small className="error-text">{uploadError}</small>}
          </div>
        </div>
      )}

      {attachmentsError && <p className="error-text">{attachmentsError}</p>}



      <div className="documents-section">
        <div className="documents-section-title">Acesso rapido</div>
        <div className="documents-quick-grid">
          {folders.map((item) => (
            <button
              key={item.id}
              className={`documents-quick-card documents-quick-card--folder ${item.tone} ${
                selectedFolderId === item.id ? "is-active" : ""
              }`}
              type="button"
              onClick={() => setSelectedFolderId((prev) => (prev === item.id ? null : item.id))}
            >
              <span className="documents-folder-tab" />
              <span className="documents-quick-icon">
                <Folder size={18} />
              </span>
              <div className="documents-quick-content">
                <input
                  className="documents-folder-input"
                  value={item.name}
                  onChange={(event) => handleFolderNameChange(item.id, event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                />
                <small>{folderCounts.get(item.id) ?? 0} arquivos</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="documents-table-card">
        <div className="documents-table-header">
          <div>
            <h2>{selectedFolder ? `Arquivos da pasta ${selectedFolder.name}` : "Arquivos recentes"}</h2>
            <p>{selectedFolder ? "Arquivos armazenados nesta pasta" : "Arquivos que foram atualizados recentemente"}</p>
          </div>
          <div className="documents-table-actions">
            <div className="documents-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Buscar arquivos..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button className="documents-filter" type="button">
              <Filter size={16} /> Filtrar
            </button>
            <div className="documents-view-toggle">
              <button type="button">
                <List size={16} />
              </button>
              <button type="button">
                <Grid2x2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {attachmentsLoading ? (
          <div className="documents-table-skeleton">Carregando documentos...</div>
        ) : (
          <div className="documents-table">
            <div className="documents-table-row documents-table-row--header">
              <span>Nome</span>
              <span>Projeto</span>
              <span>Autor</span>
              <span>Tamanho</span>
              <span>Atualizado</span>
              <span></span>
            </div>
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <div key={row.id} className="documents-table-row">
                  <div className="documents-file">
                    <span className="documents-file-icon">
                      <FileText size={16} />
                    </span>
                    <span>{row.name}</span>
                  </div>
                  <span className="documents-tag">{row.project}</span>
                  <span>{row.author}</span>
                  <span>{row.size}</span>
                  <span>{row.updated}</span>
                  <div className="documents-row-actions">
                    <button type="button" className="documents-icon-button" onClick={() => handleDownload(row)}>
                      <Download size={16} />
                    </button>
                    <button type="button" className="documents-icon-button" onClick={() => handlePreview(row)}>
                      <Eye size={16} />
                    </button>
                    <button type="button" className="documents-icon-button documents-icon-button--danger" onClick={() => handleDelete(row)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="documents-table-skeleton">Nenhum arquivo encontrado.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DocumentsPage;
