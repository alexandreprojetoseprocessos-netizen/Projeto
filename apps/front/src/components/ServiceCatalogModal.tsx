import React, { useEffect, useMemo, useRef, useState } from "react";

type ServiceItem = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  hoursBase?: number | null;
  hours?: number | null;
  category?: string | null;
};

type ServiceCatalogModalProps = {
  open: boolean;
  services: ServiceItem[];
  selectedCount: number;
  onClose: () => void;
  onImport?: (file: File) => Promise<any>;
  onCreate?: (payload: { name: string; hoursBase: number; code?: string; description?: string; category?: string }) => Promise<any>;
  onUpdate?: (
    id: string,
    payload: { name?: string; hoursBase?: number; code?: string; description?: string; category?: string }
  ) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  onApply?: (service: ServiceItem) => Promise<any>;
};

export const ServiceCatalogModal: React.FC<ServiceCatalogModalProps> = ({
  open,
  services,
  selectedCount,
  onClose,
  onImport,
  onCreate,
  onUpdate,
  onDelete,
  onApply,
}) => {
  const [search, setSearch] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [hoursBase, setHoursBase] = useState<string>("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((svc) => {
      const nameTxt = (svc.name ?? "").toLowerCase();
      const codeTxt = (svc.code ?? "").toLowerCase();
      const catTxt = (svc.category ?? "").toLowerCase();
      if (!q) return true;
      return nameTxt.includes(q) || codeTxt.includes(q) || catTxt.includes(q);
    });
  }, [services, search]);

  useEffect(() => {
    if (services.length && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
    if (!services.length) {
      setSelectedServiceId("");
    }
  }, [services, selectedServiceId]);

  if (!open) return null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setHoursBase("");
    setDescription("");
    setCategory("");
    setFormOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    const hoursNumber = hoursBase ? Number(hoursBase) : 0;
    if (Number.isNaN(hoursNumber) || hoursNumber < 0) {
      setError("Horas base inválidas.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        name: name.trim(),
        hoursBase: hoursNumber,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      };
      if (editingId && onUpdate) {
        await onUpdate(editingId, payload);
      } else if (onCreate) {
        await onCreate(payload);
      }
      resetForm();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar serviço.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (svc: ServiceItem) => {
    setEditingId(svc.id);
    setName(svc.name ?? "");
    setCode(svc.code ?? "");
    const base = svc.hoursBase ?? svc.hours ?? 0;
    setHoursBase(base !== null && base !== undefined ? String(base) : "");
    setDescription(svc.description ?? "");
    setCategory(svc.category ?? "");
    setFormOpen(true);
    setError(null);
  };

  const handleDelete = async (svc: ServiceItem) => {
    if (!onDelete) return;
    const ok = window.confirm(`Excluir serviço "${svc.name}"?`);
    if (!ok) return;
    try {
      setLoading(true);
      await onDelete(svc.id);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao excluir serviço.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (file: File | null) => {
    if (!file || !onImport) return;
    try {
      setLoading(true);
      await onImport(file);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao importar catálogo.");
    } finally {
      setLoading(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleApply = async () => {
    if (!selectedServiceId || !onApply) return;
    const svc = services.find((s) => s.id === selectedServiceId);
    if (!svc) {
      setError("Serviço inválido.");
      return;
    }
    if (selectedCount === 0) {
      setError("Selecione ao menos 1 tarefa para aplicar.");
      return;
    }
    try {
      setLoading(true);
      await onApply(svc);
      setError(null);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Erro ao aplicar serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gp-modal-backdrop" onClick={onClose}>
      <div className="gp-modal gp-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="gp-modal-header service-catalog-modal__header">
          <h2>Catálogo de Serviços</h2>
          <div className="service-catalog-modal__header-actions">
            <input
              className="gp-input"
              placeholder="Buscar serviço"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-secondary" type="button" onClick={() => importInputRef.current?.click()}>
              Importar
            </button>
            <button className="btn-primary" type="button" onClick={() => { resetForm(); setFormOpen(true); }}>
              + Adicionar
            </button>
            <button className="gp-modal-close" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            style={{ display: "none" }}
            onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="gp-modal-body">
          {formOpen && (
            <div className="service-catalog-form">
              <div className="form-field">
                <label>Nome *</label>
                <input className="gp-input" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </div>
              <div className="form-field">
                <label>Código</label>
                <input className="gp-input" value={code} onChange={(e) => setCode(e.target.value)} disabled={loading} />
              </div>
              <div className="form-field">
                <label>Horas base</label>
                <input
                  className="gp-input"
                  type="number"
                  min={0}
                  step={0.5}
                  value={hoursBase}
                  onChange={(e) => setHoursBase(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <label>Descrição</label>
                <textarea
                  className="gp-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <label>Categoria</label>
                <input
                  className="gp-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="service-catalog-form__actions">
                <button type="button" className="btn-secondary" onClick={resetForm} disabled={loading}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
                </button>
              </div>
            </div>
          )}

          <div className="service-catalog-table-wrapper">
            <table className="service-catalog-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Serviço</th>
                  <th>Código</th>
                  <th>Horas base</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => {
                  const base = svc.hoursBase ?? svc.hours ?? null;
                  return (
                    <tr key={svc.id}>
                      <td>
                        <input
                          type="radio"
                          name="svc-apply"
                          checked={selectedServiceId === svc.id}
                          onChange={() => setSelectedServiceId(svc.id)}
                          disabled={loading}
                        />
                      </td>
                      <td>{svc.name ?? "Serviço"}</td>
                      <td>{svc.code ?? "—"}</td>
                      <td>{base !== null && base !== undefined ? `${base}h` : "—"}</td>
                      <td className="service-catalog-actions-cell">
                        <button
                          type="button"
                          className="btn-link-small"
                          onClick={() => handleEdit(svc)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-danger-ghost"
                          onClick={() => handleDelete(svc)}
                          disabled={loading}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length && <p className="muted">Nenhum serviço encontrado.</p>}
          </div>

          {error && <div className="gp-alert-error">{error}</div>}
        </div>

        <div className="gp-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Fechar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={loading || !selectedServiceId || selectedCount === 0}
            onClick={handleApply}
            title={selectedCount === 0 ? "Selecione ao menos 1 tarefa" : undefined}
          >
            {loading ? "Aplicando..." : `Aplicar em ${selectedCount} tarefas selecionadas`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalogModal;
