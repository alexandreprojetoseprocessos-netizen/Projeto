import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Calculator, CheckCircle2, Coins, Layers, Loader2, Package, Plus, Save, Trash2, TrendingUp, Users, Wrench } from "lucide-react";
import { apiUrl } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
const BUDGET_CATEGORIES = ["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"];
const currency = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const formatNumberBR = (value) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseNumberBR = (value) => {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
};
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
const toSafeNumber = (value, fallback = 0) => {
    const parsed = typeof value === "number"
        ? value
        : typeof value === "string"
            ? Number(value)
            : Number.NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
};
const createBudgetItemId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `budget-item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const normalizeCategory = (value) => {
    if (value === "Mao de Obra" || value === "Mão de Obra")
        return "Mao de Obra";
    if (value === "Material")
        return "Material";
    if (value === "Equipamento")
        return "Equipamento";
    if (value === "Custos Indiretos")
        return "Custos Indiretos";
    return "Outros";
};
const displayCategory = (value) => {
    if (value === "Mao de Obra")
        return "Mão de Obra";
    return value;
};
const categoryIconMap = {
    "Mao de Obra": _jsx(Users, { size: 16 }),
    Material: _jsx(Package, { size: 16 }),
    Equipamento: _jsx(Wrench, { size: 16 }),
    "Custos Indiretos": _jsx(Layers, { size: 16 }),
    Outros: _jsx(Coins, { size: 16 })
};
const defaultItems = [
    {
        id: "default-item-1",
        category: "Mao de Obra",
        description: "Desenvolvedor Frontend Senior",
        quantity: 160,
        unitValue: 150
    },
    {
        id: "default-item-2",
        category: "Mao de Obra",
        description: "Desenvolvedor Backend Senior",
        quantity: 120,
        unitValue: 180
    },
    {
        id: "default-item-3",
        category: "Mao de Obra",
        description: "Designer UI/UX",
        quantity: 80,
        unitValue: 120
    },
    {
        id: "default-item-4",
        category: "Material",
        description: "Licencas de Software",
        quantity: 1,
        unitValue: 5000
    },
    {
        id: "default-item-5",
        category: "Equipamento",
        description: "Servidor Cloud (12 meses)",
        quantity: 12,
        unitValue: 800
    },
    {
        id: "default-item-6",
        category: "Custos Indiretos",
        description: "Custos Administrativos",
        quantity: 1,
        unitValue: 8000
    }
];
const buildPayloadFromBudget = (budget) => ({
    projectValue: clampNumber(toSafeNumber(budget.projectValue, 0), 0, 1000000000),
    contingency: clampNumber(toSafeNumber(budget.contingency, 10), 0, 100),
    notes: typeof budget.notes === "string" ? budget.notes : "",
    items: (budget.items ?? []).map((item) => ({
        id: item.id,
        category: normalizeCategory(item.category),
        description: (item.description ?? "").trim() || "Item de custo",
        quantity: clampNumber(toSafeNumber(item.quantity, 0), 0, 1000000),
        unitValue: clampNumber(toSafeNumber(item.unitValue, 0), 0, 1000000000)
    }))
});
const normalizeIncomingItems = (items) => {
    if (!Array.isArray(items))
        return [];
    return items
        .map((item, index) => {
        const source = (item ?? {});
        const id = typeof source.id === "string" && source.id.trim() ? source.id.trim() : createBudgetItemId();
        return {
            id,
            category: normalizeCategory(source.category),
            description: typeof source.description === "string" && source.description.trim()
                ? source.description.trim()
                : `Item de custo ${index + 1}`,
            quantity: clampNumber(toSafeNumber(source.quantity, 0), 0, 1000000),
            unitValue: clampNumber(toSafeNumber(source.unitValue, 0), 0, 1000000000)
        };
    })
        .slice(0, 500);
};
export const ActivitiesPage = () => {
    const { token } = useAuth();
    const { selectedProject, selectedProjectId, selectedOrganizationId } = useOutletContext();
    const buildDefaultBudget = useCallback(() => {
        const projectName = selectedProject?.projectName ?? selectedProject?.name ?? "";
        const projectValue = clampNumber(toSafeNumber(selectedProject?.budget, 150000), 0, 1000000000);
        return {
            projectName,
            projectValue,
            contingency: 10,
            notes: "",
            items: defaultItems.map((item) => ({ ...item }))
        };
    }, [selectedProject?.budget, selectedProject?.name, selectedProject?.projectName]);
    const [budgetState, setBudgetState] = useState(() => buildDefaultBudget());
    const [loadingBudget, setLoadingBudget] = useState(false);
    const [budgetError, setBudgetError] = useState(null);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [saveError, setSaveError] = useState(null);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const hydratedRef = useRef(false);
    const lastSyncedPayloadRef = useRef("");
    const saveSequenceRef = useRef(0);
    const saveBudget = useCallback(async (payload, serialized) => {
        if (!token || !selectedOrganizationId || !selectedProjectId || selectedProjectId === "all")
            return;
        const requestSequence = saveSequenceRef.current + 1;
        saveSequenceRef.current = requestSequence;
        setSaveStatus("saving");
        setSaveError(null);
        try {
            const response = await fetch(apiUrl(`/projects/${selectedProjectId}/budget`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "X-Organization-Id": selectedOrganizationId
                },
                body: JSON.stringify(payload)
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body?.message ?? "Falha ao salvar orcamento");
            }
            if (requestSequence !== saveSequenceRef.current)
                return;
            lastSyncedPayloadRef.current = serialized;
            setSaveStatus("saved");
            setLastSavedAt(new Date());
        }
        catch (error) {
            if (requestSequence !== saveSequenceRef.current)
                return;
            setSaveStatus("error");
            setSaveError(error instanceof Error ? error.message : "Falha ao salvar orcamento");
        }
    }, [selectedOrganizationId, selectedProjectId, token]);
    useEffect(() => {
        if (!selectedProjectId || selectedProjectId === "all") {
            const fallback = buildDefaultBudget();
            setBudgetState(fallback);
            hydratedRef.current = false;
            setBudgetError(null);
            setSaveError(null);
            setSaveStatus("idle");
            return;
        }
        if (!token || !selectedOrganizationId) {
            return;
        }
        let active = true;
        const loadBudget = async () => {
            setLoadingBudget(true);
            setBudgetError(null);
            setSaveError(null);
            setSaveStatus("idle");
            hydratedRef.current = false;
            try {
                const response = await fetch(apiUrl(`/projects/${selectedProjectId}/budget`), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-Organization-Id": selectedOrganizationId
                    }
                });
                const body = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(body?.message ?? "Falha ao carregar orcamento");
                }
                if (!active)
                    return;
                const apiBudget = (body?.budget ?? {});
                const fallback = buildDefaultBudget();
                const items = normalizeIncomingItems(apiBudget.items);
                const nextBudget = {
                    projectName: typeof apiBudget.projectName === "string" && apiBudget.projectName.trim()
                        ? apiBudget.projectName.trim()
                        : fallback.projectName,
                    projectValue: clampNumber(toSafeNumber(apiBudget.projectValue, fallback.projectValue), 0, 1000000000),
                    contingency: clampNumber(toSafeNumber(apiBudget.contingency, fallback.contingency), 0, 100),
                    notes: typeof apiBudget.notes === "string" ? apiBudget.notes : "",
                    // Keep empty list if user removed all items and saved.
                    items
                };
                setBudgetState(nextBudget);
                lastSyncedPayloadRef.current = JSON.stringify(buildPayloadFromBudget(nextBudget));
                hydratedRef.current = true;
                setSaveStatus("saved");
                setLastSavedAt(new Date());
            }
            catch (error) {
                if (!active)
                    return;
                setBudgetError(error instanceof Error ? error.message : "Falha ao carregar orcamento");
            }
            finally {
                if (!active)
                    return;
                setLoadingBudget(false);
            }
        };
        loadBudget();
        return () => {
            active = false;
        };
    }, [buildDefaultBudget, selectedOrganizationId, selectedProjectId, token]);
    useEffect(() => {
        if (!hydratedRef.current || loadingBudget)
            return;
        if (!selectedProjectId || selectedProjectId === "all")
            return;
        if (!token || !selectedOrganizationId)
            return;
        const payload = buildPayloadFromBudget(budgetState);
        const serialized = JSON.stringify(payload);
        if (serialized === lastSyncedPayloadRef.current)
            return;
        const timeoutId = window.setTimeout(() => {
            saveBudget(payload, serialized);
        }, 700);
        return () => window.clearTimeout(timeoutId);
    }, [budgetState, loadingBudget, saveBudget, selectedOrganizationId, selectedProjectId, token]);
    const handleSaveNow = async () => {
        if (!selectedProjectId || selectedProjectId === "all")
            return;
        if (!token || !selectedOrganizationId)
            return;
        const payload = buildPayloadFromBudget(budgetState);
        const serialized = JSON.stringify(payload);
        await saveBudget(payload, serialized);
    };
    const { projectName, projectValue, contingency, notes, items } = budgetState;
    const totals = useMemo(() => {
        const itemTotals = items.map((item) => ({
            ...item,
            category: normalizeCategory(item.category),
            total: item.quantity * item.unitValue
        }));
        const subtotal = itemTotals.reduce((acc, item) => acc + item.total, 0);
        const contingencyValue = subtotal * (contingency / 100);
        const costTotal = subtotal + contingencyValue;
        const profit = projectValue - costTotal;
        const laborTotal = itemTotals
            .filter((item) => item.category === "Mao de Obra")
            .reduce((acc, item) => acc + item.total, 0);
        const categories = BUDGET_CATEGORIES.map((category) => ({
            category,
            total: itemTotals.filter((item) => item.category === category).reduce((acc, item) => acc + item.total, 0)
        }));
        return {
            itemTotals,
            subtotal,
            contingencyValue,
            costTotal,
            profit,
            profitMargin: projectValue > 0 ? (profit / projectValue) * 100 : 0,
            laborTotal,
            categories
        };
    }, [contingency, items, projectValue]);
    if (!selectedProjectId || selectedProjectId === "all") {
        return (_jsx("section", { className: "budget-page", children: _jsx("header", { className: "budget-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Orcamento" }), _jsx("p", { children: "Selecione um projeto especifico. Esta pagina nao permite \"Todos\"." })] }) }) }));
    }
    const handleAddItem = () => {
        const newItem = {
            id: createBudgetItemId(),
            category: "Outros",
            description: "Novo item de custo",
            quantity: 1,
            unitValue: 0
        };
        setBudgetState((prev) => ({ ...prev, items: [newItem, ...prev.items] }));
    };
    const handleRemoveItem = (id) => {
        setBudgetState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
    };
    const handleItemChange = (id, changes) => {
        setBudgetState((prev) => ({
            ...prev,
            items: prev.items.map((item) => (item.id === id ? { ...item, ...changes } : item))
        }));
    };
    const saveStatusText = saveStatus === "saving"
        ? "Salvando no banco..."
        : saveStatus === "error"
            ? "Erro ao salvar"
            : lastSavedAt
                ? `Salvo em ${lastSavedAt.toLocaleTimeString("pt-BR")}`
                : "Sem alteracoes pendentes";
    return (_jsxs("section", { className: "budget-page", children: [_jsxs("header", { className: "budget-header budget-header--actions", children: [_jsxs("div", { children: [_jsx("h1", { children: "Orcamento" }), _jsx("p", { children: "Gestao de custos e orcamento do projeto" })] }), _jsxs("div", { className: "budget-save-controls", children: [_jsx("span", { className: `budget-save-status is-${saveStatus}`, children: saveStatusText }), _jsxs("button", { className: "budget-primary-button", type: "button", onClick: handleSaveNow, disabled: loadingBudget || saveStatus === "saving", children: [saveStatus === "saving" ? _jsx(Loader2, { size: 16, className: "spin" }) : _jsx(Save, { size: 16 }), " Salvar agora"] })] })] }), loadingBudget ? _jsx("p", { className: "muted", children: "Carregando orcamento..." }) : null, budgetError ? _jsx("p", { className: "error-text", children: budgetError }) : null, saveError ? _jsx("p", { className: "error-text", children: saveError }) : null, _jsxs("div", { className: "budget-kpis", children: [_jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Valor do Projeto" }), _jsx(Calculator, { size: 18 })] }), _jsx("strong", { children: currency(projectValue) }), _jsx("small", { children: "Valor contratado" })] }), _jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Custo Total" }), _jsx(Layers, { size: 18 })] }), _jsx("strong", { children: currency(totals.costTotal) }), _jsxs("small", { children: ["Inclui ", contingency, "% de contingencia"] })] }), _jsxs("article", { className: `budget-kpi-card ${totals.profit < 0 ? "is-negative" : "is-positive"}`, children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Lucro" }), _jsx(TrendingUp, { size: 18 })] }), _jsx("strong", { children: currency(totals.profit) }), _jsxs("small", { children: ["Margem de ", totals.profitMargin.toFixed(1), "%"] })] }), _jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Mao de Obra" }), _jsx(Users, { size: 18 })] }), _jsx("strong", { children: currency(totals.laborTotal) }), _jsx("small", { children: totals.costTotal > 0 ? `${((totals.laborTotal / totals.costTotal) * 100).toFixed(1)}% do custo total` : "0% do custo total" })] })] }), _jsxs("div", { className: "budget-grid", children: [_jsxs("article", { className: "budget-card", children: [_jsxs("header", { children: [_jsx("h2", { children: "Configuracoes do Orcamento" }), _jsx("p", { children: "Defina os parametros gerais do orcamento" })] }), _jsxs("div", { className: "budget-form", children: [_jsxs("label", { children: [_jsx("span", { children: "Nome do Projeto" }), _jsx("input", { value: projectName, readOnly: true, placeholder: "Nome do projeto" })] }), _jsxs("label", { children: [_jsx("span", { children: "Valor do Projeto (R$)" }), _jsx("input", { type: "text", inputMode: "decimal", value: formatNumberBR(projectValue), onChange: (event) => setBudgetState((prev) => ({ ...prev, projectValue: clampNumber(parseNumberBR(event.target.value), 0, 1000000000) })), placeholder: "0,00" })] }), _jsxs("label", { children: [_jsx("span", { children: "Contingencia (%)" }), _jsx("input", { type: "number", min: "0", max: "100", value: contingency, onChange: (event) => setBudgetState((prev) => ({
                                                    ...prev,
                                                    contingency: clampNumber(toSafeNumber(event.target.value, prev.contingency), 0, 100)
                                                })) })] }), _jsxs("label", { className: "budget-textarea", children: [_jsx("span", { children: "Observacoes" }), _jsx("textarea", { value: notes, onChange: (event) => setBudgetState((prev) => ({ ...prev, notes: event.target.value })), placeholder: "Notas adicionais sobre o orcamento...", rows: 4 })] })] })] }), _jsxs("article", { className: "budget-card budget-summary", children: [_jsxs("header", { children: [_jsx("h2", { children: "Resumo por Categoria" }), _jsx("p", { children: "Distribuicao dos custos" })] }), _jsx("div", { className: "budget-summary-list", children: totals.categories.map((category) => (_jsxs("div", { className: "budget-summary-row", children: [_jsxs("div", { className: "budget-summary-label", children: [_jsx("span", { className: "budget-summary-icon", children: categoryIconMap[category.category] }), _jsx("span", { children: displayCategory(category.category) })] }), _jsx("strong", { children: currency(category.total) })] }, category.category))) }), _jsxs("div", { className: "budget-summary-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "Subtotal" }), _jsx("strong", { children: currency(totals.subtotal) })] }), _jsxs("div", { children: [_jsxs("span", { children: ["Contingencia (", contingency, "%)"] }), _jsx("span", { children: currency(totals.contingencyValue) })] }), _jsxs("div", { className: "budget-summary-total", children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: currency(totals.costTotal) })] })] })] })] }), _jsxs("article", { className: "budget-card budget-items", children: [_jsxs("header", { className: "budget-items-header", children: [_jsxs("div", { children: [_jsx("h2", { children: "Itens de Custo" }), _jsx("p", { children: "Lista detalhada de todos os custos do projeto" })] }), _jsxs("button", { className: "budget-primary-button", type: "button", onClick: handleAddItem, children: [_jsx(Plus, { size: 18 }), " Adicionar Item"] })] }), _jsxs("div", { className: "budget-table", children: [_jsxs("div", { className: "budget-table-header", children: [_jsx("span", { children: "Categoria" }), _jsx("span", { children: "Descricao do item" }), _jsx("span", { children: "Quantidade" }), _jsx("span", { children: "Valor unit. (R$)" }), _jsx("span", { children: "Total" }), _jsx("span", {})] }), totals.itemTotals.map((item) => {
                                const categoryValue = normalizeCategory(String(item.category));
                                return (_jsxs("div", { className: "budget-table-row", children: [_jsxs("label", { className: "budget-table-category", children: [_jsx("span", { className: "budget-summary-icon", children: categoryIconMap[categoryValue] ?? _jsx(Users, { size: 16 }) }), _jsx("select", { value: categoryValue, onChange: (event) => handleItemChange(item.id, { category: normalizeCategory(event.target.value) }), children: BUDGET_CATEGORIES.map((category) => (_jsx("option", { value: category, children: displayCategory(category) }, category))) })] }), _jsx("input", { className: "budget-input", value: item.description, onChange: (event) => handleItemChange(item.id, { description: event.target.value }), placeholder: "Ex: Desenvolvedor Frontend Senior" }), _jsx("input", { className: "budget-input budget-input--qty", type: "number", min: "0", step: "1", value: item.quantity, onChange: (event) => handleItemChange(item.id, {
                                                quantity: clampNumber(toSafeNumber(event.target.value, item.quantity), 0, 1000000)
                                            }), placeholder: "0" }), _jsxs("div", { className: "budget-input-prefix", children: [_jsx("span", { children: "R$" }), _jsx("input", { className: "budget-input budget-input--value", type: "number", min: "0", step: "0.01", value: item.unitValue, onChange: (event) => handleItemChange(item.id, {
                                                        unitValue: clampNumber(toSafeNumber(event.target.value, item.unitValue), 0, 1000000000)
                                                    }), placeholder: "0,00" })] }), _jsx("strong", { children: currency(item.total) }), _jsx("button", { className: "budget-icon-button", type: "button", onClick: () => handleRemoveItem(item.id), children: _jsx(Trash2, { size: 16 }) })] }, item.id));
                            })] })] }), saveStatus === "saved" ? (_jsxs("p", { className: "muted budget-saved-hint", children: [_jsx(CheckCircle2, { size: 14 }), " Alteracoes salvas no banco para este projeto."] })) : null] }));
};
export default ActivitiesPage;
