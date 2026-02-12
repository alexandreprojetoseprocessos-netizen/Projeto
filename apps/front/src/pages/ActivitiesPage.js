import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Calculator, Coins, Layers, Package, Plus, Trash2, TrendingUp, Users, Wrench } from "lucide-react";
const normalizeCategory = (value) => {
    if (value === "M\u00E3o de Obra")
        return "Mao de Obra";
    return value ?? "Outros";
};
const displayCategory = (value) => {
    if (value == "Mao de Obra")
        return "M\u00E3o de Obra";
    return value;
};
const currency = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const formatNumberBR = (value) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseNumberBR = (value) => {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
};
const categoryIconMap = {
    "Mao de Obra": _jsx(Users, { size: 16 }),
    Material: _jsx(Package, { size: 16 }),
    Equipamento: _jsx(Wrench, { size: 16 }),
    "Custos Indiretos": _jsx(Layers, { size: 16 }),
    Outros: _jsx(Coins, { size: 16 })
};
const defaultItems = [
    { id: "item-1", category: "Mao de Obra", description: "Desenvolvedor Frontend Senior", quantity: 160, unitValue: 150 },
    { id: "item-2", category: "Mao de Obra", description: "Desenvolvedor Backend Senior", quantity: 120, unitValue: 180 },
    { id: "item-3", category: "Mao de Obra", description: "Designer UI/UX", quantity: 80, unitValue: 120 },
    { id: "item-4", category: "Material", description: "Licenças de Software", quantity: 1, unitValue: 5000 },
    { id: "item-5", category: "Equipamento", description: "Servidor Cloud (12 meses)", quantity: 12, unitValue: 800 },
    { id: "item-6", category: "Custos Indiretos", description: "Custos Administrativos", quantity: 1, unitValue: 8000 }
];
export const ActivitiesPage = () => {
    const { selectedProject, selectedProjectId } = useOutletContext();
    const storageKey = selectedProjectId && selectedProjectId !== "all" ? `budget:${selectedProjectId}` : null;
    const buildDefaultBudget = () => ({
        projectName: selectedProject?.projectName ?? selectedProject?.name ?? "",
        projectValue: Number(selectedProject?.budget ?? 150000),
        contingency: 10,
        notes: "",
        items: defaultItems
    });
    const [budgetState, setBudgetState] = useState(buildDefaultBudget);
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                const storedItems = Array.isArray(parsed.items) && parsed.items.length ? parsed.items : defaultItems;
                setBudgetState({
                    ...buildDefaultBudget(),
                    ...parsed,
                    items: storedItems.map((item) => ({ ...item, category: normalizeCategory(String(item.category)) }))
                });
                return;
            }
        }
        catch {
            // ignore corrupted storage and fallback to defaults
        }
        setBudgetState(buildDefaultBudget());
    }, [storageKey, selectedProject?.projectName, selectedProject?.name, selectedProject?.budget]);
    useEffect(() => {
        if (!storageKey)
            return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(budgetState));
        }
        catch {
            // ignore storage errors
        }
    }, [storageKey, budgetState]);
    if (!selectedProjectId || selectedProjectId === "all") {
        return (_jsx("section", { className: "budget-page", children: _jsx("header", { className: "budget-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Or\u00C3\u00A7amento" }), _jsx("p", { children: "Selecione um projeto especifico. Esta pagina nao permite \"Todos\"." })] }) }) }));
    }
    const { projectName, projectValue, contingency, notes, items } = budgetState;
    const totals = useMemo(() => {
        const itemTotals = items.map((item) => ({
            ...item,
            category: normalizeCategory(String(item.category)),
            total: item.quantity * item.unitValue
        }));
        const subtotal = itemTotals.reduce((acc, item) => acc + item.total, 0);
        const contingencyValue = subtotal * (contingency / 100);
        const costTotal = subtotal + contingencyValue;
        const profit = projectValue - costTotal;
        const laborTotal = itemTotals
            .filter((item) => item.category === "Mao de Obra")
            .reduce((acc, item) => acc + item.total, 0);
        const categories = ["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"].map((category) => ({
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
    }, [items, contingency, projectValue]);
    const handleAddItem = () => {
        const newItem = {
            id: `item-${Date.now()}`,
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
    return (_jsxs("section", { className: "budget-page", children: [_jsx("header", { className: "budget-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Or\u00E7amento" }), _jsx("p", { children: "Gest\u00E3o de custos e or\u00E7amento do projeto" })] }) }), _jsxs("div", { className: "budget-kpis", children: [_jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Valor do Projeto" }), _jsx(Calculator, { size: 18 })] }), _jsx("strong", { children: currency(projectValue) }), _jsx("small", { children: "Valor contratado" })] }), _jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Custo Total" }), _jsx(Layers, { size: 18 })] }), _jsx("strong", { children: currency(totals.costTotal) }), _jsxs("small", { children: ["Inclui ", contingency, "% de conting\u00EAncia"] })] }), _jsxs("article", { className: `budget-kpi-card ${totals.profit < 0 ? "is-negative" : "is-positive"}`, children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "Lucro" }), _jsx(TrendingUp, { size: 18 })] }), _jsx("strong", { children: currency(totals.profit) }), _jsxs("small", { children: ["Margem de ", totals.profitMargin.toFixed(1), "%"] })] }), _jsxs("article", { className: "budget-kpi-card", children: [_jsxs("div", { className: "budget-kpi-top", children: [_jsx("span", { children: "M\u00E3o de Obra" }), _jsx(Users, { size: 18 })] }), _jsx("strong", { children: currency(totals.laborTotal) }), _jsx("small", { children: totals.costTotal > 0 ? `${((totals.laborTotal / totals.costTotal) * 100).toFixed(1)}% do custo total` : "0% do custo total" })] })] }), _jsxs("div", { className: "budget-grid", children: [_jsxs("article", { className: "budget-card", children: [_jsxs("header", { children: [_jsx("h2", { children: "Configura\u00E7\u00F5es do Or\u00E7amento" }), _jsx("p", { children: "Defina os par\u00E2metros gerais do or\u00E7amento" })] }), _jsxs("div", { className: "budget-form", children: [_jsxs("label", { children: [_jsx("span", { children: "Nome do Projeto" }), _jsx("input", { value: projectName, readOnly: true, placeholder: "Nome do projeto" })] }), _jsxs("label", { children: [_jsx("span", { children: "Valor do Projeto (R$)" }), _jsx("input", { type: "text", inputMode: "decimal", value: formatNumberBR(projectValue), onChange: (event) => setBudgetState((prev) => ({ ...prev, projectValue: parseNumberBR(event.target.value) })), placeholder: "0,00" })] }), _jsxs("label", { children: [_jsx("span", { children: "Conting\u00EAncia (%)" }), _jsx("input", { type: "number", min: "0", max: "100", value: contingency, onChange: (event) => setBudgetState((prev) => ({ ...prev, contingency: Number(event.target.value) })) })] }), _jsxs("label", { className: "budget-textarea", children: [_jsx("span", { children: "Observa\u00E7\u00F5es" }), _jsx("textarea", { value: notes, onChange: (event) => setBudgetState((prev) => ({ ...prev, notes: event.target.value })), placeholder: "Notas adicionais sobre o or\u00E7amento...", rows: 4 })] })] })] }), _jsxs("article", { className: "budget-card budget-summary", children: [_jsxs("header", { children: [_jsx("h2", { children: "Resumo por Categoria" }), _jsx("p", { children: "Distribui\u00E7\u00E3o dos custos" })] }), _jsx("div", { className: "budget-summary-list", children: totals.categories.map((category) => (_jsxs("div", { className: "budget-summary-row", children: [_jsxs("div", { className: "budget-summary-label", children: [_jsx("span", { className: "budget-summary-icon", children: categoryIconMap[category.category] }), _jsx("span", { children: category.category })] }), _jsx("strong", { children: currency(category.total) })] }, category.category))) }), _jsxs("div", { className: "budget-summary-footer", children: [_jsxs("div", { children: [_jsx("span", { children: "Subtotal" }), _jsx("strong", { children: currency(totals.subtotal) })] }), _jsxs("div", { children: [_jsxs("span", { children: ["Conting\u00EAncia (", contingency, "%)"] }), _jsx("span", { children: currency(totals.contingencyValue) })] }), _jsxs("div", { className: "budget-summary-total", children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: currency(totals.costTotal) })] })] })] })] }), _jsxs("article", { className: "budget-card budget-items", children: [_jsxs("header", { className: "budget-items-header", children: [_jsxs("div", { children: [_jsx("h2", { children: "Itens de Custo" }), _jsx("p", { children: "Lista detalhada de todos os custos do projeto" })] }), _jsxs("button", { className: "budget-primary-button", type: "button", onClick: handleAddItem, children: [_jsx(Plus, { size: 18 }), " Adicionar Item"] })] }), _jsxs("div", { className: "budget-table", children: [_jsxs("div", { className: "budget-table-header", children: [_jsx("span", { children: "Categoria" }), _jsx("span", { children: "Descricao do item" }), _jsx("span", { children: "Quantidade" }), _jsx("span", { children: "Valor unit. (R$)" }), _jsx("span", { children: "Total" }), _jsx("span", {})] }), totals.itemTotals.map((item) => {
                                const categoryValue = normalizeCategory(String(item.category));
                                return (_jsxs("div", { className: "budget-table-row", children: [_jsxs("label", { className: "budget-table-category", children: [_jsx("span", { className: "budget-summary-icon", children: categoryIconMap[categoryValue] ?? _jsx(Users, { size: 16 }) }), _jsx("select", { value: categoryValue, onChange: (event) => handleItemChange(item.id, { category: event.target.value }), children: ["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"].map((category) => (_jsx("option", { value: category, children: displayCategory(category) }, category))) })] }), _jsx("input", { className: "budget-input", value: item.description, onChange: (event) => handleItemChange(item.id, { description: event.target.value }), placeholder: "Ex: Desenvolvedor Frontend Senior" }), _jsx("input", { className: "budget-input budget-input--qty", type: "number", min: "0", step: "1", value: item.quantity, onChange: (event) => handleItemChange(item.id, { quantity: Number(event.target.value) }), placeholder: "0" }), _jsxs("div", { className: "budget-input-prefix", children: [_jsx("span", { children: "R$" }), _jsx("input", { className: "budget-input budget-input--value", type: "number", min: "0", step: "0.01", value: item.unitValue, onChange: (event) => handleItemChange(item.id, { unitValue: Number(event.target.value) }), placeholder: "0,00" })] }), _jsx("strong", { children: currency(item.total) }), _jsx("button", { className: "budget-icon-button", type: "button", onClick: () => handleRemoveItem(item.id), children: _jsx(Trash2, { size: 16 }) })] }, item.id));
                            })] })] })] }));
};
export default ActivitiesPage;
