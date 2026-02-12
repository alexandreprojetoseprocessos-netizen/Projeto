import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DependencyOption {
  id: string;
  name: string;
  displayCode: string;
  wbsCode?: string;
}

interface DependenciesDropdownProps {
  options: DependencyOption[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  onApplyDownChain?: () => void;
  currentTaskName?: string;
  currentTaskCode?: string;
  disabled?: boolean;
  disabledReason?: string;
}

type LevelFilter = "all" | "1" | "2" | "3plus";

const parseWbsLevel = (code: string): number | null => {
  const normalized = String(code ?? "").trim();
  if (!normalized) return null;
  if (!/^\d+(\.\d+)*$/.test(normalized)) return null;
  return normalized.split(".").length;
};

const compareDisplayCode = (a: string, b: string): number => {
  const leftParts = String(a ?? "").split(".").map((part) => Number(part));
  const rightParts = String(b ?? "").split(".").map((part) => Number(part));
  const maxLen = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLen; index += 1) {
    const left = Number.isFinite(leftParts[index]) ? leftParts[index] : Number.POSITIVE_INFINITY;
    const right = Number.isFinite(rightParts[index]) ? rightParts[index] : Number.POSITIVE_INFINITY;
    if (left !== right) return left - right;
  }

  return String(a).localeCompare(String(b));
};

export const DependenciesDropdown: React.FC<DependenciesDropdownProps> = ({
  options,
  selectedIds,
  onChange,
  onApplyDownChain,
  currentTaskName,
  currentTaskCode,
  disabled = false,
  disabledReason
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMenu = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleToggleOption = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  useEffect(() => {
    if (disabled && isOpen) {
      closeMenu();
      return;
    }
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, disabled]);

  const optionsWithMeta = useMemo(
    () =>
      options.map((option) => {
        const optionCode = option.displayCode ?? option.wbsCode ?? option.id;
        return {
          ...option,
          optionCode,
          level: parseWbsLevel(optionCode)
        };
      }),
    [options]
  );

  const selectedCodes = selectedIds
    .map((id) => optionsWithMeta.find((option) => option.id === id)?.displayCode)
    .filter((code): code is string => Boolean(code));

  let label = "Sem dependencias";
  if (selectedCodes.length === 1) {
    label = `Dep: ${selectedCodes[0]}`;
  } else if (selectedCodes.length > 1) {
    const firstTwo = selectedCodes.slice(0, 2).join(", ");
    const rest = selectedCodes.length - 2;
    label = rest > 0 ? `Dep: ${firstTwo} +${rest}` : `Dep: ${firstTwo}`;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredOptions = optionsWithMeta
    .filter((option) => {
      if (levelFilter === "1") return option.level === 1;
      if (levelFilter === "2") return option.level === 2;
      if (levelFilter === "3plus") return (option.level ?? 0) >= 3;
      return true;
    })
    .filter((option) => {
      if (!normalizedSearch) return true;
      const haystack = `${option.optionCode} ${option.name}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .sort((left, right) => compareDisplayCode(left.optionCode, right.optionCode));

  const normalizedCurrentTaskName = String(currentTaskName ?? "").trim();
  const normalizedCurrentTaskCode = String(currentTaskCode ?? "").trim();
  const currentTaskLabel = normalizedCurrentTaskCode
    ? `${normalizedCurrentTaskCode} - ${normalizedCurrentTaskName || "Tarefa sem nome"}`
    : normalizedCurrentTaskName;

  const addLevelDependencies = (level: number) => {
    if (disabled) return;
    const ids = optionsWithMeta.filter((option) => option.level === level).map((option) => option.id);
    if (!ids.length) return;
    onChange(Array.from(new Set([...selectedIds, ...ids])));
  };

  return (
    <div className="dependencies-dropdown" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        className={`dependencies-dropdown__trigger${isOpen ? " is-open" : ""}`}
        aria-expanded={isOpen}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <span className="dependencies-dropdown__label-text">{label}</span>
        <span className="dependencies-dropdown__caret" aria-hidden="true">
          v
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div className="dependencies-menu-overlay" ref={menuRef} onMouseDown={closeMenu}>
            <div className="dependencies-dropdown__panel dependencies-dropdown__panel--modal" onMouseDown={(event) => event.stopPropagation()}>
              <div className="dependencies-dropdown__header">
                <div>
                  <h4>Selecione predecessoras</h4>
                  <p>Marque as tarefas das quais esta atividade depende.</p>
                  {currentTaskLabel && (
                    <div className="dependencies-dropdown__current-task" title={currentTaskLabel}>
                      <span className="dependencies-dropdown__current-task-label">Linha atual</span>
                      <strong className="dependencies-dropdown__current-task-value">{currentTaskLabel}</strong>
                    </div>
                  )}
                </div>
                <button type="button" className="dependencies-dropdown__close" onClick={closeMenu} aria-label="Fechar">
                  x
                </button>
              </div>

              <div className="dependencies-dropdown__toolbar">
                <span className="dependencies-dropdown__count">
                  {selectedIds.length} selecionada{selectedIds.length === 1 ? "" : "s"}
                </span>
                <div className="dependencies-dropdown__quick-actions">
                  <button type="button" className="dependencies-dropdown__chip" onClick={() => addLevelDependencies(1)}>
                    Nivel 1
                  </button>
                  <button type="button" className="dependencies-dropdown__chip" onClick={() => addLevelDependencies(2)}>
                    Nivel 2
                  </button>
                  <button type="button" className="dependencies-dropdown__chip" onClick={() => onChange([])}>
                    Limpar
                  </button>
                </div>
              </div>

              {onApplyDownChain && !disabled && (
                <button
                  type="button"
                  className="dependencies-dropdown__chain"
                  onClick={() => {
                    onApplyDownChain();
                    closeMenu();
                  }}
                >
                  Dependencia para baixo (todos os niveis)
                </button>
              )}

              <div className="dependencies-dropdown__search">
                <input
                  type="search"
                  placeholder="Pesquisar tarefa..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                />
              </div>

              <div className="dependencies-dropdown__filters">
                <button
                  type="button"
                  className={`dependencies-dropdown__chip ${levelFilter === "all" ? "is-active" : ""}`}
                  onClick={() => setLevelFilter("all")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`dependencies-dropdown__chip ${levelFilter === "1" ? "is-active" : ""}`}
                  onClick={() => setLevelFilter("1")}
                >
                  Nivel 1
                </button>
                <button
                  type="button"
                  className={`dependencies-dropdown__chip ${levelFilter === "2" ? "is-active" : ""}`}
                  onClick={() => setLevelFilter("2")}
                >
                  Nivel 2
                </button>
                <button
                  type="button"
                  className={`dependencies-dropdown__chip ${levelFilter === "3plus" ? "is-active" : ""}`}
                  onClick={() => setLevelFilter("3plus")}
                >
                  Nivel 3+
                </button>
              </div>

              <div className="dependencies-dropdown__list">
                {filteredOptions.map((option) => (
                  <label
                    key={option.id}
                    className="dependencies-dropdown__item"
                    title={`${option.optionCode} - ${option.name}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(option.id)}
                      onChange={() => handleToggleOption(option.id)}
                    />
                    <span className="dependencies-dropdown__label">
                      <span className="dependencies-dropdown__code">{option.optionCode}</span>
                      <span className="dependencies-dropdown__name">{option.name}</span>
                    </span>
                  </label>
                ))}

                {filteredOptions.length === 0 && (
                  <p className="dependencies-dropdown__empty">Nao ha outras tarefas para selecionar como predecessoras.</p>
                )}
              </div>

              <div className="dependencies-dropdown__footer">
                <button type="button" className="dependencies-dropdown__done" onClick={closeMenu}>
                  Concluir
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
