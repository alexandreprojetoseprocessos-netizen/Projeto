import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
export const ServiceCatalogModal = ({ open, services, selectedCount, onClose, onImport, onCreate, onUpdate, onDelete, onApply, }) => {
    const [search, setSearch] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [hoursBase, setHoursBase] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const importInputRef = useRef(null);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return services.filter((svc) => {
            const nameTxt = (svc.name ?? "").toLowerCase();
            const codeTxt = (svc.code ?? "").toLowerCase();
            const catTxt = (svc.category ?? "").toLowerCase();
            if (!q)
                return true;
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
    if (!open)
        return null;
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
            }
            else if (onCreate) {
                await onCreate(payload);
            }
            resetForm();
        }
        catch (err) {
            setError(err?.message ?? "Erro ao salvar serviço.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleEdit = (svc) => {
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
    const handleDelete = async (svc) => {
        if (!onDelete)
            return;
        const ok = window.confirm(`Excluir serviço "${svc.name}"?`);
        if (!ok)
            return;
        try {
            setLoading(true);
            await onDelete(svc.id);
        }
        catch (err) {
            setError(err?.message ?? "Erro ao excluir serviço.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleImportFile = async (file) => {
        if (!file || !onImport)
            return;
        try {
            setLoading(true);
            await onImport(file);
            setError(null);
        }
        catch (err) {
            setError(err?.message ?? "Erro ao importar catálogo.");
        }
        finally {
            setLoading(false);
            if (importInputRef.current)
                importInputRef.current.value = "";
        }
    };
    const handleApply = async () => {
        if (!selectedServiceId || !onApply)
            return;
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
        }
        catch (err) {
            setError(err?.message ?? "Erro ao aplicar serviço.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "gp-modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "gp-modal gp-modal--wide", role: "dialog", "aria-modal": "true", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "gp-modal-header service-catalog-modal__header", children: [_jsx("h2", { children: "Cat\u00E1logo de Servi\u00E7os" }), _jsxs("div", { className: "service-catalog-modal__header-actions", children: [_jsx("input", { className: "gp-input", placeholder: "Buscar servi\u00E7o", value: search, onChange: (e) => setSearch(e.target.value) }), _jsx("button", { className: "btn-secondary", type: "button", onClick: () => importInputRef.current?.click(), children: "Importar" }), _jsx("button", { className: "btn-primary", type: "button", onClick: () => { resetForm(); setFormOpen(true); }, children: "+ Adicionar" }), _jsx("button", { className: "gp-modal-close", onClick: onClose, "aria-label": "Fechar", children: "\u00D7" })] }), _jsx("input", { ref: importInputRef, type: "file", accept: ".csv", className: "hidden", style: { display: "none" }, onChange: (e) => handleImportFile(e.target.files?.[0] ?? null) })] }), _jsxs("div", { className: "gp-modal-body", children: [formOpen && (_jsxs("div", { className: "service-catalog-form", children: [_jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Nome *" }), _jsx("input", { className: "gp-input", value: name, onChange: (e) => setName(e.target.value), disabled: loading })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "C\u00F3digo" }), _jsx("input", { className: "gp-input", value: code, onChange: (e) => setCode(e.target.value), disabled: loading })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Horas base" }), _jsx("input", { className: "gp-input", type: "number", min: 0, step: 0.5, value: hoursBase, onChange: (e) => setHoursBase(e.target.value), disabled: loading })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Descri\u00E7\u00E3o" }), _jsx("textarea", { className: "gp-input", value: description, onChange: (e) => setDescription(e.target.value), rows: 2, disabled: loading })] }), _jsxs("div", { className: "form-field", children: [_jsx("label", { children: "Categoria" }), _jsx("input", { className: "gp-input", value: category, onChange: (e) => setCategory(e.target.value), disabled: loading })] }), _jsxs("div", { className: "service-catalog-form__actions", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: resetForm, disabled: loading, children: "Cancelar" }), _jsx("button", { type: "button", className: "btn-primary", onClick: handleSave, disabled: loading, children: loading ? "Salvando..." : editingId ? "Atualizar" : "Adicionar" })] })] })), _jsxs("div", { className: "service-catalog-table-wrapper", children: [_jsxs("table", { className: "service-catalog-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", {}), _jsx("th", { children: "Servi\u00E7o" }), _jsx("th", { children: "C\u00F3digo" }), _jsx("th", { children: "Horas base" }), _jsx("th", { children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: filtered.map((svc) => {
                                                const base = svc.hoursBase ?? svc.hours ?? null;
                                                return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("input", { type: "radio", name: "svc-apply", checked: selectedServiceId === svc.id, onChange: () => setSelectedServiceId(svc.id), disabled: loading }) }), _jsx("td", { children: svc.name ?? "Serviço" }), _jsx("td", { children: svc.code ?? "—" }), _jsx("td", { children: base !== null && base !== undefined ? `${base}h` : "—" }), _jsxs("td", { className: "service-catalog-actions-cell", children: [_jsx("button", { type: "button", className: "btn-link-small", onClick: () => handleEdit(svc), disabled: loading, children: "Editar" }), _jsx("button", { type: "button", className: "btn-danger-ghost", onClick: () => handleDelete(svc), disabled: loading, children: "Excluir" })] })] }, svc.id));
                                            }) })] }), !filtered.length && _jsx("p", { className: "muted", children: "Nenhum servi\u00E7o encontrado." })] }), error && _jsx("div", { className: "gp-alert-error", children: error })] }), _jsxs("div", { className: "gp-modal-footer", children: [_jsx("button", { type: "button", className: "btn-secondary", onClick: onClose, disabled: loading, children: "Fechar" }), _jsx("button", { type: "button", className: "btn-primary", disabled: loading || !selectedServiceId || selectedCount === 0, onClick: handleApply, title: selectedCount === 0 ? "Selecione ao menos 1 tarefa" : undefined, children: loading ? "Aplicando..." : `Aplicar em ${selectedCount} tarefas selecionadas` })] })] }) }));
};
export default ServiceCatalogModal;
