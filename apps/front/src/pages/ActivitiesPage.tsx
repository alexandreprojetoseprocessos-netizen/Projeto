import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Calculator, CheckCircle2, Coins, Layers, Loader2, Package, Plus, Save, Trash2, TrendingUp, Users, Wrench } from "lucide-react";
import { apiRequest, getApiErrorMessage } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { AppPageHero, AppStateCard } from "../components/AppPageHero";

type BudgetCategory = "Mao de Obra" | "Material" | "Equipamento" | "Custos Indiretos" | "Outros";

type BudgetItem = {
  id: string;
  category: BudgetCategory;
  description: string;
  quantity: number;
  unitValue: number;
};

type BudgetState = {
  projectName: string;
  projectValue: number;
  contingency: number;
  notes: string;
  items: BudgetItem[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BUDGET_CATEGORIES: BudgetCategory[] = ["Mao de Obra", "Material", "Equipamento", "Custos Indiretos", "Outros"];

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const formatNumberBR = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseNumberBR = (value: string) => {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toSafeNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
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

const normalizeCategory = (value: unknown): BudgetCategory => {
  if (value === "Mao de Obra" || value === "Mão de Obra") return "Mao de Obra";
  if (value === "Material") return "Material";
  if (value === "Equipamento") return "Equipamento";
  if (value === "Custos Indiretos") return "Custos Indiretos";
  return "Outros";
};

const displayCategory = (value: BudgetCategory): string => {
  if (value === "Mao de Obra") return "Mão de Obra";
  return value;
};

const categoryIconMap: Record<BudgetCategory, JSX.Element> = {
  "Mao de Obra": <Users size={16} />,
  Material: <Package size={16} />,
  Equipamento: <Wrench size={16} />,
  "Custos Indiretos": <Layers size={16} />,
  Outros: <Coins size={16} />
};

const defaultItems: BudgetItem[] = [
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

const buildPayloadFromBudget = (budget: BudgetState) => ({
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

const normalizeIncomingItems = (items: unknown): BudgetItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const source = (item ?? {}) as Record<string, unknown>;
      const id = typeof source.id === "string" && source.id.trim() ? source.id.trim() : createBudgetItemId();
      return {
        id,
        category: normalizeCategory(source.category),
        description:
          typeof source.description === "string" && source.description.trim()
            ? source.description.trim()
            : `Item de custo ${index + 1}`,
        quantity: clampNumber(toSafeNumber(source.quantity, 0), 0, 1000000),
        unitValue: clampNumber(toSafeNumber(source.unitValue, 0), 0, 1000000000)
      } as BudgetItem;
    })
    .slice(0, 500);
};

const computeBudgetTotals = (items: BudgetItem[], contingency: number, projectValue: number) => {
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
};

export const ActivitiesPage = () => {
  const { token } = useAuth();
  const { selectedProject, selectedProjectId, selectedOrganizationId } = useOutletContext<DashboardOutletContext>();
  const normalizedSelectedOrganizationId = (() => {
    const raw = selectedOrganizationId?.trim() ?? "";
    return UUID_REGEX.test(raw) ? raw : "";
  })();
  const normalizedSelectedProjectId = (() => {
    const raw = selectedProjectId?.trim() ?? "";
    return UUID_REGEX.test(raw) ? raw : "";
  })();

  const buildDefaultBudget = useCallback((): BudgetState => {
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

  const [budgetState, setBudgetState] = useState<BudgetState>(() => buildDefaultBudget());
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const hydratedRef = useRef(false);
  const lastSyncedPayloadRef = useRef("");
  const saveSequenceRef = useRef(0);

  const saveBudget = useCallback(
    async (payload: ReturnType<typeof buildPayloadFromBudget>, serialized: string) => {
      if (!token || !normalizedSelectedOrganizationId || !normalizedSelectedProjectId) return;

      const requestSequence = saveSequenceRef.current + 1;
      saveSequenceRef.current = requestSequence;

      setSaveStatus("saving");
      setSaveError(null);

      try {
        await apiRequest(`/projects/${normalizedSelectedProjectId}/budget`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Organization-Id": normalizedSelectedOrganizationId
          },
          body: JSON.stringify(payload)
        });

        if (requestSequence !== saveSequenceRef.current) return;

        lastSyncedPayloadRef.current = serialized;
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch (error) {
        if (requestSequence !== saveSequenceRef.current) return;
        setSaveStatus("error");
        setSaveError(getApiErrorMessage(error, "Falha ao salvar orcamento"));
      }
    },
    [normalizedSelectedOrganizationId, normalizedSelectedProjectId, token]
  );

  useEffect(() => {
    if (!normalizedSelectedProjectId) {
      const fallback = buildDefaultBudget();
      setBudgetState(fallback);
      hydratedRef.current = false;
      setBudgetError(null);
      setSaveError(null);
      setSaveStatus("idle");
      return;
    }

    if (!token || !normalizedSelectedOrganizationId) {
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
        const body = await apiRequest<{ budget?: Record<string, unknown> }>(`/projects/${normalizedSelectedProjectId}/budget`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Organization-Id": normalizedSelectedOrganizationId
          }
        });

        if (!active) return;

        const apiBudget = (body?.budget ?? {}) as Record<string, unknown>;
        const fallback = buildDefaultBudget();
        const items = normalizeIncomingItems(apiBudget.items);

        const nextBudget: BudgetState = {
          projectName:
            typeof apiBudget.projectName === "string" && apiBudget.projectName.trim()
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
      } catch (error) {
        if (!active) return;
        setBudgetError(getApiErrorMessage(error, "Falha ao carregar orcamento"));
      } finally {
        if (active) {
          setLoadingBudget(false);
        }
      }
    };

    loadBudget();

    return () => {
      active = false;
    };
  }, [buildDefaultBudget, normalizedSelectedOrganizationId, normalizedSelectedProjectId, token]);

  useEffect(() => {
    if (!hydratedRef.current || loadingBudget) return;
    if (!normalizedSelectedProjectId) return;
    if (!token || !normalizedSelectedOrganizationId) return;

    const payload = buildPayloadFromBudget(budgetState);
    const serialized = JSON.stringify(payload);

    if (serialized === lastSyncedPayloadRef.current) return;

    const timeoutId = window.setTimeout(() => {
      saveBudget(payload, serialized);
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [budgetState, loadingBudget, normalizedSelectedOrganizationId, normalizedSelectedProjectId, saveBudget, token]);

  const handleSaveNow = async () => {
    if (!normalizedSelectedProjectId) return;
    if (!token || !normalizedSelectedOrganizationId) return;

    const payload = buildPayloadFromBudget(budgetState);
    const serialized = JSON.stringify(payload);
    await saveBudget(payload, serialized);
  };

  const { projectName, projectValue, contingency, notes } = budgetState;
  const items = Array.isArray(budgetState.items) ? budgetState.items : [];
  const totals = computeBudgetTotals(items, contingency, projectValue);

  if (!normalizedSelectedProjectId) {
    return (
      <section className="budget-page">
        <AppPageHero
          kicker="Gestao financeira"
          title="Orcamento"
          subtitle="Controle custos, margem e composicao financeira por projeto."
        />
        <AppStateCard
          tone="warning"
          title="Selecione um projeto especifico"
          description='Esta pagina nao trabalha com a opcao "Todos". Escolha um projeto no cabecalho para carregar os dados de orcamento.'
        />
      </section>
    );
  }

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      id: createBudgetItemId(),
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

  const saveStatusText =
    saveStatus === "saving"
      ? "Salvando no banco..."
      : saveStatus === "error"
      ? "Erro ao salvar"
      : lastSavedAt
      ? `Salvo em ${lastSavedAt.toLocaleTimeString("pt-BR")}`
      : "Sem alteracoes pendentes";

  return (
    <section className="budget-page">
      <AppPageHero
        className="budgetPageHero"
        kicker="Gestao financeira"
        title="Orcamento"
        subtitle={`Custos, margem e estrutura financeira do projeto ${projectName || "selecionado"}.`}
        actions={
          <div className="budget-save-controls">
            <span className={`budget-save-status is-${saveStatus}`}>{saveStatusText}</span>
            <button
              className="budget-primary-button"
              type="button"
              onClick={handleSaveNow}
              disabled={loadingBudget || saveStatus === "saving"}
            >
              {saveStatus === "saving" ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Salvar agora
            </button>
          </div>
        }
        stats={[
          {
            label: "Valor do projeto",
            value: currency(projectValue),
            helper: "Valor contratado",
            icon: <Calculator size={18} />,
            tone: "default"
          },
          {
            label: "Custo total",
            value: currency(totals.costTotal),
            helper: `Inclui ${contingency}% de contingencia`,
            icon: <Layers size={18} />,
            tone: "info"
          },
          {
            label: "Lucro",
            value: currency(totals.profit),
            helper: `Margem de ${totals.profitMargin.toFixed(1)}%`,
            icon: <TrendingUp size={18} />,
            tone: totals.profit < 0 ? "danger" : "success"
          },
          {
            label: "Mao de obra",
            value: currency(totals.laborTotal),
            helper:
              totals.costTotal > 0
                ? `${((totals.laborTotal / totals.costTotal) * 100).toFixed(1)}% do custo total`
                : "0% do custo total",
            icon: <Users size={18} />,
            tone: "warning"
          }
        ]}
      />

      {loadingBudget ? <p className="muted">Carregando orcamento...</p> : null}
      {budgetError ? <p className="error-text">{budgetError}</p> : null}
      {saveError ? <p className="error-text">{saveError}</p> : null}

      <div className="budget-grid">
        <article className="budget-card">
          <header>
            <h2>Configuracoes do Orcamento</h2>
            <p>Defina os parametros gerais do orcamento</p>
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
                  setBudgetState((prev) => ({ ...prev, projectValue: clampNumber(parseNumberBR(event.target.value), 0, 1000000000) }))
                }
                placeholder="0,00"
              />
            </label>
            <label>
              <span>Contingencia (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={contingency}
                onChange={(event) =>
                  setBudgetState((prev) => ({
                    ...prev,
                    contingency: clampNumber(toSafeNumber(event.target.value, prev.contingency), 0, 100)
                  }))
                }
              />
            </label>
            <label className="budget-textarea">
              <span>Observacoes</span>
              <textarea
                value={notes}
                onChange={(event) => setBudgetState((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notas adicionais sobre o orcamento..."
                rows={4}
              />
            </label>
          </div>
        </article>

        <article className="budget-card budget-summary">
          <header>
            <h2>Resumo por Categoria</h2>
            <p>Distribuicao dos custos</p>
          </header>
          <div className="budget-summary-list">
            {totals.categories.map((category) => (
              <div key={category.category} className="budget-summary-row">
                <div className="budget-summary-label">
                  <span className="budget-summary-icon">{categoryIconMap[category.category]}</span>
                  <span>{displayCategory(category.category)}</span>
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
              <span>Contingencia ({contingency}%)</span>
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
                    onChange={(event) => handleItemChange(item.id, { category: normalizeCategory(event.target.value) })}
                  >
                    {BUDGET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {displayCategory(category)}
                      </option>
                    ))}
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
                  onChange={(event) =>
                    handleItemChange(item.id, {
                      quantity: clampNumber(toSafeNumber(event.target.value, item.quantity), 0, 1000000)
                    })
                  }
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
                    onChange={(event) =>
                      handleItemChange(item.id, {
                        unitValue: clampNumber(toSafeNumber(event.target.value, item.unitValue), 0, 1000000000)
                      })
                    }
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

      {saveStatus === "saved" ? (
        <p className="muted budget-saved-hint">
          <CheckCircle2 size={14} /> Alteracoes salvas no banco para este projeto.
        </p>
      ) : null}
    </section>
  );
};

export default ActivitiesPage;

