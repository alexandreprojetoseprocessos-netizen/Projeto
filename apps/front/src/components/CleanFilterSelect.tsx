import { useEffect, useMemo, useRef, useState } from "react";

export type CleanFilterSelectOption = {
  value: string;
  label: string;
};

type CleanFilterSelectProps = {
  value: string;
  options: CleanFilterSelectOption[];
  onChange: (nextValue: string) => void;
  ariaLabel?: string;
  size?: "default" | "small";
};

export const CleanFilterSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  size = "default",
}: CleanFilterSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={`clean-filter-select ${size === "small" ? "clean-filter-select--small" : ""}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`clean-filter-select__trigger ${isOpen ? "is-open" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="clean-filter-select__value" title={selected?.label ?? ""}>
          {selected?.label ?? "Todos"}
        </span>
        <span className="clean-filter-select__caret" aria-hidden="true">
          v
        </span>
      </button>

      {isOpen && (
        <div className="clean-filter-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`clean-filter-select__option ${isSelected ? "is-selected" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                title={option.label}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

