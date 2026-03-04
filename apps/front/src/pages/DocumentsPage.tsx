import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Boxes,
  Download,
  Eye,
  FileText,
  Filter,
  Folder,
  Grid2x2,
  List,
  Search,
  ShieldCheck,
  Trash2,
  Upload
} from "lucide-react";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { AppPageHero, AppStateCard, AppStepGuide } from "../components/AppPageHero";
import { canAccessModule, type OrgRole } from "../components/permissions";
import { apiRequest, getApiErrorMessage } from "../config/api";

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

type AttachmentLike = {
  id?: string;
  fileId?: string;
  fileName?: string;
  name?: string;
  projectName?: string;
  project?: string;
  projectId?: string;
  project_id?: string;
  uploadedBy?: {
    fullName?: string;
    email?: string;
  } | null;
  authorName?: string;
  createdBy?: string;
  fileSize?: number;
  size?: number;
  updatedAt?: string;
  createdAt?: string;
  fileUrl?: string;
  url?: string;
  downloadUrl?: string;
  category?: string | null;
};

const DOWNLOAD_TIMEOUT_MS = 20000;

const resolveSafeDocumentUrl = (value?: string | null): string | null => {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const fetchDocumentBlob = async (url: string, timeoutMs = DOWNLOAD_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal, credentials: "omit" });
    if (!response.ok) {
      throw new Error(`Falha ao baixar o arquivo (status ${response.status}).`);
    }
    return await response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Download demorou para responder. Tente novamente.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
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
  const navigate = useNavigate();
  const {
    attachments,
    attachmentsError,
    attachmentsLoading,
    selectedProject,
    selectedProjectId,
    selectedOrganizationId,
    currentOrgRole,
    currentOrgModulePermissions
  } = useOutletContext<DashboardOutletContext>();
  const [query, setQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFolderId, setImportFolderId] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localAttachments, setLocalAttachments] = useState<AttachmentLike[]>([]);
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
  const orgRole = (currentOrgRole ?? "MEMBER") as OrgRole;
  const canViewEap = canAccessModule(orgRole, currentOrgModulePermissions, "eap", "view");
  const canViewKanban = canAccessModule(orgRole, currentOrgModulePermissions, "kanban", "view");
  const canUploadDocuments = canAccessModule(orgRole, currentOrgModulePermissions, "documents", "create");

  const currentProjectName = selectedProject?.projectName ?? selectedProject?.name ?? "";

  useEffect(() => {
    setLocalAttachments(attachments ?? []);
  }, [attachments]);

  const rows = useMemo(() => {
    const mappedAttachments = (localAttachments ?? []).map((doc: AttachmentLike) => ({
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
  const currentScopeLabel =
    selectedProjectId && selectedProjectId !== "all"
      ? currentProjectName || "projeto atual"
      : "todos os projetos visiveis";
  const shouldShowOperationalGuide = Boolean(selectedProjectId && selectedProjectId !== "all") && rows.length === 0;

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
      const body = await apiRequest<{ attachment?: unknown }>(`/projects/${selectedProjectId}/attachments`, {
        method: "POST",
        headers: {
          ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileBase64: base64,
          category: folderName
        })
      });
      const attachment = body?.attachment ?? body;
      setLocalAttachments((prev) => [attachment, ...prev]);
      setShowImport(false);
    } catch (error) {
      setUploadError(getApiErrorMessage(error, "Falha ao enviar arquivo."));
    } finally {
      setUploading(false);
    }

    event.target.value = "";
  };

  const handleDownload = async (row: DocumentRow) => {
    const safeUrl = resolveSafeDocumentUrl(row.url);
    if (!safeUrl) {
      setUploadError("Link do documento invalido.");
      return;
    }
    try {
      setUploadError(null);
      const blob = await fetchDocumentBlob(safeUrl);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = row.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setUploadError(getApiErrorMessage(error, "Falha ao baixar arquivo."));
    }
  };

  const handlePreview = (row: DocumentRow) => {
    const safeUrl = resolveSafeDocumentUrl(row.url);
    if (!safeUrl) {
      setUploadError("Link do documento invalido.");
      return;
    }
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (row: DocumentRow) => {
    if (!selectedProjectId || !row.id) return;
    const targetProjectId = selectedProjectId === "all" ? row.projectId : selectedProjectId;
    if (!targetProjectId) return;
    try {
      await apiRequest(`/projects/${targetProjectId}/attachments/${row.id}`, {
        method: "DELETE",
        headers: {
          ...(selectedOrganizationId ? { "X-Organization-Id": selectedOrganizationId } : {})
        }
      });
      setLocalAttachments((prev) => prev.filter((item) => item.id !== row.id));
    } catch (error) {
      setUploadError(getApiErrorMessage(error, "Falha ao excluir arquivo."));
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
      <AppPageHero
        className="documentsPageHero"
        kicker="Base documental"
        title="Documentos"
        subtitle={`Centralize anexos, pastas e arquivos operacionais de ${currentScopeLabel}.`}
        actions={
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
        }
        stats={[
          {
            label: "Arquivos totais",
            value: rows.length,
            helper: "Documentos disponiveis no escopo atual",
            icon: <FileText size={18} />,
            tone: "default"
          },
          {
            label: "Pastas ativas",
            value: folders.length,
            helper: "Categorias prontas para organizar arquivos",
            icon: <Folder size={18} />,
            tone: "info"
          },
          {
            label: "Resultado filtrado",
            value: filteredRows.length,
            helper: selectedFolder ? `Pasta ${selectedFolder.name}` : "Sem filtro de pasta",
            icon: <Boxes size={18} />,
            tone: "warning"
          },
          {
            label: "Importacao",
            value: selectedProjectId && selectedProjectId !== "all" ? "Liberada" : "Bloqueada",
            helper:
              selectedProjectId && selectedProjectId !== "all"
                ? "Projeto especifico selecionado"
                : 'Escolha um projeto para habilitar o envio',
            icon: <ShieldCheck size={18} />,
            tone: selectedProjectId && selectedProjectId !== "all" ? "success" : "danger"
          }
        ]}
      />

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

      {shouldShowOperationalGuide ? (
        <AppStepGuide
          title={`Base documental inicial de ${currentProjectName || "projeto atual"}`}
          description="Comece anexando os artefatos que sustentam a operação do projeto e mantenha escopo e execução sincronizados."
          items={[
            {
              key: "upload",
              label: "Passo 1",
              title: "Enviar primeiro arquivo",
              description: "Registre contrato, briefing, ata ou qualquer documento que o time precisa consultar já no início.",
              actionLabel: showImport ? "Painel de importação aberto" : "Importar documento",
              onAction: () => {
                if (!showImport) handleImportClick();
              },
              disabled: !canUploadDocuments || showImport,
              helper: !canUploadDocuments
                ? "Seu perfil não pode enviar anexos."
                : showImport
                  ? "Escolha a pasta e selecione o arquivo no painel acima."
                  : "Escolha a pasta de destino antes do envio."
            },
            {
              key: "eap",
              label: "Passo 2",
              title: "Conferir a EAP",
              description: "Revise as entregas estruturadas para anexar documentos nas categorias corretas do projeto.",
              actionLabel: "Abrir EAP",
              onAction: () => navigate(`/projects/${selectedProjectId}/edt`),
              disabled: !canViewEap,
              helper: canViewEap ? "Garanta que o escopo já está organizado." : "Seu perfil não acessa a EAP."
            },
            {
              key: "kanban",
              label: "Passo 3",
              title: "Abrir o Kanban",
              description: "Depois do envio, use o quadro para orientar a execução com contexto documental disponível.",
              actionLabel: "Abrir Kanban",
              onAction: () => navigate(`/projects/${selectedProjectId}/board`),
              disabled: !canViewKanban,
              helper: canViewKanban ? "Leve o time para a execução com referência." : "Seu perfil não acessa o Kanban."
            },
            {
              key: "folders",
              label: "Passo 4",
              title: "Definir pasta de trabalho",
              description: "Escolha a categoria principal do projeto para que os próximos arquivos já entrem organizados.",
              actionLabel: "Selecionar primeira pasta",
              onAction: () => setSelectedFolderId((prev) => prev ?? folders[0]?.id ?? null),
              helper: "Você pode renomear as pastas conforme o processo do cliente."
            }
          ]}
        />
      ) : null}

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
        ) : !rows.length ? (
          <AppStateCard
            tone="default"
            title="Nenhum documento disponivel"
            description="Assim que anexos e arquivos forem enviados, eles aparecerao aqui com pasta, autor e data de atualizacao."
          />
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
              <AppStateCard
                tone="warning"
                title="Nenhum arquivo encontrado"
                description="Os filtros atuais nao retornaram resultados. Ajuste a busca ou troque a pasta selecionada."
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DocumentsPage;
