import React, { useEffect, useRef, useState } from "react";

export interface DependencyOption {
  id: string;
  wbsCode: string;
  name: string;
}

interface DependenciesDropdownProps {
  options: DependencyOption[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
}

export const DependenciesDropdown: React.FC<DependenciesDropdownProps> = ({
  options,
  selectedIds,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleOpen = () => setOpen((prev) => !prev);

  const handleToggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const label =
    selectedIds.length === 0
      ? "Sem dependências"
      : `${selectedIds.length} dependência${selectedIds.length > 1 ? "s" : ""} selecionada${
          selectedIds.length > 1 ? "s" : ""
        }`;

  return (
    <div className="dependencies-dropdown" ref={containerRef}>
      <button type="button" onClick={toggleOpen} className="dependencies-dropdown__trigger">
        <span>{label}</span>
        <span className="dependencies-dropdown__caret">▾</span>
      </button>

      {open && (
        <div className="dependencies-dropdown__panel">
          <div className="dependencies-dropdown__header">
            <h4>Selecione predecessoras</h4>
            <p>Marque as tarefas das quais esta atividade depende.</p>
          </div>

          <div className="dependencies-dropdown__list">
            {options.map((opt) => (
              <label key={opt.id} className="dependencies-dropdown__item" title={`${opt.wbsCode} - ${opt.name}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(opt.id)}
                  onChange={() => handleToggleOption(opt.id)}
                />
                <span className="dependencies-dropdown__label">
                  <strong>{opt.wbsCode}</strong> {opt.name}
                </span>
              </label>
            ))}

            {options.length === 0 && (
              <p className="dependencies-dropdown__empty">
                Não há outras tarefas para selecionar como predecessoras.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
