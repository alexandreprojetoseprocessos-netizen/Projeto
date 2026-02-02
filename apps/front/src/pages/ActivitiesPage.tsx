import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Calculator, Coins, Layers, Package, Plus, Trash2, TrendingUp, Users, Wrench } from "lucide-react";
import type { DashboardOutletContext } from "../components/DashboardLayout";

type BudgetCategory = "Mao de Obra" | "Material" | "Equipamento" | "Custos Indiretos" | "Outros";

const normalizeCategory = (value: string): BudgetCategory => {
  if (value === "M\u00E3o de Obra") return "Mao de Obra";
  return (value as BudgetCategory) ?? "Outros";
};

const displayCategory = (value: BudgetCategory): string => {
  if (value == "Mao de Obra") return "M\u00E3o de Obra";
  return value;
};

type BudgetItem = {
  id: string;
  category: BudgetCategory;
  description: string;
  quantity: number;
  unitValue: number;
};

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const formatNumberBR = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseNumberBR = (value: string) => {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const categoryIconMap: Record<BudgetCategory, JSX.Element> = {
  "Mao de Obra": <Users size={16} />,
  Material: <Package size={16} />,
  Equipamento: <Wrench size={16} />,
  "Custos Indiretos": <Layers size={16} />,
  Outros: <Coins size={16} />
};

const defaultItems: BudgetItem[] = [
  { id: "item-1", category: "Mao de Obra", description: "Desenvolvedor Frontend Senior", quantity: 160, unitValue: 150 },
  { id: "item-2", category: "Mao de Obra", description: "Desenvolvedor Backend Senior", quantity: 120, unitValue: 180 },
  { id: "item-3", category: "Mao de Obra", description: "Designer UI/UX", quantity: 80, unitValue: 120 },
  { id: "item-4", category: "Material", description: "Licenças de Software", quantity: 1, unitValue: 5000 },
  { id: "item-5", category: "Equipamento", description: "Servidor Cloud (12 meses)", quantity: 12, unitValue: 800 },
  { id: "item-6", category: "Custos Indiretos", description: "Custos Administrativos", quantity: 1, unitValue: 8000 }
];

export const ActivitiesPage = () => {
  const { selectedProject, selectedProjectId } = useOutletContext<DashboardOutletContext>();
  const storageKey = selectedProjectId && selectedProjectId !== "all" ? `budget:${selectedProjectId}` : null;

  const buildDefaultBudget = (): {
    projectName: string;
    projectValue: number;
    contingency: number;
    notes: string;
    items: BudgetItem[];
  } => ({
    projectName: selectedProject?.projectName ?? selectedProject?.name ?? "",
    projectValue: Number(selectedProject?.budget ?? 150000),
    contingency: 10,
    notes: "",
    items: defaultItems
  });

  const [budgetState, setBudgetState] = useState(buildDefaultBudget);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ReturnType<typeof buildDefaultBudget>>;
        const storedItems = Array.isArray(parsed.items) && parsed.items.length ? parsed.items : defaultItems;
        setBudgetState({
          ...buildDefaultBudget(),
          ...parsed,
          items: storedItems.map((item) => ({ ...item, category: normalizeCategory(String(item.category)) }))
        });
        return;
      }
    } catch {
      // ignore corrupted storage and fallback to defaults
    }
    setBudgetState(buildDefaultBudget());
  }, [storageKey, selectedProject?.projectName, selectedProject?.name, selectedProject?.budget]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(budgetState));
    } catch {
      // ignore storage errors
    }
  }, [storageKey, budgetState]);

  if (!selectedProjectId || selectedProjectId === "all") {
    return (
      <section className="budget-page">
        <header className="budget-header">
          <div>
            <h1>OrÃ§amento</h1>
            <p>Selecione um projeto especifico. Esta pagina nao permite "Todos".</p>
          </div>
        </header>
      </section>
    );
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

    const categories = (["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"] as BudgetCategory[]).map(
      (category) => ({
        category,
        total: itemTotals.filter((item) => item.category === category).reduce((acc, item) => acc + item.total, 0)
      })
    );

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
    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      category: "Outros",
      description: "Novo item de custo",
      quantity: 1,
      unitValue: 0
    };
    setBudgetState((prev) => ({ ...prev, items: [newItem, ...prev.items] }));
  };

  const handleRemoveItem = (id: string) => {
    setBudgetState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const handleItemChange = (id: string, changes: Partial<BudgetItem>) => {
    setBudgetState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    }));
  };

  return (
    <section className="budget-page">
      <header className="budget-header">
        <div>
          <h1>Orçamento</h1>
          <p>Gestão de custos e orçamento do projeto</p>
        </div>
      </header>

      <div className="budget-kpis">
        <article className="budget-kpi-card">
          <div className="budget-kpi-top">
            <span>Valor do Projeto</span>
            <Calculator size={18} />
          </div>
          <strong>{currency(projectValue)}</strong>
          <small>Valor contratado</small>
        </article>
        <article className="budget-kpi-card">
          <div className="budget-kpi-top">
            <span>Custo Total</span>
            <Layers size={18} />
          </div>
          <strong>{currency(totals.costTotal)}</strong>
          <small>Inclui {contingency}% de contingência</small>
        </article>
        <article className={`budget-kpi-card ${totals.profit < 0 ? "is-negative" : "is-positive"}`}>
          <div className="budget-kpi-top">
            <span>Lucro</span>
            <TrendingUp size={18} />
          </div>
          <strong>{currency(totals.profit)}</strong>
          <small>Margem de {totals.profitMargin.toFixed(1)}%</small>
        </article>
        <article className="budget-kpi-card">
          <div className="budget-kpi-top">
            <span>Mão de Obra</span>
            <Users size={18} />
          </div>
          <strong>{currency(totals.laborTotal)}</strong>
          <small>
            {totals.costTotal > 0 ? `${((totals.laborTotal / totals.costTotal) * 100).toFixed(1)}% do custo total` : "0% do custo total"}
          </small>
        </article>
      </div>

      <div className="budget-grid">
        <article className="budget-card">
          <header>
            <h2>Configurações do Orçamento</h2>
            <p>Defina os parâmetros gerais do orçamento</p>
          </header>

          <div className="budget-form">
            <label>
              <span>Nome do Projeto</span>
              <input value={projectName} readOnly placeholder="Nome do projeto" />
            </label>
            <label>
              <span>Valor do Projeto (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberBR(projectValue)}
                onChange={(event) =>
                  setBudgetState((prev) => ({ ...prev, projectValue: parseNumberBR(event.target.value) }))
                }
                placeholder="0,00"
              />
            </label>
            <label>
              <span>Contingência (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={contingency}
                onChange={(event) => setBudgetState((prev) => ({ ...prev, contingency: Number(event.target.value) }))}
              />
            </label>
            <label className="budget-textarea">
              <span>Observações</span>
              <textarea
                value={notes}
                onChange={(event) => setBudgetState((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notas adicionais sobre o orçamento..."
                rows={4}
              />
            </label>
          </div>
        </article>

        <article className="budget-card budget-summary">
          <header>
            <h2>Resumo por Categoria</h2>
            <p>Distribuição dos custos</p>
          </header>
          <div className="budget-summary-list">
            {totals.categories.map((category) => (
              <div key={category.category} className="budget-summary-row">
                <div className="budget-summary-label">
                  <span className="budget-summary-icon">{categoryIconMap[category.category]}</span>
                  <span>{category.category}</span>
                </div>
                <strong>{currency(category.total)}</strong>
              </div>
            ))}
          </div>
          <div className="budget-summary-footer">
            <div>
              <span>Subtotal</span>
              <strong>{currency(totals.subtotal)}</strong>
            </div>
            <div>
              <span>Contingência ({contingency}%)</span>
              <span>{currency(totals.contingencyValue)}</span>
            </div>
            <div className="budget-summary-total">
              <span>Total</span>
              <strong>{currency(totals.costTotal)}</strong>
            </div>
          </div>
        </article>
      </div>

      <article className="budget-card budget-items">
        <header className="budget-items-header">
          <div>
            <h2>Itens de Custo</h2>
            <p>Lista detalhada de todos os custos do projeto</p>
          </div>
          <button className="budget-primary-button" type="button" onClick={handleAddItem}>
            <Plus size={18} /> Adicionar Item
          </button>
        </header>

        <div className="budget-table">
          <div className="budget-table-header">
            <span>Categoria</span>
            <span>Descricao do item</span>
            <span>Quantidade</span>
            <span>Valor unit. (R$)</span>
            <span>Total</span>
            <span></span>
          </div>
          {totals.itemTotals.map((item) => {
            const categoryValue = normalizeCategory(String(item.category));
            return (
              <div key={item.id} className="budget-table-row">
                <label className="budget-table-category">
                  <span className="budget-summary-icon">{categoryIconMap[categoryValue] ?? <Users size={16} />}</span>
                  <select
                    value={categoryValue}
                    onChange={(event) => handleItemChange(item.id, { category: event.target.value as BudgetCategory })}
                  >
                    {(["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"] as BudgetCategory[]).map(
                      (category) => (
                        <option key={category} value={category}>
                          {displayCategory(category)}
                        </option>
                      )
                    )}
                  </select>
                </label>
              <input
                className="budget-input"
                value={item.description}
                onChange={(event) => handleItemChange(item.id, { description: event.target.value })}
                placeholder="Ex: Desenvolvedor Frontend Senior"
              />
              <input
                className="budget-input budget-input--qty"
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={(event) => handleItemChange(item.id, { quantity: Number(event.target.value) })}
                placeholder="0"
              />
              <div className="budget-input-prefix">
                <span>R$</span>
                <input
                  className="budget-input budget-input--value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitValue}
                  onChange={(event) => handleItemChange(item.id, { unitValue: Number(event.target.value) })}
                  placeholder="0,00"
                />
              </div>
              <strong>{currency(item.total)}</strong>
              <button className="budget-icon-button" type="button" onClick={() => handleRemoveItem(item.id)}>
                <Trash2 size={16} />
              </button>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default ActivitiesPage;
