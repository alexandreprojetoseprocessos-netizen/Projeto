import React, { useEffect, useRef, useState } from "react";
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
}

export const DependenciesDropdown: React.FC<DependenciesDropdownProps> = ({
  options,
  selectedIds,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen((prev) => !prev);
  };

  const handleToggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideButton = containerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideButton && !insideMenu) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const selectedCodes = selectedIds
    .map((id) => options.find((opt) => opt.id === id)?.displayCode)
    .filter((code): code is string => Boolean(code));

  let label = "Sem dependências";

  if (selectedCodes.length === 1) {
    label = `Dep: ${selectedCodes[0]}`;
  } else if (selectedCodes.length > 1) {
    const firstTwo = selectedCodes.slice(0, 2).join(", ");
    const rest = selectedCodes.length - 2;
    label = rest > 0 ? `Dep: ${firstTwo} +${rest}` : `Dep: ${firstTwo}`;
  }

  return (
    <div className="dependencies-dropdown" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className="dependencies-dropdown__trigger"
      >
        <span>{label}</span>
        <span className="dependencies-dropdown__caret">▾</span>
      </button>

      {isOpen &&
        menuPosition &&
        createPortal(
          <div
            className="dependencies-menu-overlay"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999
            }}
            ref={menuRef}
          >
            <div className="dependencies-menu-panel">
              <div className="dependencies-dropdown__header">
                <h4>Selecione predecessoras</h4>
                <p>Marque as tarefas das quais esta atividade depende.</p>
              </div>

              <div className="dependencies-dropdown__list">
                {options.map((opt) => {
                  const optionCode = opt.displayCode ?? opt.wbsCode ?? opt.id;

                  return (
                    <label
                      key={opt.id}
                      className="dependencies-dropdown__item"
                      title={`${optionCode} - ${opt.name}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(opt.id)}
                        onChange={() => handleToggleOption(opt.id)}
                      />
                      <span className="dependencies-dropdown__label">
                        <strong>{optionCode}</strong> {opt.name}
                      </span>
                    </label>
                  );
                })}

                {options.length === 0 && (
                  <p className="dependencies-dropdown__empty">
                    Não há outras tarefas para selecionar como predecessoras.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
